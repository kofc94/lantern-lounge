#!/bin/bash

# Phase 2 Deployment script for Lantern Lounge website
# This adds SSL validation and custom domain support
# Run AFTER Phase 1 and DNS propagation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Phase 2: Adding SSL validation and custom domain...${NC}"

cd ../infrastructure

# Check if Phase 1 was completed by trying to get an output
echo -e "${YELLOW}🔍 Checking if Phase 1 infrastructure exists...${NC}"
if ! tofu output website_bucket_name &>/dev/null; then
    echo -e "${RED}❌ No Phase 1 infrastructure found. Please run Phase 1 first.${NC}"
    exit 1
fi

# Test DNS propagation
echo -e "${YELLOW}🔍 Testing DNS propagation...${NC}"
if ! dig +short NS lanternlounge.org | grep -q awsdns; then
    echo -e "${RED}❌ DNS not yet propagated to Route53. Please wait longer.${NC}"
    echo -e "${YELLOW}💡 You can check with: dig +short NS lanternlounge.org${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DNS appears to be propagated!${NC}"

# Add Phase 2 resources
echo -e "${GREEN}📄 Adding SSL validation and custom domain resources...${NC}"

# Append phase2 configuration to main.tf
cat phase2-ssl.tf >> main.tf

# Update outputs
cp outputs.tf outputs-phase1.tf.backup

echo -e "${GREEN}📋 Planning Phase 2 changes...${NC}"
tofu plan

echo -e "${YELLOW}❓ Do you want to proceed with SSL validation? This may take 10-15 minutes. (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${GREEN}🔐 Applying SSL configuration...${NC}"
    echo -e "${YELLOW}⏳ This will take some time for certificate validation...${NC}"
    
    tofu apply -auto-approve
    
    echo -e "${GREEN}✅ Phase 2 deployment complete!${NC}"
    echo -e "${GREEN}🎉 Your website is now available at:${NC}"
    tofu output final_website_url
    
    # Clean up temp distribution (optional)
    echo -e "${YELLOW}❓ Would you like to remove the temporary CloudFront distribution? (y/n)${NC}"
    read -r cleanup_response
    if [[ "$cleanup_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${GREEN}🧹 Cleaning up temporary resources...${NC}"
        # Remove temp distribution from state and configuration
        tofu state rm aws_cloudfront_distribution.website_distribution_temp || true
        echo -e "${GREEN}✅ Cleanup complete!${NC}"
    fi
    
else
    echo -e "${RED}❌ Phase 2 deployment cancelled${NC}"
fi