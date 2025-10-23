import json

def lambda_handler(event, context):
    """
    AWS Lambda function for classifying a user into an Autonomic Archetype.

    This service takes a user's VAE and NSF scores and returns one of four
    archetypes: Stabilizer, Operator, Insulated, or Amplifier.
    """
    print("Received event:", json.dumps(event))

    try:
        # The frontend will now send a POST request with a JSON body.
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        vae_score = body.get('vae')
        nsf_score = body.get('nsf')

        if not all([user_id, vae_score is not None, nsf_score is not None]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'userId, vae, and nsf are required fields.'})
            }

        # --- Archetype Classification Logic ---
        # VAE (Volitional Autonomic Efficacy): % success rate (0.0 to 1.0)
        # NSF (Non-Local Signal Fidelity): z-score of "flinch" hit rate

        # Define thresholds
        VAE_THRESHOLD = 0.5  # 50% success rate
        NSF_THRESHOLD = 0.0  # z-score > 0 indicates above-average hit rate

        archetype = "Insulated" # Default
        if vae_score >= VAE_THRESHOLD and nsf_score >= NSF_THRESHOLD:
            archetype = "Operator"
        elif vae_score >= VAE_THRESHOLD and nsf_score < NSF_THRESHOLD:
            archetype = "Stabilizer"
        elif vae_score < VAE_THRESHOLD and nsf_score >= NSF_THRESHOLD:
            archetype = "Amplifier"

        print(f"Classified userId '{user_id}' with VAE={vae_score}, NSF={nsf_score} as '{archetype}'")

        response_body = {
            'userId': user_id,
            'archetype': archetype
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON in request body.'})
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
    def run_test(name, event, expected_archetype):
        print(f"--- Testing: {name} ---")
        response = lambda_handler(event, None)
        print("Response:", response)
        assert response['statusCode'] == 200
        assert json.loads(response['body'])['archetype'] == expected_archetype
        print("PASS\n")

    # Test Operator
    event_operator = {'body': json.dumps({'userId': 'user_op', 'vae': 0.7, 'nsf': 0.5})}
    run_test("Operator", event_operator, "Operator")

    # Test Stabilizer
    event_stabilizer = {'body': json.dumps({'userId': 'user_stab', 'vae': 0.8, 'nsf': -0.2})}
    run_test("Stabilizer", event_stabilizer, "Stabilizer")

    # Test Amplifier
    event_amplifier = {'body': json.dumps({'userId': 'user_amp', 'vae': 0.3, 'nsf': 1.1})}
    run_test("Amplifier", event_amplifier, "Amplifier")

    # Test Insulated
    event_insulated = {'body': json.dumps({'userId': 'user_ins', 'vae': 0.2, 'nsf': -0.5})}
    run_test("Insulated", event_insulated, "Insulated")

    # Test Bad Request
    print("--- Testing: Bad Request ---")
    event_bad = {'body': json.dumps({'userId': 'user_bad'})}
    response_bad = lambda_handler(event_bad, None)
    print("Response:", response_bad)
    assert response_bad['statusCode'] == 400
    print("PASS\n")
