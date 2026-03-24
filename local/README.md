# Local Development with LocalStack

This folder contains configuration for emulating AWS services locally using [LocalStack](https://localstack.cloud/).

## Prerequisites

- Docker and Docker Compose
- AWS CLI
- `zip` (for packaging Lambda functions)

## Getting Started

### 1. Start LocalStack

```bash
docker-compose -f local/docker-compose.yml up -d
```

### 2. Setup Resources

Run the setup script to create the DynamoDB table and deploy Lambda functions:

```bash
./local/setup-local.sh
```

### 3. Connect the React Webapp

The `react-webapp` is configured to point to LocalStack when running in development mode.

However, LocalStack's API Gateway URL can be dynamic. After running `setup-local.sh`, you might need to find the actual API ID if you want to use the full API Gateway emulation:

```bash
aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis
```

Alternatively, for simple local testing, the `aws-config.js` is set up to try a default LocalStack path.

## Calendar API (Python)

The Lambda functions in `app/calendar/api/` are already updated to detect the `LOCALSTACK_HOSTNAME` environment variable and point their `boto3` clients to the local endpoint.

## Note on Cognito

This setup currently focuses on the Calendar API and DynamoDB. Cognito is still pointed to the production User Pool. If you need local Cognito, you can enable it in the `SERVICES` list in `docker-compose.yml` and add it to the `setup-local.sh` script.
