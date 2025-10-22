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
    T.put_item(Item={'AnonID':anon,'Timestamp':ts,'RMSSD':float(b['rmssd']),'ProtocolIDApplied':b.get('protocolId','NA')})
    return {'statusCode':200,'headers':{'Content-Type':'application/json'},'body':json.dumps({'anonId':anon})}
