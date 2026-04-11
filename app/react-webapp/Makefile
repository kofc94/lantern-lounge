.PHONY: build test deploy clean generate-config

INFRA_DIR := ../../infrastructure/aws

# Get infrastructure outputs
BUCKET_NAME = $(shell cd $(INFRA_DIR) && tofu output -raw website_bucket_name 2>/dev/null)
DISTRIBUTION_ID = $(shell cd $(INFRA_DIR) && tofu output -raw cloudfront_distribution_id 2>/dev/null)
WEBSITE_URL = $(shell cd $(INFRA_DIR) && (tofu output -raw final_website_url 2>/dev/null || tofu output -raw website_url 2>/dev/null || echo "N/A"))

generate-config:
	node scripts/generate-config.js

build: generate-config
	npm install
	npm run build

test:
	npm run lint
	npm run test

deploy: test build
	@if [ -z "$(BUCKET_NAME)" ] || [ -z "$(DISTRIBUTION_ID)" ]; then \
		echo "❌ Error: Could not get bucket name or distribution ID from OpenTofu"; \
		echo "   Make sure infrastructure is deployed in $(INFRA_DIR)"; \
		exit 1; \
	fi
	@echo "📤 Deploying to S3 bucket: $(BUCKET_NAME)"
	aws s3 sync dist/ s3://$(BUCKET_NAME)/ \
		--delete \
		--exclude ".DS_Store" \
		--exclude "*.map" \
		--exclude "checkin/*" \
		--cache-control "public,max-age=31536000,immutable" \
		--exclude "index.html"
	aws s3 cp dist/index.html s3://$(BUCKET_NAME)/index.html \
		--cache-control "no-cache,no-store,must-revalidate"
	@echo "🔄 Invalidating CloudFront cache: $(DISTRIBUTION_ID)"
	aws cloudfront create-invalidation --distribution-id $(DISTRIBUTION_ID) --paths "/*" > /dev/null
	@echo "🎉 Deployment Complete!"
	@echo "🌐 Your React app is now live at: $(WEBSITE_URL)"

clean:
	rm -rf dist
	rm -rf node_modules
