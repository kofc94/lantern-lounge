.PHONY: build test deploy

ENV ?= dev
INFRA_DIR = infrastructure/$(ENV)

# Initialize OpenTofu and install Lambda layer dependencies
build:
	cd $(INFRA_DIR) && tofu init -input=false
	mkdir -p .layer/python
	pip install \
	  --platform manylinux2014_x86_64 \
	  --implementation cp \
	  --python-version 3.11 \
	  --only-binary=:all: \
	  --upgrade \
	  -t .layer/python/ \
	  "pydantic>=2.0.0" --quiet

# Plan infrastructure changes
test:
	cd $(INFRA_DIR) && tofu plan -input=false

# Apply infrastructure changes
deploy:
	cd $(INFRA_DIR) && tofu apply -input=false -auto-approve
