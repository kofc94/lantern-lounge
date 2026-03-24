# The Lantern Lounge Website

Member association website for The Lantern Lounge, a social club at 177 Bedford St, Lexington MA.

**Domain**: lanternlounge.org | **GitHub org**: kofc94

## Features

- **Homepage** - Bar information and membership overview
- **Join Us** - Membership details and benefits
- **Events Calendar** - View and manage community events
- **About** - Detailed information about the lounge
- **Member Login** - Google OAuth via Amazon Cognito

## Project Structure

```
lantern-lounge/
├── app/
│   ├── react-webapp/           # React SPA (primary frontend)
│   ├── calendar/               # Calendar API (Lambda & DynamoDB)
│   └── cognito/                # Authentication (Cognito & Google IdP)
├── infrastructure/             # Core platform infrastructure
│   ├── aws/                    # S3, CloudFront, Route53, ACM
│   ├── google/                 # Google Cloud project bootstrap
│   └── github/                 # GitHub repo & team management
├── .agents/                    # AI Agent skills and guidelines
├── skills-lock.json            # Lock file for AI Agent skills
└── artifacts/                  # Build artifacts
```

## Local Development & Deployment

Each project in the `app/` directory uses a `Makefile` for a standardized workflow. You can also use the root `Makefile` to manage everything.

### Standard Workflow

```bash
make build         # Prepare all projects
make test          # Run tests for all projects
make deploy        # Deploy all to production
make local-setup   # Start and configure LocalStack for local dev
```

### Local Development (with LocalStack)

To run the project locally using LocalStack to emulate AWS services:

1. **Start LocalStack**: `docker-compose -f local/docker-compose.yml up -d`
2. **Setup AWS Resources**: `make local-setup`
3. **Run React App**: `cd app/react-webapp && npm run dev`

See [local/README.md](./local/README.md) for more details.


## Infrastructure

All modules use OpenTofu with a shared remote state backend (`lanternlounge-tfstate` S3 bucket in `us-east-1`).

### Core Components

- **S3 + CloudFront**: Static hosting and CDN (in `infrastructure/aws/`)
- **Route53 + ACM**: DNS and SSL (in `infrastructure/aws/`)
- **Cognito**: User Pool with Google OAuth (in `app/cognito/`)
- **Lambda + DynamoDB**: Calendar API (in `app/calendar/`)

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v6
- **Auth**: Amazon Cognito + Google OAuth
- **Backend**: Python AWS Lambda + DynamoDB
- **Infrastructure**: OpenTofu (Terraform-compatible)
- **Deployment**: GitHub Actions + Makefiles

## Contact

The Lantern Lounge
177 Bedford St, Lexington MA 02420
