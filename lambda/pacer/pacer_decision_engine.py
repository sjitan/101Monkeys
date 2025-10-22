import json, time, os, uuid, logging, boto3
from decimal import Decimal

ddb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

T_LOG  = ddb.Table(os.getenv('ANS_TABLE', 'ANSLongitudinalData'))
T_PROTO= ddb.Table(os.getenv('PROTO_TABLE', 'YogaProtocolLibrary'))
PSEU_FN= os.getenv('PSEUDONYMIZER_FN', 'phi_pseudonymizer')

# structured logs
log = logging.getLogger()
log.setLevel(logging.INFO)

def _json(body, code=200):
    return {
        "statusCode": code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.getenv("CORS_ORIGIN", "*"),
            "Access-Control-Allow-Headers": "Content-Type,Authorization,x-idempotency-key",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        "body": json.dumps(body)
    }

def handler(event, context):
    trace_id = str(uuid.uuid4())
    try:
        body = json.loads(event.get('body') or '{}')
        user = body.get('userId')
        rmssd = body.get('rmssd')
        ts = body.get('timestamp') or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

        # Basic validation
        if not isinstance(user, str) or user == "" or not isinstance(rmssd, (int, float)):
            return _json({"error":"invalid_request","traceId":trace_id}, 400)

        # Simple threshold policy
        rmssd_val = float(rmssd)
        proto = 'BREATH_1' if rmssd_val < 25 else 'RELAX_1'

        # Fetch cue
        res = T_PROTO.get_item(Key={'ProtocolID': proto})
        cue = (res.get('Item') or {}).get('VideoURL', 'https://example.com/video.mp4')

        # Idempotency support
        idem = (event.get('headers') or {}).get('x-idempotency-key') or trace_id

        # Log pre-intervention
        T_LOG.put_item(Item={
            "UserID": user,
            "Timestamp": ts,
            "RMSSD": Decimal(str(rmssd_val)),
            "ProtocolIDApplied": proto,
            "idem": idem
        })

        # Async pseudonymizer (fire-and-forget)
        try:
            lambda_client.invoke(
                FunctionName=PSEU_FN,
                InvocationType='Event',
                Payload=json.dumps({"userId": user, "rmssd": rmssd_val, "protocolId": proto, "timestamp": ts}).encode('utf-8')
            )
        except Exception as e:
            log.warning(json.dumps({"service":"pacer","fn":"decision_engine","traceId":trace_id,"pseudonymizer_invoke":"failed","err":str(e)}))

        log.info(json.dumps({"service":"pacer","fn":"decision_engine","traceId":trace_id,"userId":user,"rmssd":rmssd_val,"protocol":proto}))
        return _json({"protocolId": proto, "cueUrl": cue, "traceId": trace_id})
    except Exception as e:
        log.error(json.dumps({"service":"pacer","fn":"decision_engine","traceId":trace_id,"err":str(e)}))
        return _json({"error":"internal_error","traceId":trace_id}, 500)
