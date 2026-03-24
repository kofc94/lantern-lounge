# Deployment Guide — React Webapp

This guide explains how to deploy the React frontend to AWS (S3 + CloudFront).

## Architecture

- **Hosting**: Amazon S3 (Static Website Hosting)
- **CDN**: Amazon CloudFront (SSL & Edge Caching)
- **CI/CD**: GitHub Actions + Makefile

## Prerequisites

- AWS CLI configured with production credentials.
- OpenTofu (for infrastructure state).
- Core infrastructure (S3 buckets, CloudFront distribution) must be deployed in `infrastructure/aws/`.

## Deployment Workflow

### Standard Deployment

The project uses a `Makefile` to automate the build and sync process.

```bash
cd app/react-webapp
make deploy
```

This command performs the following actions:
1. `npm install` (if node_modules are missing).
2. `npm run build` (generates the `dist/` folder using `config/vite.config.js`).
3. Fetches `website_bucket_name` and `cloudfront_distribution_id` from OpenTofu.
4. Synchronizes `dist/` to S3 with optimized cache-control headers.
5. Invalidates the CloudFront cache (`/*`) to ensure the latest version is served.

### Manual Steps (Internal Logic)

If you need to perform steps manually for debugging:

1. **Build**: `npm run build`
2. **Sync Assets**: `aws s3 sync dist/ s3://$BUCKET/ --delete --exclude "index.html"`
3. **Upload Entry Point**: `aws s3 cp dist/index.html s3://$BUCKET/index.html --cache-control "no-cache"`
4. **Invalidate**: `aws cloudfront create-invalidation --distribution-id $ID --paths "/*"`

## Directory Structure

```
react-webapp/
├── src/               # React components, hooks, and logic
├── public/            # Static assets (images, icons)
├── config/            # Tooling configs (Vite, PostCSS, Tailwind, ESLint)
├── dist/              # Build output (generated)
└── Makefile           # Deployment orchestration
```

## Troubleshooting

### "Could not get bucket name or distribution ID"
Ensure you have initialized OpenTofu in the infrastructure folder:
```bash
cd infrastructure/aws
tofu init
```

### CloudFront showing old content
The `make deploy` command automatically invalidates the cache. If issues persist, verify the Distribution ID manually:
```bash
cd infrastructure/aws
tofu output cloudfront_distribution_id
```

### Cache Headers
- **Static Assets** (JS/CSS/Images): Cached for 1 year (immutable).
- **index.html**: No-cache (ensures users always get the latest version of the app).
