#!/bin/bash
set -euo pipefail

STACK_NAME="101MonkeysPacerStack"
REGION="us-east-2"
S3_BUCKET="lambda-code-$(aws sts get-caller-identity --query Account --output text)"

# Create S3 bucket if it doesn't exist
aws s3 mb "s3://${S3_BUCKET}" --region "$REGION" || true

# Package and upload lambda functions
for lambda_dir in lambda/*; do
    if [ -d "$lambda_dir" ]; then
        lambda_name=$(basename "$lambda_dir")
        zip -j "${lambda_name}.zip" "${lambda_dir}"/*
        aws s3 cp "${lambda_name}.zip" "s3://${S3_BUCKET}/${lambda_name}.zip"
        rm "${lambda_name}.zip"
    fi
done

# Create numpy layer
rm -rf layer
mkdir -p layer/python
pip install numpy -t layer/python
zip -r numpy_layer.zip layer
aws s3 cp numpy_layer.zip "s3://${S3_BUCKET}/numpy_layer.zip"
rm -rf layer numpy_layer.zip

echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file infra/cloudformation.yml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides "CodeS3Bucket=${S3_BUCKET}" \
    --region "$REGION"

echo "Stack deployment complete. Seeding data..."
python3 infra/protocol_data_seed.py

echo "Data seeding complete."
echo "---"
echo "Smoke Tests:"
echo "curl -s https://api.101monkeys.com/ | jq ."
echo "curl -s -X POST https://api.101monkeys.com/pacer/data \\"
echo "  -H \"Authorization: Bearer <JWT>\" -H \"Content-Type: application/json\" \\"
echo "  -d '{\"RMSSD\":28,\"RespRate\":14,\"RespVar\":0.6,\"IERatio\":1.8,\"PupilDiameterPV\":0.3,\"GazeStabilityScore\":0.7,\"Fatigue\":6,\"PEMScore\":3}'"
