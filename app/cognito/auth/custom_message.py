import os
import urllib.parse

def handler(event, context):
    """
    Custom Message trigger:
    Constructs a custom verification link pointing to the website.
    """
    if event['triggerSource'] == "CustomMessage_SignUp":
        code = event['request']['codeParameter']
        username = event['userName']
        email = event['request']['userAttributes'].get('email')
        
        # Base URL for the website (e.g., https://www.lanternlounge.org)
        website_url = os.environ.get('WEBSITE_URL', 'http://localhost:5173')
        
        # Construct the verification link
        # We pass both username and code so the frontend can call confirmSignUp
        params = urllib.parse.urlencode({
            'code': code,
            'username': username,
            'email': email
        })
        verify_url = f"{website_url}/verify?{params}"
        
        # Load the template (we'll update the template to use a variable placeholder)
        # For simplicity in this Lambda, we'll just use a basic version of your template
        # or we could read the .tpl file if we package it.
        # Let's embed a simplified version of your beautiful template here.
        
        subject = "Your Lantern Lounge Invitation"
        message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>The Lantern Lounge Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Georgia', serif; color: #f5f5f5;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #262626; border: 1px solid #d4af37;">
        <tr>
            <td align="center" style="padding: 40px 0; border-bottom: 1px solid #d4af37;">
                <h1 style="margin: 0; font-size: 32px; color: #d4af37; letter-spacing: 4px; text-transform: uppercase;">
                    The Lantern Lounge
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; font-style: italic; color: #a6a6a6; letter-spacing: 2px;">
                    EST. 2026
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 50px;">
                <h2 style="margin: 0 0 20px; font-size: 22px; color: #f5f5f5; font-weight: normal; text-align: center;">
                    Formal Invitation Request
                </h2>
                <p style="margin: 0 0 30px; line-height: 1.6; color: #cccccc; text-align: center;">
                    You have requested entry to the Lantern Lounge registry. To complete your association, please click the button below:
                </p>
                
                <table align="center" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center" style="padding: 20px 40px; background-color: #d4af37; border-radius: 4px;">
                            <a href="{verify_url}" style="font-family: 'Georgia', serif; font-size: 18px; font-weight: bold; color: #1a1a1a; text-decoration: none; text-transform: uppercase; letter-spacing: 2px;">
                                Verify Invitation
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="margin: 30px 0 0; line-height: 1.6; color: #a6a6a6; text-align: center; font-size: 14px; font-style: italic;">
                    This link is strictly for your personal verification and will expire shortly.
                </p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 30px; background-color: #1a1a1a; border-top: 1px solid #d4af37;">
                <p style="margin: 0; font-size: 12px; color: #666666; letter-spacing: 1px;">
                    &copy; 2026 THE LANTERN LOUNGE ASSOCIATION
                </p>
                <p style="margin: 5px 0 0; font-size: 11px; color: #4d4d4d;">
                    BY APPOINTMENT ONLY &bull; PRIVATE RESIDENCE
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""
        event['response']['emailSubject'] = subject
        event['response']['emailMessage'] = message

    return event
