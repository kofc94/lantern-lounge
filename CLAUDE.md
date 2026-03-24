# Lantern Lounge — Claude Code Guide

Member association website for The Lantern Lounge, a social club at 177 Bedford St, Lexington MA.
Domain: **lanternlounge.org** | GitHub org: **kofc94**

## Core principle: IaC first

Prefer infrastructure-as-code over manual changes. Any new cloud resource (AWS, GitHub, etc.) should be managed via OpenTofu in the `infrastructure/` directory or within the project folders before it is created manually. Use `tofu` (not `terraform`) for all IaC commands.

---

## Critical Rules 🚨

Under no circumstance should any code rely on any sensitive value; the repository is public. Sensitive values are to be stored in AWS Parameter Store or managed via OpenTofu secrets.

Keep the documentation updated after each change.

## The infrastructure folder

The `infrastructure/` folder contains the OpenTofu scripts needed to bootstrap the platform core — OIDC roles, permissions, Google Cloud project, and GitHub repository settings.

## The app folder

The `app/` folder contains all the sub-projects. Each project is self-contained (including its own infrastructure where applicable) and must implement a `Makefile` with the following targets:
- `build`: Prepares the project (e.g., `npm install` or `tofu init`)
- `test`: Runs validations (e.g., `npm run lint` or `tofu plan`)
- `deploy`: Deploys the project to production

The CI/CD pipelines rely on these `make` commands.

## Repository structure

```
lantern-lounge/
├── app/                        # Application code & project-specific infra
│   ├── react-webapp/           # React SPA (primary frontend)
│   ├── cognito/                # Cognito User Pool & Auth logic
│   └── calendar/               # Calendar API (Lambda & DynamoDB)
├── infrastructure/             # Core platform infrastructure
│   ├── aws/                    # Core AWS infra (S3, CloudFront, Route53, ACM)
│   ├── google/                 # Google Cloud project & IdP bootstrap
│   └── github/                 # GitHub repo & team management
├── ci/                         # Shared deployment scripts
└── artifacts/                  # Build artifacts
```

---

## Infrastructure

All modules share a remote state backend on S3:
- **Bucket**: `lanternlounge-tfstate`
- **Region**: `us-east-1`

### Modules

| Module | Path | What it manages |
|---|---|---|
| AWS core | `infrastructure/aws/` | S3 buckets, CloudFront, Route53, ACM certificate |
| Authentication | `app/cognito/` | Cognito User Pool, Google OAuth IdP, Post-confirmation Lambda |
| Calendar API | `app/calendar/` | DynamoDB, API Gateway, Lambda functions |
| GitHub | `infrastructure/github/` | Repo settings, teams, memberships, secrets |

---

## Application code (`app/`)

### `app/react-webapp/` — React SPA

- **Stack**: React 19, Vite, Tailwind CSS, Amazon Cognito
- **Config**: Tooling configs (Vite, ESLint, PostCSS, Tailwind) are in `config/`

```bash
cd app/react-webapp
make build     # install deps and build
make test      # run lint
make deploy    # build and sync to S3 + invalidate CloudFront
```

### `app/calendar/` — Calendar API (Python)

Python functions deployed as AWS Lambda. Handles CRUD for calendar events via DynamoDB. Infrastructure is managed via OpenTofu within this directory.

```bash
cd app/calendar
make build     # tofu init
make test      # tofu plan
make deploy    # tofu apply
```

---

## Deployment

Deployment is standardized across all projects using `make deploy`.

```bash
# Example: Deploy the frontend
cd app/react-webapp && make deploy

# Example: Deploy the calendar API
cd app/calendar && make deploy
```

---

## AWS region & project defaults

- **Region**: `us-east-1`
- **Project name**: `lantern-lounge`
- **Environment**: `production`
