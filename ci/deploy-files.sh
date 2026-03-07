#!/bin/bash

# File upload script for Lantern Lounge React website
# Usage: ./deploy-files.sh [BUCKET_NAME] [CLOUDFRONT_DISTRIBUTION_ID]

set -e

# Configuration
BUCKET_NAME=${1:-"www.lanternlounge.org"}
CLOUDFRONT_DISTRIBUTION_ID=${2:-""}
REACT_WEBAPP_DIR="../app/react-webapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔨 Building and deploying React webapp...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if react-webapp directory exists
if [ ! -d "$REACT_WEBAPP_DIR" ]; then
    echo -e "${RED}❌ react-webapp directory not found at $REACT_WEBAPP_DIR${NC}"
    exit 1
fi

# Navigate to react-webapp directory
cd "$REACT_WEBAPP_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Build the React app
echo -e "${GREEN}🔨 Building React app...${NC}"
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"
echo -e "${GREEN}📤 Uploading files to S3 bucket: $BUCKET_NAME${NC}"

# Sync the entire dist folder to S3, deleting removed files
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --delete \
    --exclude ".DS_Store" \
    --exclude "*.map" \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "index.html"

# Upload index.html separately with no-cache (for SPA routing)
aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --content-type "text/html" \
    --cache-control "no-cache,no-store,must-revalidate"

echo -e "${GREEN}✅ Files uploaded successfully!${NC}"

# Invalidate CloudFront cache if distribution ID provided
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" > /dev/null
    echo -e "${GREEN}✅ CloudFront cache invalidated!${NC}"
fi

echo -e "${GREEN}🎉 React webapp deployment complete!${NC}"
echo -e "${GREEN}🌐 Visit: https://$BUCKET_NAME${NC}"
