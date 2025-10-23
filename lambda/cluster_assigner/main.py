import json

def lambda_handler(event, context):
    """
    AWS Lambda function for classifying a user into an Autonomic Archetype.

    This service takes a user's VAE and NSF scores and returns one of four
    archetypes: Stabilizer, Operator, Insulated, or Amplifier, based on the
    "Autonomic Profile" Rubric.
    """
    print("Received event:", json.dumps(event))

    try:
        # The frontend will send a POST request with a JSON body.
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        vae_score = body.get('vae')
        nsf_score = body.get('nsf')

        if not all([user_id, vae_score is not None, nsf_score is not None]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId, vae, and nsf are required fields.'})
            }

        # --- Archetype Classification Logic ---
        # VAE (Volitional Autonomic Efficacy): % success rate (0.0 to 1.0)
        # NSF (Non-Local Signal Fidelity): z-score of "flinch" hit rate

        VAE_THRESHOLD = 0.5  # High VAE is >= 50% success
        NSF_THRESHOLD = 0.0  # High NSF is a z-score > 0.0

        archetype = "Insulated" # Default: Low VAE / Low NSF
        if vae_score >= VAE_THRESHOLD and nsf_score >= NSF_THRESHOLD:
            archetype = "Operator"      # High VAE / High NSF
        elif vae_score >= VAE_THRESHOLD and nsf_score < NSF_THRESHOLD:
            archetype = "Stabilizer"    # High VAE / Low NSF
        elif vae_score < VAE_THRESHOLD and nsf_score >= NSF_THRESHOLD:
            archetype = "Amplifier"     # Low VAE / High NSF

        print(f"Classified userId '{user_id}' with VAE={vae_score}, NSF={nsf_score} as '{archetype}'")

        response_body = {
            'userId': user_id,
            'archetype': archetype
        }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response_body)
        }

    except json.JSONDecodeError:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid JSON in request body.'})}
    except Exception as e:
        print(f"Error processing request: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'An internal error occurred.'})
        }

# --- Local Testing Suite ---
if __name__ == '__main__':
    def run_test(name, event, expected_archetype, expected_code=200):
        print(f"--- Testing: {name} ---")
        response = lambda_handler(event, None)
        print(f"Response: {response}")
        assert response['statusCode'] == expected_code
        if expected_code == 200:
            assert json.loads(response['body'])['archetype'] == expected_archetype
        print("PASS\n")

    # Operator (High VAE, High NSF)
    run_test("Operator", {'body': json.dumps({'userId': 'user_op', 'vae': 0.7, 'nsf': 0.5})}, "Operator")

    # Stabilizer (High VAE, Low NSF)
    run_test("Stabilizer", {'body': json.dumps({'userId': 'user_stab', 'vae': 0.8, 'nsf': -0.2})}, "Stabilizer")

    # Amplifier (Low VAE, High NSF)
    run_test("Amplifier", {'body': json.dumps({'userId': 'user_amp', 'vae': 0.3, 'nsf': 1.1})}, "Amplifier")

    # Insulated (Low VAE, Low NSF)
    run_test("Insulated", {'body': json.dumps({'userId': 'user_ins', 'vae': 0.2, 'nsf': -0.5})}, "Insulated")

    # Edge Case: VAE on threshold
    run_test("Edge Case - VAE on Threshold", {'body': json.dumps({'userId': 'user_edge', 'vae': 0.5, 'nsf': 0.1})}, "Operator")

    # Edge Case: NSF on threshold
    run_test("Edge Case - NSF on Threshold", {'body': json.dumps({'userId': 'user_edge', 'vae': 0.6, 'nsf': 0.0})}, "Operator")

    # Bad Request (Missing VAE)
    run_test("Bad Request - Missing VAE", {'body': json.dumps({'userId': 'user_bad'})}, None, 400)

    # Bad Request (Invalid JSON)
    run_test("Bad Request - Invalid JSON", {'body': 'not-json'}, None, 400)
