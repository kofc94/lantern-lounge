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
│   ├── lambda/                 # Python Lambda functions (calendar API)
│   └── webapp/                 # Legacy vanilla HTML/CSS/JS site (reference only)
├── infrastructure/             # OpenTofu infrastructure modules
│   ├── aws/                    # S3, CloudFront, Route53, ACM
│   ├── authentication/         # Cognito User Pool, Google OAuth
│   └── github/                 # GitHub repo & team management
├── ci/                         # Deployment scripts
└── artifacts/                  # Build artifacts
```

## Local Development

### React app (primary)

```bash
cd app/react-webapp
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run lint
```

### Legacy site (reference only)

```bash
cd app/webapp
python -m http.server 8000
```

## Infrastructure

All modules use OpenTofu with a shared remote state backend (`lanternlounge-tfstate` S3 bucket in `us-east-1`).

```bash
cd infrastructure/<module>   # aws | authentication | github
tofu init
tofu plan
tofu apply
```

### Infrastructure components

- **S3 + CloudFront**: Static hosting and CDN
- **Route53**: DNS for lanternlounge.org
- **ACM**: SSL certificate
- **Cognito**: User Pool with Google OAuth
- **Lambda + DynamoDB**: Calendar API (managed via `app/lambda/`)

## Deployment

Build the React app and deploy via the CI scripts:

```bash
cd app/react-webapp
npm run build
# Then run the appropriate script in ci/
```

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v6
- **Auth**: Amazon Cognito + Google OAuth (`amazon-cognito-identity-js`)
- **Backend**: Python AWS Lambda + DynamoDB
- **Hosting**: AWS S3 + CloudFront + Route53
- **Infrastructure**: OpenTofu
- **SSL**: AWS Certificate Manager

## Contact

The Lantern Lounge
177 Bedford St, Lexington MA 02420
