import sys
import os
import json
from fastapi import FastAPI
from mangum import Mangum

# Add the backend app directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_path)

try:
    # Import your FastAPI app
    from app.main import app
    
    # Create the Mangum handler for Vercel
    mangum_handler = Mangum(app)
    
    def handler(event, context):
        """Vercel serverless function entry point"""
        try:
            return mangum_handler(event, context)
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
            
except Exception as e:
    # Fallback handler if FastAPI import fails
    def handler(event, context):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Failed to import FastAPI app: {str(e)}',
                'message': 'Backend initialization failed'
            })
        }
