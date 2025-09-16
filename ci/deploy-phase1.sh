#!/bin/bash

# Phase 1 Deployment script for Lantern Lounge website
# This deploys basic infrastructure WITHOUT SSL validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Phase 1: Deploying basic infrastructure...${NC}"

# Check if infrastructure directory exists
if [ ! -d "../infrastructure" ]; then
    echo -e "${RED}❌ infrastructure directory not found!${NC}"
    exit 1
fi

cd ../infrastructure

# Backup original files
if [ -f "main.tf" ]; then
    echo -e "${YELLOW}📋 Backing up original main.tf...${NC}"
    mv main.tf main-original.tf.backup
fi

if [ -f "outputs.tf" ]; then
    echo -e "${YELLOW}📋 Backing up original outputs.tf...${NC}"
    mv outputs.tf outputs-original.tf.backup
fi

# Use Phase 1 configuration
echo -e "${GREEN}📄 Using Phase 1 configuration...${NC}"
cp main-phase1.tf main.tf
cp outputs-phase1.tf outputs.tf

# Remove the phase1 files to avoid duplicates
rm -f main-phase1.tf outputs-phase1.tf

# Initialize and apply
echo -e "${GREEN}🔧 Initializing OpenTofu...${NC}"
tofu init

echo -e "${GREEN}📋 Planning deployment...${NC}"
tofu plan

echo -e "${YELLOW}❓ Do you want to proceed with Phase 1 deployment? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${GREEN}🚀 Applying configuration...${NC}"
    tofu apply -auto-approve
    
    echo -e "${GREEN}✅ Phase 1 deployment complete!${NC}"
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "${GREEN}✅ Domain DNS is already configured (AWS is the registrar)${NC}"
    echo -e "${YELLOW}1. Test your website at:${NC}"
    tofu output temp_website_url
    echo -e "${YELLOW}2. SSL certificate validation records have been created automatically${NC}"
    echo -e "${YELLOW}3. Wait ~10-15 minutes for SSL certificate validation${NC}"
    echo -e "${YELLOW}4. Run Phase 2 deployment to enable SSL and custom domains${NC}"
    
    # Upload website files to the temp distribution
    echo -e "${GREEN}📤 Uploading website files...${NC}"
    cd ../ci
    BUCKET_NAME=$(cd ../infrastructure && tofu output -raw website_bucket_name)
    CLOUDFRONT_ID=$(cd ../infrastructure && tofu output -raw temp_cloudfront_distribution_id)
    
    echo -e "${GREEN}📤 Uploading to S3 bucket: $BUCKET_NAME${NC}"
    ./deploy-files.sh "$BUCKET_NAME" "$CLOUDFRONT_ID"
    
else
    echo -e "${RED}❌ Deployment cancelled${NC}"
fi