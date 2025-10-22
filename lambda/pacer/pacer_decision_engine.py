import json
import boto3
import os
import numpy as np
from decimal import Decimal
from datetime import datetime
import logging

# --- Setup ---
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Boto3 clients
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

# Table Names from Env Vars
ANS_TABLE_NAME = os.getenv('ANS_TABLE', 'ANSLongitudinalData')
POLICY_TABLE_NAME = os.getenv('POLICY_TABLE', 'PacerPolicyConfig')
SEED_TABLE_NAME = os.getenv('SEED_TABLE', 'CFSBaselineSeed')
PROTO_TABLE_NAME = os.getenv('PROTO_TABLE', 'YogaProtocolLibrary')

# --- Helper Functions ---
def get_user_id_from_jwt(event):
    # In a real scenario, this would involve decoding the JWT and extracting the 'sub' claim.
    # For this build, we simulate getting it from the authorizer context.
    return event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {}).get('sub', 'mock-user-id-for-testing')

def calculate_mad(data):
    if not data:
        return 0
    median = np.median(data)
    return np.median([abs(x - median) for x in data])

def get_protocol_details(protocol_id):
    proto_table = dynamodb.Table(PROTO_TABLE_NAME)
    details = proto_table.get_item(Key={'ProtocolID': protocol_id}).get('Item', {})
    return details.get('VideoURL', 'https://example.com/default.mp4')

# --- Core Logic ---
def handler(event, context):
    try:
        user_id = get_user_id_from_jwt(event)
        body = json.loads(event.get('body', '{}'))
        logger.info(f"Processing request for user: {user_id} with body: {body}")

        # 1. Fetch Policy
        policy_table = dynamodb.Table(POLICY_TABLE_NAME)
        policy_item = policy_table.get_item(Key={'PolicyID': 'DEFAULT'}).get('Item')
        if not policy_item:
            logger.error("PacerPolicyConfig/DEFAULT not found.")
            return {'statusCode': 503, 'body': json.dumps({'error': 'no_policy'})}

        weights = {k: float(v) for k, v in json.loads(policy_item['Weights']).items()}
        safety_gates = {k: int(v) for k, v in json.loads(policy_item['SafetyGates']).items()}
        cold_start_mode = policy_item['ColdStartMode']

        # 2. Fetch User History
        ans_table = dynamodb.Table(ANS_TABLE_NAME)
        history_response = ans_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('UserID').eq(user_id),
            Limit=safety_gates['rolling_window_n'],
            ScanIndexForward=False
        )
        history = history_response['Items']
        logger.info(f"Found {len(history)} historical records for user.")

        # 3. Determine Baseline
        baseline_medians = {}
        baseline_mads = {}
        metric_keys = ["RMSSD", "PupilDiameterPV", "RespVar", "RespRate", "Fatigue"]

        if len(history) < safety_gates['min_history_n']:
            logger.info("Using cold start mode.")
            if cold_start_mode == 'restorative_only':
                video_url = get_protocol_details("RESTORATIVE_SAVASANA")
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'X-Debug-Scores': json.dumps({'reason': 'cold_start_restorative'})}, 'body': json.dumps({'protocolId': "RESTORATIVE_SAVASANA", 'videoUrl': video_url, 'rationale': {}})}

            # use_seed mode
            seed_table = dynamodb.Table(SEED_TABLE_NAME)
            seed_data = seed_table.scan(Limit=1)['Items'][0] # Use first available seed
            for key in metric_keys:
                baseline_medians[key] = float(seed_data.get(f"{key}_Median", 0))
                baseline_mads[key] = float(seed_data.get(f"{key}_MAD", 1e-6)) # Use epsilon for MAD=0
        else:
            logger.info("Calculating personal baseline.")
            for key in metric_keys:
                values = [float(rec[key]) for rec in history if key in rec]
                if values:
                    baseline_medians[key] = np.median(values)
                    baseline_mads[key] = calculate_mad(values) or 1e-6 # Use epsilon for MAD=0

        # 4. Calculate Z-scores
        z_scores = {}
        for metric, value in body.items():
            if metric in baseline_medians and metric in baseline_mads:
                z = (float(value) - baseline_medians[metric]) / baseline_mads[metric]
                z_scores[f"z_{metric.lower()}"] = z

        # 5. Calculate Composite Score S
        z_rmssd_neg = -z_scores.get('z_rmssd', 0)
        S = (weights.get('w_rmssd', 0) * z_rmssd_neg) + \
            (-weights.get('w_pv', 0) * z_scores.get('z_pupildiameterpv', 0)) + \
            (-weights.get('w_respvar', 0) * z_scores.get('z_respvar', 0)) + \
            (-weights.get('w_resprate', 0) * z_scores.get('z_resprate', 0)) + \
            (-weights.get('w_fatigue', 0) * z_scores.get('z_fatigue', 0))

        # --- STUBBED FOR FOUNDATIONAL STACK ---
        # The complex decision logic (z-scores, baselining, argmax(S)) is stubbed out.
        # This placeholder always returns the safest protocol.
        # Replace this section with the full algorithm when ready.
        protocol_id = "RESTORATIVE_SAVASANA"

        video_url = get_protocol_details(protocol_id)

        # 7. Write Audit Log
        audit_item = body.copy()
        audit_item['UserID'] = user_id
        audit_item['Timestamp'] = datetime.utcnow().isoformat()
        audit_item['ProtocolIDApplied'] = protocol_id
        debug_z = {'z_scores': z_scores, 'S': S}
        audit_item['DebugZ'] = json.dumps(debug_z, default=str)
        audit_item['ttl'] = int(datetime.now().timestamp()) + (86400 * 365) # 1 year TTL

        # Convert floats to Decimals for DynamoDB
        for k, v in audit_item.items():
            if isinstance(v, float):
                audit_item[k] = Decimal(str(v))

        ans_table.put_item(Item=audit_item)

        # 8. Async Invoke Pseudonymizer
        invoke_payload = body.copy()
        invoke_payload['userId'] = user_id
        invoke_payload['protocolId'] = protocol_id

        lambda_client.invoke(
            FunctionName=os.getenv('PSEUDONYMIZER_FN_NAME', 'phi_pseudonymizer'),
            InvocationType='Event',
            Payload=json.dumps(invoke_payload)
        )

        # 9. Format Response
        rationale = {'S': S, **z_scores}
        debug_header = json.dumps(rationale, default=str)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Debug-Scores': debug_header
            },
            'body': json.dumps({'protocolId': protocol_id, 'videoUrl': video_url, 'rationale': rationale}, default=str)
        }

    except Exception as e:
        logger.error(f"Unhandled exception: {e}", exc_info=True)
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
