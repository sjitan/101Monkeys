import json
import boto3
import os
import stripe

# This function would be set up as an API Gateway endpoint that Stripe can
# send webhook events to. It needs to verify the Stripe signature and then
# update the user's subscription status in the UserProfiles table.

def handler(event, context):
    # It is critical to verify the webhook signature to ensure the request
    # is from Stripe.
    stripe.api_key = os.getenv('STRIPE_API_KEY')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    signature = event['headers'].get('stripe-signature')

    try:
        stripe_event = stripe.Webhook.construct_event(
            payload=event['body'], sig_header=signature, secret=webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid payload'})}
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid signature'})}

    # Handle the event
    if stripe_event['type'] == 'checkout.session.completed':
        session = stripe_event['data']['object']
        # ... get user ID from session and update DynamoDB ...

    return {'statusCode': 200, 'body': json.dumps({'status': 'success'})}
