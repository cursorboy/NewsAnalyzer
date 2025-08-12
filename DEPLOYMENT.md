# Deployment Guide - Separate Frontend & Backend

This project is configured for separate Vercel deployments for frontend and backend.

## Backend Deployment (API)

### 1. Deploy from `/api` directory
```bash
cd api
vercel --prod
```

### 2. Configuration
- Uses `api/vercel.json`
- Runtime: Python 3.9
- Entry point: `index.py` with Mangum wrapper
- All routes are handled by the FastAPI app

### 3. Environment Variables
Set these in your Vercel backend project:
- `GOOGLE_API_KEY` - Your Google Custom Search API key
- `GOOGLE_CSE_ID` - Your Google Custom Search Engine ID
- `OPENAI_API_KEY` - Your OpenAI API key (if using AI classification)

## Frontend Deployment

### 1. Deploy from `/frontend` directory
```bash
cd frontend
vercel --prod
```

### 2. Configuration
- Uses `frontend/vercel.json`
- Static build with Vite
- SPA routing with fallback to `index.html`

### 3. Environment Variables
Set this in your Vercel frontend project:
- `VITE_API_BASE` - URL of your deployed backend API (e.g., `https://your-api.vercel.app`)

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## CORS Configuration

The backend is configured to allow:
- `http://localhost:5173` (local development)
- Your frontend Vercel domain (set via environment variables)
- All `*.vercel.app` domains (update in `backend/app/main.py` line 24 for security)

## Project Structure After Deployment

```
NewsAnalyzer/
├── api/                    # Backend deployment
│   ├── vercel.json        # Backend Vercel config
│   ├── index.py           # API entry point
│   └── requirements.txt   # Python dependencies
├── frontend/              # Frontend deployment  
│   ├── vercel.json        # Frontend Vercel config
│   ├── package.json       # Node dependencies
│   └── src/               # React app
└── backend/               # Shared backend code
    └── app/               # FastAPI application
```

## Deployment Steps

1. **Deploy Backend First:**
   - `cd api && vercel --prod`
   - Note the deployed URL (e.g., `https://your-api-xyz.vercel.app`)

2. **Configure Frontend:**
   - Set `VITE_API_BASE=https://your-api-xyz.vercel.app` in frontend project settings
   - `cd frontend && vercel --prod`

3. **Update CORS:**
   - Update line 25 in `backend/app/main.py` with your actual frontend domain
   - Redeploy backend if needed

## Security Notes

- Remove the wildcard `*.vercel.app` CORS origin for production
- Use specific domain names for CORS origins
- Set up proper environment variables for API keys
