import json
import boto3
import os
from decimal import Decimal

def handler(event, context):
    body = json.loads(event['body'])
    user_id = body['userId']
    session_timestamp = body['timestamp'] # The SK of the record to update

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.getenv('ANS_TABLE', 'ANSLongitudinalData'))

    # Fetch the original record
    original_record = table.get_item(
        Key={'UserID': user_id, 'Timestamp': session_timestamp}
    ).get('Item')

    if not original_record:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Original session not found'})}

    # Construct the update expression dynamically
    update_expression = "SET "
    expression_values = {}

    if 'rmssdPost' in body:
        rmssd_post = Decimal(str(body['rmssdPost']))
        update_expression += "RMSSD_Post_Protocol = :rmssd_post, "
        expression_values[':rmssd_post'] = rmssd_post

        if 'RMSSD' in original_record:
            delta = rmssd_post - original_record['RMSSD']
            update_expression += "RMSSD_Delta = :delta, "
            expression_values[':delta'] = delta

    # Add other post-session metrics
    # ...

    # Remove trailing comma and space
    update_expression = update_expression.rstrip(', ')

    if not expression_values:
        return {'statusCode': 400, 'body': json.dumps({'error': 'No update data provided'})}

    table.update_item(
        Key={'UserID': user_id, 'Timestamp': session_timestamp},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'success'})
    }
