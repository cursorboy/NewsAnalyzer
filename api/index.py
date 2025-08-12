import sys
import os
from fastapi import FastAPI
from mangum import Mangum

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_path)

# Import your FastAPI app
from app.main import app

# Create the Mangum handler for Vercel
handler = Mangum(app)

# Export for Vercel - try multiple export names
app_handler = handler
main = handler
