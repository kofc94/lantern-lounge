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
	  "PyJWT>=2.8" "cryptography>=41.0" "cffi>=1.15" --quiet

# Plan infrastructure changes
test:
	tofu plan -input=false

# Apply infrastructure changes
deploy:
	tofu apply -input=false -auto-approve

# Note: Run `make build` before `make test` or `make deploy` to ensure
# the wallet Lambda layer dependencies are installed in .layer/python/.
