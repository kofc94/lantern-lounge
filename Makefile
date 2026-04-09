.PHONY: build test deploy help

help:
	@echo "Lantern Lounge Project Management"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build         - Build all projects in app/ and infrastructure/"
	@echo "  test          - Run tests (lint/plan) for all projects"
	@echo "  deploy        - Deploy all projects to production"
	@echo ""

PROJECTS = app/calendar app/cognito app/react-webapp infrastructure/aws infrastructure/gcp infrastructure/github infrastructure/improv-mx

build:
	@for dir in $(PROJECTS); do \
		echo "🔨 Building $$dir..."; \
		$(MAKE) -C $$dir build; \
	done

test:
	@for dir in $(PROJECTS); do \
		echo "🧪 Testing $$dir..."; \
		$(MAKE) -C $$dir test; \
	done

deploy:
	@for dir in $(PROJECTS); do \
		echo "🚀 Deploying $$dir..."; \
		$(MAKE) -C $$dir deploy; \
	done

