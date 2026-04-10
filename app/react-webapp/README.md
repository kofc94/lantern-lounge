# Lantern Lounge React App

Frontend for the Lantern Lounge member portal. Built with React 19, Vite, and Tailwind CSS.

## Features

- **Auth**: Amazon Cognito integration with Google OAuth support.
- **Events**: Integration with the Calendar API (DynamoDB).
- **Design**: Modern, responsive UI with Tailwind CSS.

## Project Structure

```
react-webapp/
├── src/               # Application source code
├── public/            # Static assets
├── config/            # Tool configuration (Vite, ESLint, Tailwind, etc.)
├── Makefile           # Standard build/test/deploy targets
└── package.json       # Dependencies and scripts
```

## Development

### 1. Install Dependencies & Build

```bash
make build
```

### 2. Run Local Development Server

```bash
npm run dev
```

### 3. Run Tests

```bash
# Run all tests once
make test
# OR
npm run test

# Run tests in watch mode
npm run test:watch
```

### 4. Run Linting

```bash
npm run lint
```

The optimized build will be generated in the `dist/` directory.

## Deployment

Deploying the app is handled via the `Makefile`. This will build the project and synchronize the `dist/` folder with the production S3 bucket, then invalidate the CloudFront cache.

```bash
make deploy
```

> **Note**: This requires infrastructure to be previously deployed in `infrastructure/aws/` as it pulls the S3 bucket name and CloudFront distribution ID from the OpenTofu outputs.

## Configuration

The application uses configuration files located in the `config/` directory:
- `vite.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `eslint.config.js`

AWS settings (Cognito User Pool ID, API Endpoints) are configured in `src/config/aws-config.js`.
