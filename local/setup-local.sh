#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up LocalStack for Lantern Lounge...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/health | grep -q "\"dynamodb\": \"\(running\|available\)\""; then
  echo -e "${YELLOW}⚠️  LocalStack is not running. Starting it with docker-compose...${NC}"
  docker-compose -f local/docker-compose.yml up -d
  echo -e "${YELLOW}⏳ Waiting for LocalStack to be ready...${NC}"
  until curl -s http://localhost:4566/health | grep -q "\"dynamodb\": \"\(running\|available\)\""; do
    sleep 2
  done
fi

# 1. Create DynamoDB Table
echo -e "${GREEN}📦 1/4: Creating DynamoDB Table...${NC}"
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --table-name lantern-lounge-calendar-items \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=date,AttributeType=S \
        AttributeName=gsipk,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\": \"ItemsByDate\", \"KeySchema\": [{\"AttributeName\": \"gsipk\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"date\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}, \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}}]" \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1 > /dev/null || echo "Table already exists"

# 2. Package Lambda functions
echo -e "${GREEN}📦 2/4: Packaging Lambda functions...${NC}"
cd app/calendar/api
zip -r ../calendar-api.zip . > /dev/null
cd ../../..

# 3. Create IAM Role for Lambda (mock)
echo -e "${GREEN}📦 3/4: Creating IAM Role for Lambda...${NC}"
aws --endpoint-url=http://localhost:4566 iam create-role \
    --role-name lambda-local-role \
    --assume-role-policy-document '{"Version": "2012-10-17","Statement": [{ "Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}' \
    --region us-east-1 > /dev/null || echo "Role already exists"

# 4. Create Lambda Functions
echo -e "${GREEN}📦 4/4: Creating Lambda Functions...${NC}"
functions=("get_items" "create_item" "update_item" "delete_item")
for func in "${functions[@]}"; do
  aws --endpoint-url=http://localhost:4566 lambda create-function \
      --function-name "lantern-lounge-$func" \
      --runtime python3.11 \
      --role arn:aws:iam::000000000000:role/lambda-local-role \
      --handler "$func.handler" \
      --zip-file fileb://app/calendar/calendar-api.zip \
      --environment "Variables={DYNAMODB_TABLE=lantern-lounge-calendar-items,LOCALSTACK_HOSTNAME=localhost}" \
      --region us-east-1 > /dev/null || \
  aws --endpoint-url=http://localhost:4566 lambda update-function-code \
      --function-name "lantern-lounge-$func" \
      --zip-file fileb://app/calendar/calendar-api.zip \
      --region us-east-1 > /dev/null
done

echo -e "${GREEN}✨ LocalStack setup complete!${NC}"
echo -e "DynamoDB: http://localhost:4566"
echo -e "Lambda:   http://localhost:4566"
