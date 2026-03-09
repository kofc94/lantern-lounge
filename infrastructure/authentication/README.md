# Google OAuth Authentication Setup with Terraform

This Terraform configuration adds Google OAuth sign-in to the existing AWS Cognito User Pool.

## Prerequisites

1. **Google Cloud Account** - Access to Google Cloud Console
2. **AWS Credentials** - Configured AWS CLI with appropriate permissions
3. **Existing Cognito Resources** - User Pool and App Client already deployed

## Step 1: Create Google OAuth 2.0 Credentials

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something like "Lantern Lounge Auth"

### 1.2 Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**
4. Also enable "Google Identity" if prompted

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in required fields:
     - App name: `Lantern Lounge`
     - User support email: Your email
     - Developer contact email: Your email
   - Click **Save and Continue** through the scopes and test users screens
   - Return to **Credentials**

4. Click **+ CREATE CREDENTIALS** → **OAuth client ID** again
5. Select **Web application** as the application type
6. Configure the OAuth client:
   - **Name**: `Lantern Lounge Web App`
   - **Authorized JavaScript origins**: Leave empty for now
   - **Authorized redirect URIs**: Add the following (replace with your actual Cognito domain):
     ```
     https://lantern-lounge-calendar-production.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```

     To find your Cognito domain:
     ```bash
     cd ../aws
     terraform output cognito_hosted_ui_url
     # Extract the domain from the URL (the part before .auth.us-east-1.amazoncognito.com)
     ```

7. Click **Create**
8. **IMPORTANT**: Copy your **Client ID** and **Client Secret** - you'll need these for Terraform

### 1.4 Configure OAuth Consent Screen (Production)

For production use, you'll need to publish your OAuth consent screen:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Fill in all required information
3. Add authorized domains: `lanternlounge.org`
4. Click **Submit for Verification** (optional, but recommended for production)

## Step 2: Get Existing Cognito Resource IDs

You need to reference the existing Cognito resources. Run these commands from the AWS infrastructure directory:

```bash
cd /Users/eric/dev/lantern-lounge/infrastructure/aws

# Get User Pool ID
terraform output -raw cognito_user_pool_id

# Get App Client ID
terraform output -raw cognito_app_client_id

# Get Cognito Domain
terraform output cognito_hosted_ui_url
# Extract the domain prefix (e.g., "lantern-lounge-calendar-production")
```

## Step 3: Create terraform.tfvars File

Create a `terraform.tfvars` file in this directory with your Google OAuth credentials:

```bash
cd /Users/eric/dev/lantern-lounge/infrastructure/authentication
```

Create `terraform.tfvars`:

```hcl
# Google OAuth Credentials from Step 1
google_client_id     = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
google_client_secret = "YOUR_GOOGLE_CLIENT_SECRET"

# Cognito Resource IDs from Step 2
cognito_user_pool_id  = "us-east-1_XXXXXXXXX"
cognito_app_client_id = "xxxxxxxxxxxxxxxxxxxxx"
cognito_domain        = "lantern-lounge-calendar-production"

# AWS Region
aws_region = "us-east-1"

# Application domains for OAuth callbacks
app_domains = [
  "http://localhost:5174",              # Local development
  "https://www.lanternlounge.org",      # Production
  "https://lanternlounge.org"           # Production (root domain)
]
```

**SECURITY**: Add `terraform.tfvars` to `.gitignore` to prevent committing secrets!

```bash
echo "terraform.tfvars" >> .gitignore
```

## Step 4: Import Existing App Client (Required)

Before applying, you need to import the existing Cognito App Client into Terraform state:

```bash
cd /Users/eric/dev/lantern-lounge/infrastructure/authentication

# Initialize Terraform
terraform init

# Import the existing app client
# Format: terraform import aws_cognito_user_pool_client.app <user_pool_id>/<app_client_id>
terraform import aws_cognito_user_pool_client.app us-east-1_XXXXXXXXX/xxxxxxxxxxxxxxxxxxxxx
```

Replace the IDs with your actual User Pool ID and App Client ID from Step 2.

## Step 5: Apply Terraform Configuration

```bash
# Review the changes
terraform plan

# Apply the configuration
terraform apply
```

This will:
1. ✅ Create a Google identity provider in your Cognito User Pool
2. ✅ Update your App Client to support Google sign-in
3. ✅ Configure OAuth callback URLs for your React app
4. ✅ Map Google user attributes (email, name) to Cognito attributes

## Step 6: Update Google OAuth Redirect URIs

After Terraform applies successfully, verify your Cognito domain in the output:

```bash
terraform output cognito_hosted_ui_url
```

Then update Google Cloud Console:
1. Go back to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure this URI exists:
   ```
   https://<your-cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```
4. Click **Save**

## Step 7: Test Google Sign-In

1. Start your React dev server:
   ```bash
   cd /Users/eric/dev/lantern-lounge/app/react-webapp
   npm run dev
   ```

2. Open http://localhost:5174 in your browser
3. Click **Member Login** in the navbar
4. Click **Continue with Google**
5. You should be redirected to Google's sign-in page
6. After signing in, you'll be redirected back to your app as an authenticated user

## Updating Callback URLs

If you need to add more domains (e.g., staging environment), update `app_domains` in your `terraform.tfvars`:

```hcl
app_domains = [
  "http://localhost:5174",
  "https://staging.lanternlounge.org",
  "https://www.lanternlounge.org",
  "https://lanternlounge.org"
]
```

Then run:
```bash
terraform apply
```

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: Google OAuth shows "redirect_uri_mismatch" error

**Solution**:
1. Check that the redirect URI in Google Cloud Console exactly matches your Cognito domain
2. The format must be: `https://<cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse`
3. No trailing slashes!

### Error: "User pool client does not exist"

**Problem**: Terraform can't find the app client

**Solution**: Make sure you imported the existing app client (Step 4)

### Error: "Social sign-in is not configured yet"

**Problem**: Google provider not showing in Cognito

**Solution**:
1. Check AWS Console → Cognito → User Pools → Your Pool → Sign-in experience → Federated identity provider sign-in
2. Verify "Google" appears in the list
3. Run `terraform output supported_identity_providers` to confirm

### Users Can't Sign In After First Time

**Problem**: Google sign-in works once but fails on subsequent attempts

**Solution**:
1. Check that `supported_identity_providers` includes both "COGNITO" and "Google"
2. Verify callback URLs include all your app domains
3. Check that both the root path (`/`) and `/events` are in callback URLs

## Resources

- [AWS Cognito Social Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Terraform AWS Provider - Cognito Identity Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_identity_provider)

## Cleanup

To remove Google OAuth (not recommended):

```bash
terraform destroy
```

This will remove the Google identity provider but keep your User Pool intact.
