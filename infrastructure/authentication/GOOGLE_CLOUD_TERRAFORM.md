# Automating Google Cloud Setup with Terraform

This document explains whether and how to use Terraform to create Google Cloud resources for OAuth authentication.

## TL;DR: Is It Worth It?

**Short Answer**: For a single project like Lantern Lounge, **probably not worth it**. The manual setup is simpler.

**Long Answer**: It's technically possible but has limitations and requires more initial setup than just using the Google Cloud Console.

## What Can Be Automated

✅ **Fully Automatable:**
- Google Cloud Project creation
- Enabling required APIs (Identity, OAuth2, People)
- Basic OAuth consent screen configuration
- Creating OAuth credentials (with limitations)

⚠️ **Partially Automatable:**
- OAuth client redirect URIs (requires manual configuration or API calls)
- OAuth consent screen publishing (requires manual review by Google)
- JavaScript origins (limited Terraform support)

❌ **Cannot Be Automated:**
- Google Cloud Billing Account creation (must exist)
- Initial Google Cloud Organization setup (optional)
- OAuth consent screen verification for production (requires Google review)

## Prerequisites for Terraform Automation

To use Terraform with Google Cloud, you need:

### 1. Google Cloud Billing Account

```bash
# Check if you have a billing account
gcloud billing accounts list

# Output example:
# ACCOUNT_ID            NAME                OPEN  MASTER_ACCOUNT_ID
# 01234-ABCDEF-567890  My Billing Account  True
```

If you don't have one, you must create it manually in the [Google Cloud Console](https://console.cloud.google.com/billing).

### 2. Service Account for Terraform

```bash
# Create a service account
gcloud iam service-accounts create terraform-auth \
  --display-name="Terraform for Lantern Lounge Auth" \
  --project=YOUR_EXISTING_PROJECT

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_EXISTING_PROJECT \
  --member="serviceAccount:terraform-auth@YOUR_EXISTING_PROJECT.iam.gserviceaccount.com" \
  --role="roles/resourcemanager.projectCreator"

gcloud projects add-iam-policy-binding YOUR_EXISTING_PROJECT \
  --member="serviceAccount:terraform-auth@YOUR_EXISTING_PROJECT.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageAdmin"

# Create and download key
gcloud iam service-accounts keys create ~/terraform-auth-key.json \
  --iam-account=terraform-auth@YOUR_EXISTING_PROJECT.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/terraform-auth-key.json
```

### 3. Additional Terraform Provider

Update `main.tf` to include the Google provider:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.google_project_id
  region  = "us-central1"
}
```

## Limitations of Terraform for Google OAuth

### 1. OAuth Client Configuration is Limited

The Google Cloud Terraform provider has limited support for OAuth client credentials. Specifically:

- **Redirect URIs**: Must be configured manually or via API calls
- **JavaScript Origins**: Limited Terraform support
- **Scopes**: Some scope configurations require manual setup

### 2. OAuth Consent Screen Publishing

Even if you create the consent screen with Terraform, publishing it for production requires:
- Manual verification by Google
- Submitting app for review
- Providing privacy policy and terms of service URLs

### 3. Resource Management Complexity

Managing Google Cloud resources in the same Terraform state as AWS resources can complicate:
- State management (two cloud providers)
- Authentication (two sets of credentials)
- Deployment workflows (cross-cloud dependencies)

## Recommended Approach

### Option 1: Manual Setup (Recommended for Single Project)

**Pros:**
- Simpler initial setup
- Better visibility in Google Cloud Console
- No service account management
- One-time setup (rarely changes)

**Cons:**
- Not infrastructure as code
- Manual steps required
- Documentation needed for reproducibility

**Time:** ~15 minutes one time

### Option 2: Terraform with Manual Finishing (For Multiple Environments)

**Pros:**
- Automated project and API setup
- Reproducible across environments
- Infrastructure as code for most resources

**Cons:**
- Requires service account setup
- Still needs manual OAuth redirect URI configuration
- More complex state management

**Time:** ~30 minutes setup + ~5 minutes per environment

### Option 3: Fully Manual (Current Approach)

**Pros:**
- No Terraform complexity
- All configuration visible in one place
- Works with personal Google accounts

**Cons:**
- Manual documentation required
- Not reproducible without documentation

**Time:** ~15 minutes per environment

## When to Use Terraform for Google Cloud

Use Terraform if you:
- Have **multiple environments** (dev, staging, prod) with separate Google projects
- Need to **recreate environments frequently**
- Already have **Google Cloud organization and service accounts** set up
- Want **full infrastructure as code** for compliance/audit reasons

Don't use Terraform if you:
- Have a **single production environment**
- Rarely change OAuth configuration
- Don't have Google Cloud organization setup
- Want the **simplest possible setup**

## Implementation Decision

**For Lantern Lounge**: Stick with **manual Google Cloud Console setup** because:

1. ✅ Single production environment (not multiple environments)
2. ✅ OAuth configuration rarely changes
3. ✅ Manual setup is well-documented in README.md
4. ✅ No Google Cloud organization requirement
5. ✅ 15-minute one-time setup vs 30+ minutes Terraform setup

The Terraform module focuses on AWS Cognito configuration (which changes more frequently) and leaves Google Cloud as a one-time manual setup.

## If You Still Want to Try Terraform

See `google-cloud.tf.example` for a starting point. You'll need to:

1. Set up Google Cloud billing account
2. Create service account with appropriate permissions
3. Configure `GOOGLE_APPLICATION_CREDENTIALS` environment variable
4. Rename `google-cloud.tf.example` to `google-cloud.tf`
5. Run `terraform init` to download Google provider
6. Run `terraform apply`
7. **Manually configure redirect URIs in Google Cloud Console** (required)

## Resources

- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Google Cloud OAuth Client Setup](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud IAM Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
