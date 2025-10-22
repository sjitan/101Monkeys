import boto3
import json
import random

def seed_yoga_protocol_library(db_client):
    table_name = 'YogaProtocolLibrary'
    protocols = [
        {"ProtocolID": "FOUNDATIONAL_SEATED", "Name": "Foundational Seated Pose", "VideoURL": "https://example.com/video1.mp4"},
        {"ProtocolID": "FORWARD_FOLD", "Name": "Seated Forward Fold", "VideoURL": "https://example.com/video2.mp4"},
        {"ProtocolID": "SEATED_TWIST", "Name": "Seated Spinal Twist", "VideoURL": "https://example.com/video3.mp4"},
        {"ProtocolID": "HIP_FIGURE4", "Name": "Seated Figure Four", "VideoURL": "https://example.com/video4.mp4"},
        {"ProtocolID": "SEATED_REVERSE_WARRIOR", "Name": "Seated Reverse Warrior", "VideoURL": "https://example.com/video5.mp4"},
        {"ProtocolID": "RESTORATIVE_SAVASANA", "Name": "Restorative Savasana (Chair)", "VideoURL": "https://example.com/video6.mp4"},
    ]
    for p in protocols:
        db_client.put_item(TableName=table_name, Item={k: {'S': v} for k, v in p.items()})
    print(f"Seeded {len(protocols)} protocols into {table_name}")

def seed_pacer_policy_config(db_client):
    table_name = 'PacerPolicyConfig'
    policy = {
        "PolicyID": "DEFAULT",
        "Weights": json.dumps({"w_rmssd": 1.5, "w_pv": 1.2, "w_respvar": 1.0, "w_resprate": 0.8, "w_fatigue": 2.0}),
        "SafetyGates": json.dumps({"min_history_n": 10, "rolling_window_n": 50}),
        "ColdStartMode": "use_seed"
    }
    db_client.put_item(TableName=table_name, Item={
        'PolicyID': {'S': policy['PolicyID']},
        'Weights': {'S': policy['Weights']},
        'SafetyGates': {'S': policy['SafetyGates']},
        'ColdStartMode': {'S': policy['ColdStartMode']}
    })
    print(f"Seeded 1 policy into {table_name}")

def seed_cfs_baseline_seed(db_client):
    table_name = 'CFSBaselineSeed'
    baselines = [
        {"BaselineID": f"seed_{i}", "Median": str(random.uniform(20, 40)), "MAD": str(random.uniform(5, 15))}
        for i in range(10)
    ]
    for b in baselines:
        db_client.put_item(TableName=table_name, Item={
            'BaselineID': {'S': b['BaselineID']},
            'RMSSD_Median': {'N': b['Median']},
            'RMSSD_MAD': {'N': b['MAD']},
            'PV_Median': {'N': str(random.uniform(0.1, 0.5))},
            'PV_MAD': {'N': str(random.uniform(0.05, 0.2))},
            'RespVar_Median': {'N': str(random.uniform(0.4, 0.8))},
            'RespVar_MAD': {'N': str(random.uniform(0.1, 0.3))},
            'RespRate_Median': {'N': str(random.uniform(12, 18))},
            'RespRate_MAD': {'N': str(random.uniform(2, 5))}
        })
    print(f"Seeded {len(baselines)} baselines into {table_name}")

if __name__ == "__main__":
    dynamodb = boto3.client('dynamodb')
    seed_yoga_protocol_library(dynamodb)
    seed_pacer_policy_config(dynamodb)
    seed_cfs_baseline_seed(dynamodb)
