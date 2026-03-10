#!/bin/bash

# Complete deployment script for Lantern Lounge Calendar
# This script:
# 1. Packages Lambda functions
# 2. Deploys infrastructure with OpenTofu
# 3. Updates config.js with output values
# 4. Uploads frontend files to S3
# 5. Invalidates CloudFront cache

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LAMBDA_DIR="$SCRIPT_DIR/../lambda"
INFRA_DIR="$SCRIPT_DIR/../../infrastructure/aws"

echo "🚀 Lantern Lounge Calendar Deployment"
echo "======================================"
echo ""

# Step 1: Package Lambda functions
echo "📦 Step 1/5: Packaging Lambda functions..."
cd "$LAMBDA_DIR"
if [ ! -f "package.sh" ]; then
    echo "❌ Error: package.sh not found in $LAMBDA_DIR"
    exit 1
fi
./package.sh

if [ ! -f "calendar-api.zip" ]; then
    echo "❌ Error: Failed to create calendar-api.zip"
    exit 1
fi
echo "✅ Lambda functions packaged successfully"
echo ""

# Step 2: Deploy infrastructure
echo "🏗️  Step 2/5: Deploying infrastructure with OpenTofu..."
cd "$INFRA_DIR"

if [ ! -d ".terraform" ]; then
    echo "🔧 Initializing OpenTofu..."
    tofu init
fi

echo "📋 Running OpenTofu plan..."
tofu plan

echo ""
read -p "Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo "🚀 Applying OpenTofu changes..."
tofu apply -auto-approve

echo "✅ Infrastructure deployed successfully"
echo ""

# Step 3: Update config.js
echo "🔧 Step 3/5: Updating config.js..."
cd "$SCRIPT_DIR"
./update-config.sh
echo ""

# Step 4: Upload to S3
echo "📤 Step 4/5: Uploading files to S3..."

# Get bucket name from OpenTofu
cd "$INFRA_DIR"
BUCKET_NAME=$(tofu output -raw website_bucket_name 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Error: Could not get bucket name from OpenTofu"
    exit 1
fi

echo "   Uploading to bucket: $BUCKET_NAME"

cd "$SCRIPT_DIR"
aws s3 sync . s3://$BUCKET_NAME/ \
    --exclude ".DS_Store" \
    --exclude "*.md" \
    --exclude "*.sh" \
    --exclude ".git*"

echo "✅ Files uploaded successfully"
echo ""

# Step 5: Invalidate CloudFront cache
echo "🔄 Step 5/5: Invalidating CloudFront cache..."

cd "$INFRA_DIR"
DISTRIBUTION_ID=$(tofu output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "⚠️  Warning: Could not get CloudFront distribution ID"
    echo "   You may need to manually invalidate the cache"
else
    echo "   Invalidating distribution: $DISTRIBUTION_ID"
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/calendar.html" "/calendar.js" "/calendar.css" "/config.js"
    echo "✅ CloudFront cache invalidated"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📋 Summary:"

cd "$INFRA_DIR"
API_ENDPOINT=$(tofu output -raw api_gateway_endpoint 2>/dev/null || echo "N/A")
WEBSITE_URL=$(tofu output -raw final_website_url 2>/dev/null || echo "N/A")
HOSTED_UI=$(tofu output -raw cognito_hosted_ui_url 2>/dev/null || echo "N/A")

echo "   Website URL:     $WEBSITE_URL/calendar.html"
echo "   API Endpoint:    $API_ENDPOINT"
echo ""
echo "🔐 Authentication:"
echo "   Sign up at: $WEBSITE_URL/calendar.html"
echo "   Or use hosted UI: $HOSTED_UI"
echo ""
echo "📚 Next steps:"
echo "   1. Visit $WEBSITE_URL/calendar.html"
echo "   2. Create an account (check email for verification)"
echo "   3. Sign in and create events"
echo ""
echo "💡 Tips:"
echo "   - View logs: aws logs tail /aws/lambda/lantern-lounge-get-calendar-items --follow"
echo "   - Check DynamoDB: aws dynamodb scan --table-name lantern-lounge-calendar-items"
echo "   - Monitor costs: aws ce get-cost-and-usage (should be ~$1-3/month)"
echo ""
