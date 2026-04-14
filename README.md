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
```


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

## Deployment model

Within the app folder one can find a list of folder corresponding to each subproject. Each subproject has an infrastructure folder. Within this folder there is a dev and a prod folder, for each environment. These folders contain the customizations pertinent to that environment. Furthermore, the prod folder contains a file named "pin" which contains the Git sha that is in production. The "dev" folder doesn't have that pin file, because the version that is deployed on dev is always the latest merged code,

In order to deploy or rollback a version, one creates a commit a new change with the git sha in the pin file in the prod folder. The CD pipeline will checkout that version and deploy that version in the prod enviornment.

The infrastructure folder is partiitioned by technologies/vendor. The aws folder is further parition in base, dev and prod folders. The base folder contains reusable modules, while dev and prod are enviornment specific (Mostly s3 buckets and other universaly global objects)



## Contact

The Lantern Lounge
177 Bedford St, Lexington MA 02420
