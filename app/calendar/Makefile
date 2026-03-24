.PHONY: build test deploy

build:
	tofu init -input=false

test:
	tofu plan -input=false

deploy:
	tofu apply -input=false -auto-approve

local-setup:
	../../local/setup-local.sh
