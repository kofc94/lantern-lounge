# Google Wallet Setup — Pending Manual Steps

The Google Wallet integration is fully implemented in code but requires a few manual
steps before it will be live. Pick this up once you have access to the Google Pay &
Wallet Console.

## What's already done

- `infrastructure/gcp/wallet.tf` — enables the Wallet API, creates the `wallet-lambda`
  service account, and stores its JSON key in AWS SSM at
  `/lantern-lounge/google/wallet-service-account-key`
- `app/check-ins/lambda.tf` — Lambda layer (PyJWT + cryptography), attached to the
  wallet-pass Lambda, with SSM read permissions for both wallet params
- `app/check-ins/api/get_wallet_pass.py` — signs a Generic pass JWT and returns a
  `google_save_url` alongside the existing `wallet_token`
- `app/react-webapp/src/components/auth/WalletCard.jsx` — "Add to Google Wallet"
  button links to `google_save_url` when present; gracefully disabled otherwise

## Remaining manual steps

### 1. Deploy the GCP module

```bash
cd infrastructure/gcp
make build   # tofu init
make deploy  # tofu apply
```

This creates the `wallet-lambda` service account and writes its key to SSM.
Note the output value **`wallet_service_account_email`** — you'll need it in step 3.

### 2. Register as a Google Wallet Issuer

Go to <https://pay.google.com/business/console> and sign up for a Wallet Issuer account.
This may take up to 24 hours for Google to approve.

### 3. Add the service account to your Issuer

In the Google Pay & Wallet Console → **Wallet objects** → your issuer →
**Service accounts**, add the email from step 1.

### 4. Store the Issuer ID in SSM

Once approved, your Issuer ID is visible in the Console (a long numeric string).

```bash
aws ssm put-parameter \
  --name /lantern-lounge/google/wallet-issuer-id \
  --value YOUR_ISSUER_ID \
  --type String \
  --region us-east-1
```

### 5. Deploy the check-ins app

```bash
cd app/check-ins
make build   # tofu init + pip install wallet deps into .layer/python/
make deploy  # tofu apply
```

### 6. Deploy the react-webapp

```bash
cd app/react-webapp
make deploy
```

## Testing

After all steps are complete, sign in at <https://www.lanternlounge.org>, open your
membership card, and the **Add to Google Wallet** button should be active.
Clicking it redirects to `https://pay.google.com/gp/v/save/<JWT>` where Google
renders the pass preview and lets you save it.

## Notes

- The pass uses the **Generic** pass type with a QR code containing the member's email.
- The pass class ID is `<issuer_id>.lantern_lounge_membership` — Google will create it
  automatically on first save if it doesn't exist.
- If the Issuer ID SSM param is missing, `GET /wallet/pass` still returns the
  `wallet_token` for the QR code; `google_save_url` is simply omitted.
