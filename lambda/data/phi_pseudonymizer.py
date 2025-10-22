import json
import boto3
import base64
import hashlib
import os
from datetime import datetime

secrets_client = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
anonymized_table = dynamodb.Table(os.getenv('ANONYMIZED_TABLE', 'AnonymizedTrainingData'))

def handler(event, context):
    secret = secrets_client.get_secret_value(SecretId='phi/pseudonymizer/salt')
    salt = secret['SecretString']

    user_id = event['userId']

    anon_id = hashlib.sha256((user_id + salt).encode('utf-8')).hexdigest()

    item = {
        'AnonID': anon_id,
        'TS': event.get('timestamp', datetime.utcnow().isoformat()),
        'ProtocolID': event['protocolId']
    }

    # Add all optional metrics if they exist
    metrics = [
        "RMSSD", "RespRate", "RespVar", "IERatio",
        "PupilDiameterPV", "GazeStabilityScore",
        "Fatigue", "PEMScore"
    ]
    for metric in metrics:
        if metric in event:
            item[metric] = event[metric]

    anonymized_table.put_item(Item=item)

    return {'status': 'success'}
