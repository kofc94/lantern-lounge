# Social Authentication Setup Guide

The app now includes Google sign-in in the authentication modal. To enable this feature, you need to configure AWS Cognito User Pool with Google as a federated identity provider.

**Note**: This setup is now automated using Terraform. See `/infrastructure/authentication/` for the Infrastructure as Code implementation.

## Prerequisites

- AWS Cognito User Pool already set up
- OAuth credentials from Google Cloud Console

## Setup Methods

### Option 1: Terraform (Recommended)

Use the Infrastructure as Code setup in `/infrastructure/authentication/`. See the README there for complete instructions.

### Option 2: Manual Setup (AWS Console)

Follow the instructions below to manually configure Google OAuth in AWS Console.

## Manual Setup Instructions

### 1. Configure Social Identity Providers in AWS Cognito

#### Google Sign-In

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://<your-cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse`

2. **Configure in AWS Cognito:**
   - Go to AWS Cognito Console → User Pools → Your pool
   - Sign-in experience → Federated identity provider sign-in
   - Add identity provider → Google
   - Enter Client ID and Client Secret from Google
   - Map attributes (email, name)


### 2. Configure App Client Settings

1. Go to App integration → App client settings
2. Enable the identity provider you configured (Google)
3. Set Callback URLs: Your app URLs (e.g., `http://localhost:5174`, `http://localhost:5174/events`, `https://www.lanternlounge.org`, `https://www.lanternlounge.org/events`)
4. Set Sign out URLs: Your app URLs (e.g., `http://localhost:5174`, `https://www.lanternlounge.org`)
5. Select OAuth 2.0 flows: Authorization code grant
6. Select OAuth Scopes: openid, email, profile

### 3. Configure Hosted UI (Optional)

1. Go to App integration → Domain name
2. Use either:
   - Amazon Cognito domain: `<prefix>.auth.<region>.amazoncognito.com`
   - Custom domain (requires SSL certificate)

### 4. Update App Configuration

Update `src/config/aws-config.js` with your Cognito domain:

```javascript
const CONFIG = {
  cognito: {
    userPoolId: 'your-user-pool-id',
    userPoolRegion: 'your-region',
    appClientId: 'your-app-client-id',
    domain: 'your-cognito-domain.auth.region.amazoncognito.com' // Already configured
  }
};
```

## Testing Google Sign-In

1. Start the dev server: `npm run dev`
2. Click "Member Login" in navbar
3. Click "Continue with Google"
4. You'll be redirected to Google's sign-in page
5. After successful authentication, you'll be redirected back to the app

## Current Status

✅ UI implemented with Google sign-in button
✅ Client-side code for federated sign-in
✅ Terraform configuration available in `/infrastructure/authentication/`
⚠️ Requires AWS Cognito configuration (use Terraform or manual setup above)

## Fallback

If Google sign-in is not configured yet, users will see an error message and can still use email/password authentication which is already working.

## Why Only Google?

Google OAuth is the most straightforward social identity provider to set up:
- Simple OAuth 2.0 flow
- Provides email and profile automatically
- No app review required for basic use
- Free for unlimited users
- Most users already have Google accounts

Facebook and Apple can be added later if needed, but Google covers the majority of use cases.

## Troubleshooting

**"Social sign-in is not configured yet"**
- Check that Google identity provider is enabled in Cognito
- Verify callback URLs match exactly (including localhost:5174 for development)
- Ensure OAuth scopes are selected (openid, email, profile)
- If using Terraform, ensure you've applied the configuration

**Redirect loop**
- Check that app client has correct callback URLs
- Verify domain is correctly configured

**Missing user attributes**
- Check attribute mapping in identity provider settings
- Ensure scopes include required attributes (email, profile)

## Resources

- [AWS Cognito Social Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Terraform AWS Cognito Identity Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_identity_provider)
- [Infrastructure Setup (Terraform)](../../../infrastructure/authentication/README.md)
