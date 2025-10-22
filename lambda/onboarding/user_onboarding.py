import json
import boto3
import os

# This function would be triggered by a Cognito Post-Confirmation trigger.
# Its purpose is to create a user profile in the UserProfiles DynamoDB table
# after a new user signs up and confirms their account.

def handler(event, context):
    # In a real implementation, you would get the user ID and email from the
    # Cognito event trigger payload.
    user_id = event.get('request', {}).get('userAttributes', {}).get('sub')
    email = event.get('request', {}).get('userAttributes', {}).get('email')

    if not user_id:
        # Not a Cognito trigger, or missing user ID.
        return event

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.getenv('USER_PROFILES_TABLE', 'UserProfiles'))

    item = {
        'UserID': user_id,
        'Email': email,
        'is_active_subscriber': False,
        # Other default attributes...
    }

    table.put_item(Item=item)

    return event
