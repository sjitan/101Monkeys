import json, boto3, base64, hashlib, time
secrets = boto3.client('secretsmanager')
ddb = boto3.resource('dynamodb')
T = ddb.Table('AnonymizedTrainingData')
def handler(event, context):
    b = event
    sec = secrets.get_secret_value(SecretId='phi/pseudonymizer/salt')['SecretString']
    salt = base64.b64decode(sec) if sec[:1] in 'M/' else sec.encode()
    anon = hashlib.sha256(b['userId'].encode()+salt).hexdigest()
    ts = b.get('timestamp') or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    # Build the item for DynamoDB, including optional multimodal data
    item_to_put = {
        'AnonID': anon,
        'Timestamp': ts,
        'ProtocolIDApplied': b.get('protocolId', 'NA')
    }

    if 'rmssd' in b:
        item_to_put['RMSSD'] = float(b['rmssd'])

    pupil_pv = b.get('pupilDiameterPV')
    if pupil_pv is not None:
        item_to_put['PupilDiameterPV'] = float(pupil_pv)

    gaze_score = b.get('gazeStabilityScore')
    if gaze_score is not None:
        item_to_put['GazeStabilityScore'] = float(gaze_score)

    T.put_item(Item=item_to_put)

    return {'statusCode':200,'headers':{'Content-Type':'application/json'},'body':json.dumps({'anonId':anon})}
