import json

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'ok': True,
            'service': '101Monkeys Pacer API'
        })
    }
