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

        rmssd_val = float(rmssd)
        pupil_pv = body.get('pupilDiameterPV')

        # Tier 2 Decision Logic: Use pupillometry to refine protocol selection
        if pupil_pv is not None and float(pupil_pv) > 0.4:
            # High pupillary variation suggests cognitive load or stress; prioritize calming breathwork
            proto = 'BREATH_1'
        elif rmssd_val < 25:
            # Low HRV also indicates stress
            proto = 'BREATH_1'
        else:
            # Default to relaxation protocol
            proto = 'RELAX_1'

        # Fetch cue
        res = T_PROTO.get_item(Key={'ProtocolID': proto})
        cue = (res.get('Item') or {}).get('VideoURL', 'https://example.com/video.mp4')

        # Idempotency support
        idem = (event.get('headers') or {}).get('x-idempotency-key') or trace_id

        # Tier 2 Multimodal Sensing Data
        pupil_pv = body.get('pupilDiameterPV') # Pupillometry variation
        gaze_score = body.get('gazeStabilityScore') # Gaze stability

        # Log pre-intervention, including optional multimodal data
        log_item = {
            "UserID": user,
            "Timestamp": ts,
            "RMSSD": Decimal(str(rmssd_val)),
            "ProtocolIDApplied": proto,
            "idem": idem
        }
        if pupil_pv is not None:
            log_item['PupilDiameterPV'] = Decimal(str(pupil_pv))
        if gaze_score is not None:
            log_item['GazeStabilityScore'] = Decimal(str(gaze_score))

        T_LOG.put_item(Item=log_item)

        # Async pseudonymizer (fire-and-forget), including optional multimodal data
        try:
            payload = {
                "userId": user,
                "rmssd": rmssd_val,
                "protocolId": proto,
                "timestamp": ts,
            }
            if pupil_pv is not None:
                payload['pupilDiameterPV'] = pupil_pv
            if gaze_score is not None:
                payload['gazeStabilityScore'] = gaze_score

            lambda_client.invoke(
                FunctionName=PSEU_FN,
                InvocationType='Event',
                Payload=json.dumps(payload).encode('utf-8')
            )
        except Exception as e:
            log.warning(json.dumps({"service":"pacer","fn":"decision_engine","traceId":trace_id,"pseudonymizer_invoke":"failed","err":str(e)}))

        log.info(json.dumps({"service":"pacer","fn":"decision_engine","traceId":trace_id,"userId":user,"rmssd":rmssd_val,"protocol":proto}))
        return _json({"protocolId": proto, "cueUrl": cue, "traceId": trace_id})
    except Exception as e:
        log.error(json.dumps({"service":"pacer","fn":"decision_engine","traceId":trace_id,"err":str(e)}))
        return _json({"error":"internal_error","traceId":trace_id}, 500)
