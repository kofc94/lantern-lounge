# Infrastructure

OpenTofu (Terraform-compatible) infrastructure for **lanternlounge.org**.

All modules share a remote state backend in S3:

- **Bucket**: `lanternlounge-tfstate`
- **Region**: `us-east-1`

---

## Modules

| Module | Path | What it manages |
|---|---|---|
| AWS core | `aws/` | S3 buckets, CloudFront, Route53, ACM certificate |
| Authentication | `authentication/` | Cognito User Pool, Google OAuth IdP, App Client |
| GitHub | `github/` | Repo settings, teams, branch protection |

---

## Prerequisites

### 1. AWS credentials

All modules require AWS credentials with sufficient permissions (IAM, S3, CloudFront, Route53, ACM, Cognito, SSM).

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1
```

Or use an AWS profile:

```bash
export AWS_PROFILE=lantern-lounge
```

### 2. Google OAuth credentials (authentication module only)

The `authentication` module reads the Google OAuth 2.0 Client ID and Secret from **AWS SSM Parameter Store** rather than Terraform variables. Store them once before running this module:

```bash
aws ssm put-parameter \
  --name /lantern-lounge/google/client-id \
  --value "YOUR_GOOGLE_CLIENT_ID" \
  --type String

aws ssm put-parameter \
  --name /lantern-lounge/google/client-secret \
  --value "YOUR_GOOGLE_CLIENT_SECRET" \
  --type SecureString
```

Retrieve them at any time with:

```bash
aws ssm get-parameter --name /lantern-lounge/google/client-id
aws ssm get-parameter --name /lantern-lounge/google/client-secret --with-decryption
```

> The Google Client ID and Secret are created in [Google Cloud Console](https://console.cloud.google.com/) under **APIs & Services → Credentials → OAuth 2.0 Client IDs**.

### 3. GitHub token (github module only)

The `github` module manages GitHub resources and requires a Personal Access Token with **`repo`** and **`admin:org`** scopes.

```bash
export GITHUB_TOKEN=ghp_...
```

---

## Running locally

```bash
cd infrastructure/<module>
tofu init
tofu plan
tofu apply
```

### First-time initialisation

If no prior state exists, each module can be initialised and applied independently:

```bash
# 1. Core AWS infrastructure
cd infrastructure/aws && tofu init && tofu apply

# 2. Authentication (requires SSM params from step above)
cd infrastructure/authentication && tofu init && tofu apply

# 3. GitHub settings
cd infrastructure/github && tofu init && tofu apply
```

### Importing existing resources

If resources already exist in AWS and were not created by Tofu, import them before applying:

```bash
# Example: import an existing Cognito App Client
tofu import aws_cognito_user_pool_client.app <user_pool_id>/<app_client_id>
```

---

## CI/CD (GitHub Actions)

Two workflows automate plan and apply on every infrastructure change.

### How it works

| Event | Workflow | Action |
|---|---|---|
| Pull request touching `infrastructure/**` | `tofu-plan.yml` | Runs `tofu plan` for each changed module, posts output as a PR comment, blocks merge on error |
| Merge to `main` touching `infrastructure/**` | `tofu-apply.yml` | Runs `tofu apply` for each changed module |

### Required GitHub Actions secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key for all modules |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for all modules |
| `GH_TOFU_TOKEN` | GitHub PAT with `repo` + `admin:org` scopes (github module) |

> The `authentication` module no longer needs `TF_VAR_GOOGLE_CLIENT_ID` or `TF_VAR_GOOGLE_CLIENT_SECRET` as GitHub secrets — those values are read directly from SSM Parameter Store at plan/apply time.

### Blocking merge on plan failure

To enforce that a failed `tofu plan` blocks a PR from merging, add these as **required status checks** in branch protection (**Settings → Branches → main**):

- `Plan / aws`
- `Plan / authentication`
- `Plan / github`

---

## User management

### How group membership works

All authenticated users are automatically assigned to the `member` group by a Post Confirmation Lambda trigger that fires on every new sign-in. No manual action is needed for regular members.

The `admin` group is managed explicitly via Tofu in `infrastructure/aws/cognito.tf`.

### How to create an admin

Admins must have signed in at least once (so their account exists in Cognito) before they can be assigned to a group.

**Step 1 — Find their Cognito username**

For Google OAuth users the username is their Google sub ID, not their email. Look it up by email:

```bash
aws cognito-idp list-users \
  --user-pool-id <pool-id> \
  --filter 'email = "jane@example.com"' \
  --query 'Users[0].Username' \
  --output text
```

To find the pool ID:

```bash
aws cognito-idp list-user-pools --max-results 10
```

**Step 2 — Add them to `local.admin_users`**

Open `infrastructure/aws/cognito.tf` and add their username to the list:

```hcl
locals {
  admin_users = [
    "109876543210987654321",  # Jane Doe (jane@example.com)
  ]
}
```

**Step 3 — Apply**

```bash
cd infrastructure/aws
tofu plan   # verify only the group membership is being added
tofu apply
```

### How to remove an admin

Remove their username from `local.admin_users` in `cognito.tf` and run `tofu apply`. This removes them from the `admin` group but leaves their account and `member` membership intact.

---

## State backend

Each module has its own state key in the shared S3 bucket:

| Module | State key |
|---|---|
| `aws` | `terraform.tfstate` |
| `authentication` | `authentication/terraform.tfstate` |
| `github` | `github/terraform.tfstate` |
