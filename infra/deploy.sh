#!/bin/bash
set -e

# This script packages and deploys the backend infrastructure.

# Variables
STACK_NAME="PacerProtocol-Federated"
REGION="us-east-2"
TEMPLATE_FILE="cloudformation.yml"
# NOTE: This bucket must exist in the specified REGION before running the script.
S3_BUCKET="101monkeys-pacer-protocol-deployments"

echo "Packaging Lambda function..."
aws cloudformation package \
    --template-file $TEMPLATE_FILE \
    --s3-bucket $S3_BUCKET \
    --output-template-file packaged-template.yml

echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file packaged-template.yml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "Deployment complete."
