# Lantern Lounge Calendar - Setup Instructions

This calendar feature provides authenticated event management with AWS Cognito, API Gateway, Lambda, and DynamoDB.

## Architecture Overview

- **Frontend**: Static HTML/CSS/JS hosted on S3 + CloudFront
- **Authentication**: AWS Cognito User Pool
- **API**: API Gateway HTTP API with JWT authorizer
- **Backend**: Lambda functions (Python 3.11)
- **Database**: DynamoDB (on-demand billing)

## Deployment Steps

### 1. Deploy Infrastructure with OpenTofu

```bash
# Navigate to infrastructure directory
cd /Users/eric/dev/lantern-lounge/infrastructure/aws

# Initialize OpenTofu (if not already done)
tofu init

# Plan the deployment (review changes)
tofu plan

# Apply the infrastructure
tofu apply

# Get the output configuration
tofu output frontend_config
```

### 2. Configure the Frontend

After running `tofu apply`, you'll get output values. Update `app/webapp/config.js` with these values:

```javascript
const CONFIG = {
    // From: tofu output api_gateway_endpoint
    apiEndpoint: 'https://abc123xyz.execute-api.us-east-1.amazonaws.com',

    cognito: {
        // From: tofu output cognito_user_pool_id
        userPoolId: 'us-east-1_AbCdEfGhI',

        // Your AWS region
        userPoolRegion: 'us-east-1',

        // From: tofu output cognito_app_client_id
        appClientId: '1a2b3c4d5e6f7g8h9i0j1k2l3m',

        // From: tofu output cognito_domain
        domain: 'lantern-lounge-calendar-production.auth.us-east-1.amazoncognito.com'
    },

    api: {
        getItems: '/calendar/items',
        createItem: '/calendar/items',
        updateItem: '/calendar/items',
        deleteItem: '/calendar/items'
    }
};
```

**Quick way to get all values at once:**

```bash
cd /Users/eric/dev/lantern-lounge/infrastructure/aws
tofu output -json frontend_config | jq
```

### 3. Deploy Frontend Files to S3

Upload the calendar files to your S3 bucket:

```bash
# Navigate to webapp directory
cd /Users/eric/dev/lantern-lounge/app/webapp

# Sync files to S3 (replace with your bucket name from: tofu output website_bucket_name)
aws s3 sync . s3://www.lanternlounge.org/ \
  --exclude ".DS_Store" \
  --exclude "*.md"

# Invalidate CloudFront cache (replace with your distribution ID from: tofu output cloudfront_distribution_id)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/calendar.html" "/calendar.js" "/calendar.css" "/config.js"
```

### 4. Test the Calendar

1. Visit: `https://www.lanternlounge.org/calendar.html`
2. You should see the calendar with public events (if any)
3. Click "Sign Up" to create an account
4. Check your email for verification (sent by Cognito)
5. Sign in with your credentials
6. Click "Create Event" to add events

## Features

### Public (Unauthenticated) Users
- View calendar
- See public events only
- Browse by month

### Authenticated Users
- All public features plus:
- Create new events (public or private)
- Edit/delete their own events
- View all events (public + private)
- Manage event visibility

## API Endpoints

- `GET /calendar/items` - Get events (public or all if authenticated)
- `POST /calendar/items` - Create event (requires auth)
- `PUT /calendar/items/{id}` - Update event (requires auth, owner only)
- `DELETE /calendar/items/{id}` - Delete event (requires auth, owner only)

## Event Data Structure

```json
{
  "id": "uuid",
  "timestamp": 1234567890000,
  "title": "Event Title",
  "description": "Event description",
  "date": "2026-03-15",
  "time": "19:00",
  "location": "Lantern Lounge",
  "isPublic": 1,
  "createdBy": "user@example.com",
  "createdByUserId": "cognito-user-id",
  "createdAt": 1234567890000,
  "updatedAt": 1234567890000
}
```

## Security Features

- JWT authentication via Cognito
- Users can only edit/delete their own events
- CORS configured for your domain
- HTTPS only
- Password requirements: 8+ chars, uppercase, lowercase, number, symbol

## Cost Estimate

For low-medium traffic (< 1M requests/month):

- **DynamoDB**: $0 (free tier: 25GB + 200M requests)
- **Lambda**: $0 (free tier: 1M requests + 400K GB-seconds)
- **API Gateway**: ~$1/month (1M free, then $1/million)
- **Cognito**: $0 (free for first 50K MAUs)
- **CloudWatch Logs**: <$1/month

**Total: ~$1-3/month**

## Troubleshooting

### "Failed to load events"
- Check that `config.js` has the correct API endpoint
- Verify API Gateway is deployed: `tofu output api_gateway_endpoint`
- Check browser console for CORS errors

### "Sign in failed"
- Verify Cognito configuration in `config.js`
- Check User Pool ID: `tofu output cognito_user_pool_id`
- Check App Client ID: `tofu output cognito_app_client_id`

### "Unauthorized" when creating events
- Ensure you're signed in
- Check that Authorization header is being sent
- Verify JWT token is valid (check browser dev tools)

### Events not appearing after creation
- Check DynamoDB table: `tofu output dynamodb_table_name`
- View Lambda logs in CloudWatch
- Verify date format is YYYY-MM-DD

## Development & Testing

### Local Testing
You can test locally by running a simple HTTP server:

```bash
cd /Users/eric/dev/lantern-lounge/app/webapp
python3 -m http.server 8080
```

Visit: `http://localhost:8080/calendar.html`

Note: Update `config.js` and Cognito callback URLs to include `http://localhost:8080`

### View Lambda Logs

```bash
# Get function name
tofu output -json | jq -r '.[] | select(.value | contains("lambda"))'

# View logs
aws logs tail /aws/lambda/lantern-lounge-get-calendar-items --follow
```

### Query DynamoDB Directly

```bash
# Get table name
TABLE_NAME=$(cd infrastructure/aws && tofu output -json dynamodb_table_name | jq -r)

# Scan table
aws dynamodb scan --table-name $TABLE_NAME
```

## File Structure

```
app/webapp/
├── calendar.html      # Calendar page UI
├── calendar.js        # Calendar logic + API integration
├── calendar.css       # Calendar-specific styles
└── config.js          # API & Cognito configuration

infrastructure/aws/
├── main.tf            # Existing infrastructure
├── dynamodb.tf        # Calendar items table
├── cognito.tf         # User Pool & App Client
├── lambda.tf          # Lambda functions & IAM roles
├── api_gateway.tf     # API Gateway HTTP API
└── outputs.tf         # Configuration outputs

app/lambda/
├── get_items.py       # GET /calendar/items
├── create_item.py     # POST /calendar/items
├── update_item.py     # PUT /calendar/items/{id}
├── delete_item.py     # DELETE /calendar/items/{id}
├── package.sh         # Packaging script
└── calendar-api.zip   # Deployment package
```

## Next Steps

1. ✅ Deploy infrastructure: `tofu apply`
2. ✅ Configure `config.js` with outputs
3. ✅ Upload files to S3
4. ✅ Test sign up/sign in
5. ✅ Create test events
6. Consider adding email notifications (SNS)
7. Consider adding recurring events
8. Consider adding event categories/tags

## Support

If you encounter issues:
1. Check CloudWatch Logs for Lambda errors
2. Check browser console for frontend errors
3. Verify all configuration values in `config.js`
4. Ensure Cognito users are confirmed (check email)
