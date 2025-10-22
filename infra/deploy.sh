set -euo pipefail
REGION=us-east-2
DOMAIN=api.101monkeys.com
HOSTED_ZONE_ID=Z07423751SYA1J4WPGIDQ
APIGW_DOMAIN=d-m8rybssbvp.execute-api.us-east-2.amazonaws.com
APIGW_ZONE=ZOJJZC49E0EPZ
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Route53 alias
aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --change-batch "{
  \"Changes\": [{
    \"Action\": \"UPSERT\",
    \"ResourceRecordSet\": {
      \"Name\": \"$DOMAIN.\",
      \"Type\": \"A\",
      \"AliasTarget\": {\"HostedZoneId\": \"$APIGW_ZONE\", \"DNSName\": \"$APIGW_DOMAIN.\", \"EvaluateTargetHealth\": false}
    }
  }]
}"

# DynamoDB + PITR + TTL
for T in YogaProtocolLibrary UserProfiles ANSLongitudinalData AnonymizedTrainingData; do
  if ! aws dynamodb describe-table --table-name $T --region $REGION >/dev/null 2>&1; then
    case $T in
      YogaProtocolLibrary)
        aws dynamodb create-table --region $REGION --table-name $T --billing-mode PAY_PER_REQUEST \
          --attribute-definitions AttributeName=ProtocolID,AttributeType=S \
          --key-schema AttributeName=ProtocolID,KeyType=HASH;;
      UserProfiles)
        aws dynamodb create-table --region $REGION --table-name $T --billing-mode PAY_PER_REQUEST \
          --attribute-definitions AttributeName=UserID,AttributeType=S \
          --key-schema AttributeName=UserID,KeyType=HASH;;
      ANSLongitudinalData)
        aws dynamodb create-table --region $REGION --table-name $T --billing-mode PAY_PER_REQUEST \
          --attribute-definitions AttributeName=UserID,AttributeType=S AttributeName=Timestamp,AttributeType=S \
          --key-schema AttributeName=UserID,KeyType=HASH AttributeName=Timestamp,KeyType=RANGE;;
      AnonymizedTrainingData)
        aws dynamodb create-table --region $REGION --table-name $T --billing-mode PAY_PER_REQUEST \
          --attribute-definitions AttributeName=AnonID,AttributeType=S AttributeName=Timestamp,AttributeType=S \
          --key-schema AttributeName=AnonID,KeyType=HASH AttributeName=Timestamp,KeyType=RANGE;;
    esac
  fi
  aws dynamodb update-continuous-backups --region $REGION --table-name $T --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
  aws dynamodb update-time-to-live --region $REGION --table-name $T --time-to-live-specification "Enabled=true, AttributeName=ttl" || true
done

# KMS + Secret
KMS_KEY=$(aws kms create-key --region $REGION --query KeyMetadata.KeyId --output text)
aws kms create-alias --region $REGION --alias-name alias/phi-salt --target-key-id "$KMS_KEY"
SALT=$(openssl rand -base64 48)
aws secretsmanager create-secret --region $REGION --name phi/pseudonymizer/salt --kms-key-id "$KMS_KEY" --secret-string "$SALT" >/dev/null

# Cognito User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool --pool-name pacer-pool --region $REGION --query UserPool.Id --output text)
USER_POOL_CLIENT_ID=$(aws cognito-idp create-user-pool-client --user-pool-id $USER_POOL_ID --client-name pacer-client --no-generate-secret --region $REGION --query UserPoolClient.ClientId --output text)

