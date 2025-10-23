import json

def lambda_handler(event, context):
    """
    AWS Lambda function for assigning a user to a physiological cluster.

    This is a lightweight, stateless service whose sole responsibility is to
    assign a userId to a specific cluster. In a future, more complex implementation,
    this function would use the provided Autonomic Profile Vector (APV) to perform
    a more sophisticated clustering assignment.

    Parameters:
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format. Expects a 'queryStringParameters'
        key with a 'userId' field.
        Example: {'queryStringParameters': {'userId': 'user_123456'}}

    context: object, required
        Lambda Context runtime methods and attributes.

    Returns:
    ------
    API Gateway Lambda Proxy Output Format: dict
        A JSON response containing the assigned clusterId.
        Example: {'statusCode': 200, 'body': '{"clusterId": "cluster_A"}'}
    """
    print("Received event:", json.dumps(event))

    try:
        # Extract userId from the query string parameters
        query_params = event.get('queryStringParameters', {})
        user_id = query_params.get('userId')

        if not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'userId is a required query parameter.'})
            }

        # --- Clustering Logic ---
        # This is a placeholder for the real clustering algorithm.
        # For now, we use a simple, deterministic heuristic based on the userId length.
        # This matches the simulation in the client-side federated_manager.js.
        if len(user_id) % 2 == 0:
            cluster_id = 'cluster_A'
        else:
            cluster_id = 'cluster_B'

        print(f"Assigned userId '{user_id}' to cluster '{cluster_id}'")

        # Prepare the successful response
        response_body = {
            'clusterId': cluster_id,
            'userId': user_id
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' # For development purposes; lock this down in production
            },
            'body': json.dumps(response_body)
        }

    except Exception as e:
        print(f"Error processing request: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'An internal error occurred.'})
        }

# --- Example for local testing ---
if __name__ == '__main__':
    # Simulate an API Gateway event for a user with an even-length ID
    test_event_A = {
        'queryStringParameters': {
            'userId': 'user_123456'
        }
    }
    print("Testing with user_123456...")
    response_A = lambda_handler(test_event_A, None)
    print("Response A:", response_A)
    assert json.loads(response_A['body'])['clusterId'] == 'cluster_A'

    # Simulate an API Gateway event for a user with an odd-length ID
    test_event_B = {
        'queryStringParameters': {
            'userId': 'user_789'
        }
    }
    print("\nTesting with user_789...")
    response_B = lambda_handler(test_event_B, None)
    print("Response B:", response_B)
    assert json.loads(response_B['body'])['clusterId'] == 'cluster_B'

    # Simulate a bad request
    test_event_bad = {
        'queryStringParameters': {}
    }
    print("\nTesting with bad request...")
    response_bad = lambda_handler(test_event_bad, None)
    print("Response Bad:", response_bad)
    assert response_bad['statusCode'] == 400
