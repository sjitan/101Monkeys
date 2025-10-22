import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    user_id = event['request']['userAttributes']['sub']

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.getenv('USER_PROFILES_TABLE', 'UserProfiles'))

    table.put_item(
        Item={
            'UserID': user_id,
            'is_active_subscriber': False,
            'createdAt': datetime.utcnow().isoformat()
        }
    )

    return event
