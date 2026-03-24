#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up LocalStack for Lantern Lounge using OpenTofu...${NC}"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/health | grep -q "\"dynamodb\": \"\(running\|available\)\""; then
  echo -e "${YELLOW}⚠️  LocalStack is not running. Starting it with docker-compose...${NC}"
  docker-compose -f local/docker-compose.yml up -d
  echo -e "${YELLOW}⏳ Waiting for LocalStack to be ready...${NC}"
  until curl -s http://localhost:4566/health | grep -q "\"dynamodb\": \"\(running\|available\)\""; do
    sleep 2
  done
fi

# Function to apply tofu locally
apply_local() {
  local dir=$1
  echo -e "${GREEN}📦 Applying Tofu in $dir...${NC}"
  
  # Copy overrides
  cp local/local.tf "$dir/local_override.tf"
  cp local/backend_override.tf "$dir/backend_override.tf"
  
  cd "$dir"
  # Use -reconfigure to switch to local backend without trying to migrate state
  tofu init -reconfigure -input=false
  tofu apply -auto-approve -input=false \
    -var="environment=local" \
    -var="project_name=lantern-lounge"
  
  # Cleanup overrides to avoid accidental commits (though they are ignored)
  # rm local_override.tf backend_override.tf
  cd - > /dev/null
}

# 1. Setup Cognito (needed by Calendar)
apply_local "app/cognito"

# 2. Setup Calendar
apply_local "app/calendar"

echo -e "${GREEN}✨ LocalStack setup with OpenTofu complete!${NC}"
echo -e "DynamoDB: http://localhost:4566"
echo -e "Lambda:   http://localhost:4566"
