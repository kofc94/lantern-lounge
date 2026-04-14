.PHONY: install dev build preview lint test deploy clean

ENV ?= prod
INFRA_DIR := ../../infrastructure/aws/$(ENV)

# Get infrastructure outputs
BUCKET_NAME = $(shell cd $(INFRA_DIR) && tofu output -raw website_bucket_name 2>/dev/null)
DISTRIBUTION_ID = $(shell cd $(INFRA_DIR) && tofu output -raw checkin_cloudfront_distribution_id 2>/dev/null)

install:
	npm install

generate-config:
	node scripts/generate-config.js $(ENV)

dev:
	npm run dev

build: generate-config
	npm install
	npm run build

test:
	npm install
	npm run lint

preview:
	npm run preview

lint:
	npm run lint

# Native Mobile Commands
ios: build
	npx cap sync ios
	npx cap open ios

android: build
	npx cap sync android
	npx cap open android

sync:
	npx cap sync

deploy: test build
	@if [ -z "$(BUCKET_NAME)" ] || [ -z "$(DISTRIBUTION_ID)" ]; then \
		echo "❌ Error: Could not get bucket name or distribution ID from OpenTofu"; \
		echo "   Make sure infrastructure is deployed in $(INFRA_DIR)"; \
		exit 1; \
	fi
	@echo "📤 Deploying to S3 bucket: $(BUCKET_NAME)/checkin/"
	aws s3 sync dist/ s3://$(BUCKET_NAME)/checkin/ \
		--delete \
		--exclude ".DS_Store" \
		--exclude "*.map" \
		--cache-control "public,max-age=31536000,immutable" \
		--exclude "index.html"
	aws s3 cp dist/index.html s3://$(BUCKET_NAME)/checkin/index.html \
		--cache-control "no-cache,no-store,must-revalidate"
	@echo "🔄 Invalidating CloudFront cache: $(DISTRIBUTION_ID)"
	aws cloudfront create-invalidation --distribution-id $(DISTRIBUTION_ID) --paths "/*" > /dev/null
	@echo "🎉 Deployment complete! https://checkin.lanternlounge.org"

clean:
	rm -rf dist
	rm -rf node_modules
