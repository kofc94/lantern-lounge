# Infrastructure

OpenTofu (Terraform-compatible) infrastructure for **lanternlounge.org**.

All modules share a remote state backend in S3:

- **Bucket**: `lanternlounge-tfstate`
- **Region**: `us-east-1`

---

## Modules

| Module | Path | What it manages |
|---|---|---|
| AWS Core | `aws/` | S3, CloudFront, Route53, ACM, GitHub OIDC IAM |
| Cognito | `../app/cognito/` | Cognito User Pool, Google IdP, Post-confirmation Lambda |
| Calendar | `../app/calendar/` | DynamoDB, API Gateway, Lambda functions |
| Google Bootstrap | `google/` | Google Cloud project, IAP brand, CI service account |
| GitHub | `github/` | Repo settings, teams, branch protection, CI secrets |

---

## Prerequisites

### 1. AWS credentials

All modules require AWS credentials with sufficient permissions (IAM, S3, CloudFront, Route53, ACM, Cognito, SSM).

```bash
export AWS_PROFILE=lantern-lounge
```

### 2. Google credentials

The `app/cognito` module needs Application Default Credentials to manage Google Cloud resources:

```bash
gcloud auth application-default login
```

The Google OAuth Client ID and Secret are stored in **AWS SSM Parameter Store**:

```bash
aws ssm put-parameter --name /lantern-lounge/google/client-id --value "YOUR_CLIENT_ID" --type String
aws ssm put-parameter --name /lantern-lounge/google/client-secret --value "YOUR_CLIENT_SECRET" --type SecureString
```

---

## Running locally

Every project in the `app/` directory and module in `infrastructure/` can be managed via `make`:

```bash
cd <path-to-module>
make build     # tofu init
make test      # tofu plan
make deploy    # tofu apply
```

### Bootstrap sequence (one-time setup)

1. **AWS Core**: `cd infrastructure/aws && make deploy`
2. **Google Bootstrap**: `cd infrastructure/google && make deploy`
3. **Cognito**: `cd app/cognito && make deploy`
4. **Calendar API**: `cd app/calendar && make deploy`
5. **GitHub**: `cd infrastructure/github && make deploy`

---

## CI/CD (GitHub Actions)

Two workflows automate plan and apply. AWS authentication uses **OIDC**.

### GitHub Actions secrets and variables

All are managed by Tofu in `infrastructure/github/` — **do not set these manually** except for the initial `GH_TOFU_TOKEN`.

| Type | Name | Managed by | Source |
|---|---|---|---|
| Variable | `AWS_ROLE_ARN` | `github` module | AWS Terraform state |
| Secret | `GOOGLE_CREDENTIALS` | `github` module | AWS SSM |
| Secret | `GH_TOFU_TOKEN` | Manual | Personal Access Token |

---

## State backend

| Module | State key |
|---|---|
| `aws` | `terraform.tfstate` |
| `cognito` | `cognito/terraform.tfstate` |
| `calendar` | `calendar/terraform.tfstate` |
| `google` | `google/terraform.tfstate` |
| `github` | `github/terraform.tfstate` |
