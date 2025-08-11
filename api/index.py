import sys
import os

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_path)

# Import your FastAPI app
from app.main import app

# Export for Vercel
def handler(request):
    return app(request)
