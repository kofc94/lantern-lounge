.PHONY: build test deploy

# Initialize OpenTofu and install Lambda layer dependencies
build:
	tofu init -input=false
	mkdir -p .layer/python
	pip install \
	  --platform manylinux2014_x86_64 \
	  --implementation cp \
	  --python-version 3.11 \
	  --only-binary=:all: \
	  --upgrade \
	  -t .layer/python/ \
	  "pydantic>=2.0.0" "python-ulid>=3.0.0" "PyJWT>=2.8.0" --quiet

# Plan infrastructure changes
test:
	tofu plan -input=false

# Apply infrastructure changes
deploy:
	tofu apply -input=false -auto-approve
