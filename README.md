# The Lantern Lounge Website

A responsive website for The Lantern Lounge, a members-only bar and social club in Lexington, MA.

## Features

- 🏠 **Homepage** - Bar information and membership overview
- 👥 **Join Us** - Membership details and benefits
- 📅 **Events Calendar** - View and manage community events
- ℹ️ **About** - Detailed information about the lounge
- 🔐 **Member Login** - Authentication for event management

## Demo Credentials

- **Username**: member
- **Password**: demo123

## Local Development

1. Simply open `webapp/index.html` in a browser, or
2. Use a local server:
   ```bash
   cd webapp
   python -m http.server 8000
   # or
   npx serve .
   ```

## AWS Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform installed
- Domain `lanternlounge.org` registered and ready to transfer to Route53

### Deployment Steps

1. **Initialize OpenTofu**:
   ```bash
   cd terraform
   tofu init
   ```

2. **Configure variables** (optional):
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars if needed
   ```

3. **Plan and apply infrastructure**:
   ```bash
   tofu plan
   tofu apply
   ```

4. **Update domain nameservers**:
   - Get nameservers: `tofu output route53_name_servers`
   - Update your domain registrar to use these nameservers

5. **Deploy website files**:
   ```bash
   cd ..
   ./deploy.sh
   ```

### Infrastructure Components

- **S3 Buckets**: Static website hosting and domain redirect
- **CloudFront**: CDN for fast global delivery
- **Route53**: DNS management for lanternlounge.org
- **ACM**: SSL certificate for HTTPS
- **IAM**: Minimal required permissions

### Updating the Website

After making changes to files in the `webapp/` directory:

```bash
./deploy.sh
```

This will upload changes and invalidate the CloudFront cache.

## Project Structure

```
lantern-lounge/
├── webapp/                 # Website files
│   ├── assets/            # Images and static assets
│   ├── index.html         # Homepage
│   ├── join-us.html       # Membership page
│   ├── events.html        # Events calendar
│   ├── about.html         # About page
│   ├── login.html         # Member login
│   ├── styles.css         # Main stylesheet
│   ├── script.js          # Main JavaScript
│   └── events.js          # Events management
├── terraform/             # Infrastructure as code
│   ├── main.tf           # Main OpenTofu configuration
│   ├── variables.tf      # Variable definitions
│   ├── outputs.tf        # Output definitions
│   └── terraform.tfvars.example
├── deploy.sh             # Deployment script
└── README.md            # This file
```

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Fonts**: Inter, Playfair Display, Roboto Mono
- **Hosting**: AWS S3 + CloudFront + Route53
- **Infrastructure**: OpenTofu
- **SSL**: AWS Certificate Manager

## Contact

The Lantern Lounge  
177 Bedford St, Lexington MA 02420