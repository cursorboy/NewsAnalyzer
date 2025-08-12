import json
import sys
import os

def handler(event, context):
    """FastAPI integration with Vercel serverless functions"""
    try:
        # Add parent directory to path for imports
        parent_dir = os.path.dirname(os.path.dirname(__file__))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        
        # Try to import and use FastAPI
        try:
            from fastapi import FastAPI
            from mangum import Mangum
            from app.main import app as fastapi_app
            
            # Create Mangum handler
            mangum_handler = Mangum(fastapi_app)
            
            # Use FastAPI through Mangum
            return mangum_handler(event, context)
            
        except Exception as import_error:
            # Fallback to simple routing if FastAPI fails
            path = event.get('rawPath', '/')
            method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
            
            if path == '/test':
                response_body = {
                    'message': 'Hello from Python serverless function!',
                    'status': 'working (fallback mode)',
                    'path': path,
                    'method': method,
                    'import_error': str(import_error)
                }
            elif path == '/health':
                response_body = {
                    'status': 'ok',
                    'message': 'Health check passed (fallback mode)',
                    'import_error': str(import_error)
                }
            else:
                response_body = {
                    'message': 'News Analyzer API',
                    'version': '0.1.0 (fallback mode)',
                    'endpoints': {
                        'health': '/health',
                        'test': '/test'
                    },
                    'path': path,
                    'method': method,
                    'import_error': str(import_error),
                    'python_path': sys.path[:3]  # Show first 3 paths for debugging
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
                'message': 'Internal server error',
                'type': str(type(e).__name__)
            })
        }
