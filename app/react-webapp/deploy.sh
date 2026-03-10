#!/bin/bash

# Deployment script for React webapp
# Builds the React app and deploys to S3 + CloudFront

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INFRA_DIR="$SCRIPT_DIR/../../infrastructure/aws"

echo "🚀 Deploying React Webapp to S3 + CloudFront"
echo "=============================================="
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/4: Installing dependencies..."
cd "$SCRIPT_DIR"
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Build the React app
echo "🔨 Step 2/4: Building React app..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ React app built successfully"
echo ""

# Step 3: Get S3 bucket and CloudFront distribution from OpenTofu
echo "📊 Step 3/4: Getting deployment configuration..."
cd "$INFRA_DIR"

BUCKET_NAME=$(tofu output -raw website_bucket_name 2>/dev/null || echo "")
DISTRIBUTION_ID=$(tofu output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo "❌ Error: Could not get bucket name or distribution ID from OpenTofu"
    echo "   Make sure infrastructure is deployed with 'tofu apply'"
    exit 1
fi

echo "   S3 Bucket: $BUCKET_NAME"
echo "   CloudFront Distribution: $DISTRIBUTION_ID"
echo ""

# Step 4: Deploy to S3
echo "📤 Step 4/4: Deploying to S3..."
cd "$SCRIPT_DIR"

# Sync the dist folder to S3
aws s3 sync dist/ s3://$BUCKET_NAME/ \
    --delete \
    --exclude ".DS_Store" \
    --exclude "*.map" \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "index.html"

# Upload index.html separately with no-cache
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "no-cache,no-store,must-revalidate"

echo "✅ Files uploaded to S3"
echo ""

# Step 5: Invalidate CloudFront cache
echo "🔄 Step 5/4: Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null

echo "✅ CloudFront cache invalidated"
echo ""

# Get website URL
cd "$INFRA_DIR"
WEBSITE_URL=$(tofu output -raw final_website_url 2>/dev/null || echo "N/A")

echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📋 Summary:"
echo "   Website URL: $WEBSITE_URL"
echo "   S3 Bucket:   $BUCKET_NAME"
echo "   CloudFront:  $DISTRIBUTION_ID"
echo ""
echo "🌐 Your React app is now live at: $WEBSITE_URL"
echo ""
echo "💡 Note: CloudFront invalidation may take 1-2 minutes to propagate"
echo ""
