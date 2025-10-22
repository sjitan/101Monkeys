import json, boto3
ddb = boto3.resource('dynamodb')
T_LOG = ddb.Table('ANSLongitudinalData')
def handler(event, context):
    b = json.loads(event.get('body') or '{}')
    T_LOG.update_item(Key={'UserID':b['userId'],'Timestamp':b['timestamp']},
        UpdateExpression='SET RMSSD_Post_Protocol=:r, PEMSeverityScore=:p',
        ExpressionAttributeValues={':r':float(b['rmssdPost']),':p':float(b.get('pemScore',0))})
    return {'statusCode':200,'headers':{'Content-Type':'application/json'},'body':json.dumps({'ok':True})}
