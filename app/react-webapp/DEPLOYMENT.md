# Lantern Lounge React App - Deployment Guide

This React application is the frontend for Lantern Lounge, featuring Cognito authentication and a calendar event system.

## Architecture

- **Frontend**: React + Vite + TailwindCSS
- **Authentication**: AWS Cognito
- **Backend API**: API Gateway + Lambda
- **Database**: DynamoDB
- **Hosting**: S3 + CloudFront
- **Infrastructure**: OpenTofu/Terraform

## Prerequisites

- Node.js (v18 or higher)
- AWS CLI configured with appropriate credentials
- OpenTofu/Terraform (for infrastructure management)

## Project Structure

```
react-webapp/
├── src/
│   ├── components/     # React components
│   │   ├── auth/      # Authentication components
│   │   ├── common/    # Reusable UI components
│   │   └── layout/    # Layout components (Navbar, Footer)
│   ├── contexts/      # React contexts (AuthContext)
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components (Home, Events, etc.)
│   ├── services/      # API services (Cognito, Events)
│   ├── config/        # Configuration files
│   │   └── aws-config.js  # AWS Cognito & API Gateway config
│   ├── App.jsx        # Main app component
│   └── main.jsx       # Entry point
├── public/            # Static assets
├── dist/              # Build output (generated)
├── deploy.sh          # Deployment script
└── package.json       # Dependencies
```

## Configuration

### AWS Configuration

The app connects to AWS services via `src/config/aws-config.js`:

```javascript
const CONFIG = {
  apiEndpoint: 'https://YOUR_API_GATEWAY_ENDPOINT',
  cognito: {
    userPoolId: 'YOUR_USER_POOL_ID',
    userPoolRegion: 'us-east-1',
    appClientId: 'YOUR_APP_CLIENT_ID',
    domain: 'YOUR_COGNITO_DOMAIN'
  }
};
```

These values are automatically populated when you deploy infrastructure with OpenTofu.

## Development

### Install Dependencies

```bash
cd app/react-webapp
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit: http://localhost:5173

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Option 1: Standalone Deployment Script

```bash
cd app/react-webapp
./deploy.sh
```

This script will:
1. Install dependencies (if needed)
2. Build the React app
3. Upload to S3
4. Invalidate CloudFront cache

### Option 2: CI Deployment Script

From the project root:

```bash
cd ci
./deploy.sh
```

This uses the centralized CI deployment script.

### Option 3: Manual Deployment

```bash
# Build the app
npm run build

# Sync to S3
aws s3 sync dist/ s3://www.lanternlounge.org/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://www.lanternlounge.org/index.html \
  --cache-control "no-cache,no-store,must-revalidate"

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Infrastructure

All AWS resources are managed by OpenTofu/Terraform in `infrastructure/aws/`:

### Deploy Infrastructure

```bash
cd infrastructure/aws
tofu init
tofu apply
```

### Resources Created

- **S3 Buckets**: Website hosting + redirect
- **CloudFront**: CDN distribution
- **Cognito**: User pool + app client
- **API Gateway**: HTTP API
- **Lambda**: 4 functions (get, create, update, delete events)
- **DynamoDB**: Calendar items table
- **Route53**: DNS records
- **ACM**: SSL certificates

## Environment-Specific Configuration

### Development

- Uses Vite dev server
- Hot module replacement enabled
- Points to deployed AWS resources (not local)

### Production

- Optimized build with code splitting
- Minified assets
- CDN delivery via CloudFront
- HTTPS only

## Caching Strategy

### Static Assets (JS, CSS, images)
- Cache-Control: `public,max-age=31536000,immutable`
- Content-hashed filenames for cache busting

### index.html
- Cache-Control: `no-cache,no-store,must-revalidate`
- Always fetched fresh for SPA routing

## Troubleshooting

### Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CloudFront Shows Old Content

```bash
# Invalidate CloudFront cache
DIST_ID=$(cd ../../infrastructure/aws && tofu output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### Authentication Issues

1. Verify config in `src/config/aws-config.js` matches OpenTofu outputs:
   ```bash
   cd ../../infrastructure/aws
   tofu output frontend_config
   ```

2. Check Cognito User Pool:
   ```bash
   tofu output cognito_user_pool_id
   ```

3. Verify App Client callback URLs include your domain

### API Connection Issues

1. Check API Gateway endpoint:
   ```bash
   cd ../../infrastructure/aws
   tofu output api_gateway_endpoint
   ```

2. Test API directly:
   ```bash
   curl https://YOUR_API_GATEWAY_ENDPOINT/calendar/items
   ```

3. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/lantern-lounge-get-calendar-items --follow
   ```

## Continuous Deployment

### GitHub Actions (Future)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd app/react-webapp && npm install
      - run: cd app/react-webapp && npm run build
      - run: cd ci && ./deploy.sh
```

## Cost Estimate

For low-medium traffic (<100K requests/month):

- S3: ~$0.50/month
- CloudFront: ~$1-2/month
- API Gateway: ~$1/month
- Lambda: $0 (free tier)
- DynamoDB: $0 (free tier)
- Cognito: $0 (first 50K MAUs free)

**Total: ~$2-4/month**

## Support

For issues or questions:
1. Check CloudWatch logs
2. Verify OpenTofu outputs match config
3. Test API endpoints directly
4. Review browser console for errors

## Next Steps

1. Deploy React app: `./deploy.sh`
2. Visit https://www.lanternlounge.org
3. Sign up for an account
4. Verify email and sign in
5. Create calendar events