# Role + Policy
cat > trust.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
ROLE_ARN=$(aws iam create-role --role-name pacer-lambda-role --assume-role-policy-document file://trust.json --query Role.Arn --output text)
aws iam attach-role-policy --role-name pacer-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

cat > inline.json <<EOF
{"Version":"2012-10-17","Statement":[
  {"Effect":"Allow","Action":["dynamodb:*"],"Resource":"*"},
  {"Effect":"Allow","Action":["secretsmanager:GetSecretValue"],"Resource":"*"},
  {"Effect":"Allow","Action":["kms:Decrypt"],"Resource":"arn:aws:kms:$REGION:$ACCOUNT_ID:key/$KMS_KEY"}
]}
EOF
aws iam put-role-policy --role-name pacer-lambda-role --policy-name pacer-inline --policy-document file://inline.json

# --- Lambda Deployment ---
# Create deployment packages (zip files)
(cd lambda/pacer && zip /tmp/dec.zip pacer_decision_engine.py)
(cd lambda/pacer && zip /tmp/log.zip log_post_protocol_data.py)
(cd lambda/data && zip /tmp/p.zip phi_pseudonymizer.py)

DEC_ARN=$(aws lambda create-function --region $REGION --function-name PacerDecisionEngine --runtime python3.11 --handler pacer_decision_engine.handler --role $ROLE_ARN --zip-file fileb:///tmp/dec.zip --query FunctionArn --output text)
LOG_ARN=$(aws lambda create-function --region $REGION --function-name LogPostProtocolData --runtime python3.11 --handler log_post_protocol_data.handler --role $ROLE_ARN --zip-file fileb:///tmp/log.zip --query FunctionArn --output text)
PSEU_ARN=$(aws lambda create-function --region $REGION --function-name phi_pseudonymizer --runtime python3.11 --handler phi_pseudonymizer.handler --role $ROLE_ARN --zip-file fileb:///tmp/p.zip --query FunctionArn --output text)

# --- allow PacerDecisionEngine's execution role to invoke pseudonymizer ---

# 1) Caller IAM policy (least-privilege to THIS function only)
cat > invoke-pseudonymizer.json <<EOF
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Action":["lambda:InvokeFunction"],
      "Resource":"$PSEU_ARN"
    }
  ]
}
EOF
aws iam put-role-policy \
  --role-name pacer-lambda-role \
  --policy-name pacer-invoke-pseudonymizer \
  --policy-document file://invoke-pseudonymizer.json

# 2) Target resource policy (allow that role to call this function)
aws lambda add-permission \
  --region "$REGION" \
  --function-name "$PSEU_ARN" \
  --statement-id AllowInvokeFromPacerRole \
  --action lambda:InvokeFunction \
  --principal "arn:aws:iam::$ACCOUNT_ID:role/pacer-lambda-role"

# API Gateway + CORS
API_ID=$(aws apigatewayv2 create-api --region $REGION --name pacer-api --protocol-type HTTP --query ApiId --output text)
aws apigatewayv2 update-api --region $REGION --api-id $API_ID --cors-configuration '{"AllowOrigins":["*"],"AllowMethods":["POST","OPTIONS"],"AllowHeaders":["content-type"],"MaxAge":3600}'

for route in "POST /pacer/data $DEC_ARN" "POST /pacer/log $LOG_ARN"; do
  METHOD=$(echo $route | cut -d' ' -f1)
  PATH=$(echo $route | cut -d' ' -f2)
  LAMBDA=$(echo $route | cut -d' ' -f3)
  INT_ID=$(aws apigatewayv2 create-integration --region $REGION --api-id $API_ID --integration-type AWS_PROXY --integration-uri $LAMBDA --payload-format-version 2.0 --query IntegrationId --output text)
  aws apigatewayv2 create-route --region $REGION --api-id $API_ID --route-key "$METHOD $PATH" --target integrations/$INT_ID
done

aws apigatewayv2 create-stage --region $REGION --api-id $API_ID --stage-name prod --auto-deploy
aws apigatewayv2 create-api-mapping --region $REGION --domain-name $DOMAIN --api-id $API_ID --stage prod

# --- CORS & Authorizer (HTTP API) ---
AUTH_ID=$(aws apigatewayv2 create-authorizer --region "$REGION" \
  --api-id "$API_ID" --authorizer-type JWT --name "cognito-jwt" \
  --identity-source '$request.header.Authorization' \
  --jwt-configuration "{\"Issuer\":\"https://cognito-idp.$REGION.amazonaws.com/$USER_POOL_ID\",\"Audience\":[\"$USER_POOL_CLIENT_ID\"]}" \
  --query AuthorizerId --output text)

# Update routes to require auth
for RK in "POST /pacer/data" "POST /pacer/log"; do
  RID=$(aws apigatewayv2 get-routes --region "$REGION" --api-id "$API_ID" \
    --query "Items[?RouteKey=='$RK'].RouteId" --output text)
  aws apigatewayv2 update-route --region "$REGION" --api-id "$API_ID" --route-id "$RID" \
    --authorization-type JWT --authorizer-id "$AUTH_ID"
done

# CORS
aws apigatewayv2 update-api --region "$REGION" --api-id "$API_ID" \
  --cors-configuration '{
    "AllowHeaders":["Content-Type","Authorization","x-idempotency-key"],
    "AllowMethods":["POST","OPTIONS"],
    "AllowOrigins":["https://101monkeys.com","https://www.101monkeys.com","https://*.101monkeys.com","*"],
    "ExposeHeaders":["Content-Type","x-request-id"],
    "MaxAge":300
  }'

# Lambda env for decision engine
aws lambda update-function-configuration --region "$REGION" \
  --function-name PacerDecisionEngine \
  --environment "Variables={ANS_TABLE=ANSLongitudinalData,PROTO_TABLE=YogaProtocolLibrary,PSEUDONYMIZER_FN=$PSEU_ARN,CORS_ORIGIN=https://101monkeys.com}"

# Seed protocols
aws dynamodb put-item --region $REGION --table-name YogaProtocolLibrary --item '{"ProtocolID":{"S":"BREATH_1"},"Name":{"S":"Box Breathing"},"VideoURL":{"S":"https://cdn.101monkeys.com/protocols/box-breathing.mp4"}}'
aws dynamodb put-item --region $REGION --table-name YogaProtocolLibrary --item '{"ProtocolID":{"S":"RELAX_1"},"Name":{"S":"Soothing Flow"},"VideoURL":{"S":"https://cdn.101monkeys.com/protocols/soothing-flow.mp4"}}'

# Smoke test
curl -s https://api.101monkeys.com/pacer/data -X POST -H "Content-Type: application/json" -d '{"userId":"U1","rmssd":22,"timestamp":"2025-10-21T23:20:00Z"}' | jq .
