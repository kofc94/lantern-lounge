# Social Authentication Setup Guide

The app includes Google sign-in support. This is handled via AWS Cognito User Pools as a Federated Identity Provider.

**Note**: This setup is fully automated using OpenTofu. See `app/cognito/` for the implementation.

## Prerequisites

- AWS Cognito User Pool (managed via `app/cognito/`).
- OAuth credentials (Client ID and Secret) from Google Cloud Console.

## Setup Instructions

### 1. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create/Select a project.
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
4. Authorized redirect URIs: `https://<your-cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse`.
5. Note the Client ID and Secret.

### 2. Store Credentials in AWS

Store the Google credentials in AWS SSM Parameter Store so OpenTofu can access them:

```bash
aws ssm put-parameter --name /lantern-lounge/google/client-id --value "YOUR_CLIENT_ID" --type String
aws ssm put-parameter --name /lantern-lounge/google/client-secret --value "YOUR_CLIENT_SECRET" --type SecureString
```

### 3. Apply Cognito Infrastructure

Run the `make deploy` command in the `cognito` directory to configure the User Pool with the Google IdP:

```bash
cd app/cognito
make deploy
```

## App Configuration

Ensure `src/config/aws-config.js` reflects your Cognito Domain:

```javascript
const CONFIG = {
  cognito: {
    userPoolId: '...',
    userPoolRegion: 'us-east-1',
    appClientId: '...',
    domain: 'your-domain.auth.us-east-1.amazoncognito.com'
  }
};
```

## Troubleshooting

### "Social sign-in is not configured yet"
- Verify that the Google Identity Provider is visible in the Cognito User Pool console.
- Ensure the App Client has "Google" selected as an enabled Identity Provider.
- Check that the `Callback URLs` in Cognito include both your local development URL (`http://localhost:5173`) and production URL.

### Redirect loop
Check that the OAuth scopes mapped in Cognito match those requested by the app (`openid`, `email`, `profile`).
