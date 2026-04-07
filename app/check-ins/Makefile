.PHONY: build test deploy

# Initialize OpenTofu and install Lambda layer dependencies
build:
	tofu init -input=false
	mkdir -p .layer/python
	pip install \
	  --platform manylinux_2_17_x86_64 \
	  --only-binary=:all: \
	  -t .layer/python/ \
	  "PyJWT>=2.8" "cryptography>=41.0" --quiet

# Plan infrastructure changes
test:
	tofu plan -input=false

# Apply infrastructure changes
deploy:
	tofu apply -input=false -auto-approve

# Note: Run `make build` before `make test` or `make deploy` to ensure
# the wallet Lambda layer dependencies are installed in .layer/python/.
