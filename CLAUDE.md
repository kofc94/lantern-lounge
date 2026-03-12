# Lantern Lounge — Claude Code Guide

Member association website for The Lantern Lounge, a social club at 177 Bedford St, Lexington MA.
Domain: **lanternlounge.org** | GitHub org: **kofc94**

## Core principle: IaC first

Prefer infrastructure-as-code over manual changes. Any new cloud resource (AWS, GitHub, etc.) should be managed via OpenTofu in the `infrastructure/` directory before it is created manually. Use `tofu` (not `terraform`) for all IaC commands.

---

## Critical Rules 🚨

Under no circumpstance should any code rely on any sensitive value; the repository is public. Sensitive values are to be store in AWS Parameter Store.

Keep the README.md updated after each changes


## Repository structure

```
lantern-lounge/
├── app/                        # Application code
│   ├── react-webapp/           # React SPA (primary frontend)
│   ├── lambda/                 # Python Lambda functions (calendar API)
├── infrastructure/             # OpenTofu infrastructure modules
│   ├── aws/                    # Core AWS infra (S3, CloudFront, Route53, ACM)
│   ├── authentication/         # Cognito + Google OAuth
│   └── github/                 # GitHub repo & team management
├── ci/                         # Deployment scripts
└── artifacts/                  # Build artifacts
```

---

## Infrastructure (`infrastructure/`)

All modules share a remote state backend on S3:
- **Bucket**: `lanternlounge-tfstate`
- **Region**: `us-east-1`

### Modules

| Module | Path | What it manages |
|---|---|---|
| AWS core | `infrastructure/aws/` | S3 buckets, CloudFront, Route53, ACM certificate |
| Authentication | `infrastructure/authentication/` | Cognito User Pool, Google OAuth IdP, App Client |
| GitHub | `infrastructure/github/` | Repo settings, teams, memberships |

### Common commands

```bash
cd infrastructure/<module>
tofu init
tofu plan
tofu apply
```

---

## Application code (`app/`)

### `app/react-webapp/` — React SPA (primary frontend)

- **Stack**: React 19, Vite, Tailwind CSS, React Router v6, Amazon Cognito (auth)
- **Auth**: Cognito User Pool with Google OAuth via `amazon-cognito-identity-js`

```bash
cd app/react-webapp
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run lint
```

### `app/lambda/` — Calendar API (Python)

Python functions deployed as AWS Lambda. Handles CRUD for calendar events via DynamoDB.

Files: `get_items.py`, `create_item.py`, `update_item.py`, `delete_item.py`

Package for deployment: `./package.sh` (produces `calendar-api.zip`)

### `app/webapp/` — Legacy site (vanilla HTML/CSS/JS)

Static site, kept for reference. New features go into `react-webapp`.

Local dev: open `index.html` in browser or `python -m http.server 8000`

---

## Deployment

CI scripts live in `ci/`. Deployment pushes built assets to S3 and invalidates CloudFront.

```bash
# Deploy react-webapp
cd app/react-webapp && npm run build
# Then run the appropriate ci/ deploy script
```

---

## AWS region & project defaults

- **Region**: `us-east-1`
- **Project name**: `lantern-lounge`
- **Environment**: `production`
