#!/bin/bash

# File upload script for Lantern Lounge website
# Usage: ./deploy-files.sh [BUCKET_NAME] [CLOUDFRONT_DISTRIBUTION_ID]

set -e

# Configuration
BUCKET_NAME=${1:-"www.lanternlounge.org"}
CLOUDFRONT_DISTRIBUTION_ID=${2:-""}
WEBAPP_DIR="../webapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📤 Uploading website files...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if webapp directory exists
if [ ! -d "$WEBAPP_DIR" ]; then
    echo -e "${RED}❌ webapp directory not found!${NC}"
    exit 1
fi

echo -e "${GREEN}📤 Uploading files to S3 bucket: $BUCKET_NAME${NC}"

# Upload HTML files with correct content type
aws s3 cp "$WEBAPP_DIR/" "s3://$BUCKET_NAME/" \
    --recursive \
    --exclude "*.js" \
    --exclude "*.css" \
    --exclude "assets/*" \
    --content-type "text/html" \
    --cache-control "max-age=300"

# Upload CSS files with correct content type
aws s3 cp "$WEBAPP_DIR/" "s3://$BUCKET_NAME/" \
    --recursive \
    --exclude "*" \
    --include "*.css" \
    --content-type "text/css" \
    --cache-control "max-age=86400"

# Upload JS files with correct content type
aws s3 cp "$WEBAPP_DIR/" "s3://$BUCKET_NAME/" \
    --recursive \
    --exclude "*" \
    --include "*.js" \
    --content-type "application/javascript" \
    --cache-control "max-age=86400"

# Upload assets with longer cache control
aws s3 cp "$WEBAPP_DIR/assets/" "s3://$BUCKET_NAME/assets/" \
    --recursive \
    --cache-control "max-age=31536000"

echo -e "${GREEN}✅ Files uploaded successfully!${NC}"

# Invalidate CloudFront cache if distribution ID provided
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" > /dev/null
    echo -e "${GREEN}✅ CloudFront cache invalidated!${NC}"
fi

echo -e "${GREEN}🎉 File deployment complete!${NC}"