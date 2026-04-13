.PHONY: build test deploy

# ENV can be: global, dev, prod
ENV ?= dev

build:
	cd $(ENV) && tofu init -input=false

test:
	cd $(ENV) && tofu plan -input=false

deploy:
	cd $(ENV) && tofu apply -input=false -auto-approve
