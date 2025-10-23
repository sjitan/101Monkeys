import json

def handler(event, context):
    """
    Handles federated clustering assignments.
    """
    # This is a stub. In a real implementation, this would involve
    # a more complex clustering algorithm.
    user_id = event.get("queryStringParameters", {}).get("userId")

    if not user_id:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "userId is required"})
        }

    # Simple stubbed logic: assign to one of two clusters based on user ID.
    if int(user_id.replace("U", "")) % 2 == 0:
        cluster_id = "cluster_A"
        model_path = "app/tfl/cluster_A/model.json"
    else:
        cluster_id = "cluster_B"
        model_path = "app/tfl/cluster_B/model.json"

    return {
        "statusCode": 200,
        "body": json.dumps({
            "userId": user_id,
            "clusterId": cluster_id,
            "modelPath": model_path
        })
    }
