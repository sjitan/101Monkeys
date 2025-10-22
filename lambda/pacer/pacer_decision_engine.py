import json, boto3, time
from boto3 import client, resource
ddb = resource('dynamodb')
invoke = client('lambda')
T_LOG = ddb.Table('ANSLongitudinalData')
T_PROTO = ddb.Table('YogaProtocolLibrary')
def handler(event, context):
    b = json.loads(event.get('body') or '{}')
    user, rmssd = b['userId'], float(b['rmssd'])
    ts = b.get('timestamp') or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    proto = 'BREATH_1' if rmssd < 25 else 'RELAX_1'
    cue = T_PROTO.get_item(Key={'ProtocolID':proto}).get('Item',{}).get('VideoURL','https://example.com/video.mp4')
    T_LOG.put_item(Item={'UserID':user,'Timestamp':ts,'RMSSD':rmssd,'ProtocolIDApplied':proto})
    # async pseudonymizer
    invoke.invoke(FunctionName='phi_pseudonymizer', InvocationType='Event',
        Payload=json.dumps({'userId':user,'timestamp':ts,'rmssd':rmssd,'protocolId':proto}))
    return {'statusCode':200,'headers':{'Content-Type':'application/json'},'body':json.dumps({'protocolId':proto,'cueUrl':cue})}
