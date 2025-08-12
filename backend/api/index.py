import json

def handler(event, context):
    """Simple test handler to verify Python is working"""
    try:
        # Extract the path from the event
        path = event.get('rawPath', '/')
        method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        
        # Simple routing
        if path == '/test':
            response_body = {
                'message': 'Hello from Python serverless function!',
                'status': 'working',
                'path': path,
                'method': method
            }
        elif path == '/health':
            response_body = {
                'status': 'ok',
                'message': 'Health check passed'
            }
        else:
            response_body = {
                'message': 'News Analyzer API',
                'version': '0.1.0',
                'endpoints': {
                    'health': '/health',
                    'test': '/test'
                },
                'path': path,
                'method': method
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            })
        }
