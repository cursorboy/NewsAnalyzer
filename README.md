# Political Spectrum News Analyzer

A web application that visualizes news coverage across the political spectrum by positioning articles from different outlets on an interactive horizontal bias scale.

## Features

- **Interactive Spectrum Visualization**: Articles positioned on a gradient from left (blue) to right (red)
- **Real-time Search**: Search any news topic and see coverage across the political spectrum
- **Outlet Classification**: Automatic bias detection based on known outlet mappings
- **Demo Mode**: Works without API keys using sample data for testing
- **Responsive Design**: Clean, modern UI with smooth animations

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python
- **External APIs**: Google Custom Search (optional)
- **Classification**: Domain-based outlet bias mapping

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Open Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Configuration

### Demo Mode (Default)
The app works out of the box with demo data. No API keys required for testing.

### Production Mode
To use real Google search results, add these to `backend/.env`:

```
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
```

## Usage

1. **Landing Page**: Enter any news topic (e.g., "climate change", "tax policy")
2. **Search Results**: View articles positioned on the political spectrum
3. **Article Cards**: Click to read full articles on original sites
4. **Bias Indicators**: See spectrum scores and confidence levels

## Outlet Bias Mapping

Current mappings include:
- **Center (0.0)**: Reuters, AP News, BBC
- **Left (-0.4)**: NY Times, Washington Post  
- **Right (+0.6)**: Fox News
- **Center-Right (+0.2)**: Wall Street Journal, The Hill
- **Far Right (+0.9)**: Breitbart

## Development

### Project Structure

```
NewsAnalyzer/
├── frontend/          # React + TypeScript app
│   ├── src/
│   │   ├── components/    # Spectrum, LoadingSpectrum
│   │   ├── hooks/         # useSearch
│   │   ├── lib/           # API client
│   │   └── App.tsx        # Main routes
│   └── package.json
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── services/      # Google API, classifier
│   │   ├── config.py      # Settings
│   │   └── main.py        # FastAPI app
│   └── requirements.txt
└── README.md
```

### Adding New Outlets

Edit `backend/app/services/classifier.py` and add entries to `OUTLET_BIAS` dict:

```python
OUTLET_BIAS = {
    "example.com": 0.5,  # Score from -1.0 (far left) to +1.0 (far right)
    # ... other outlets
}
```

## API Reference

### `GET /search?q={query}`

Returns articles positioned on political spectrum.

**Response:**
```json
{
  "query": "climate change",
  "articles": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "snippet": "Article excerpt...",
      "source": "example.com",
      "spectrum_score": -0.4,
      "confidence": 0.9,
      "method": "outlet"
    }
  ]
}
```

### Prototype Endpoints

- `GET /articles` — list recent articles with bias scores (mock)
- `GET /articles/{id}` — detailed breakdown with highlighted phrases (mock)
- `GET /narratives` — clustered story framings (mock)

## Deployment

### Backend (FastAPI)

Deploy to Render/Railway/Fly.io.

Env vars:

- `GOOGLE_API_KEY` (optional)
- `GOOGLE_CSE_ID` (optional)
- `ENVIRONMENT=production`
- `FRONTEND_ORIGIN=https://<your-vercel-domain>`

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (Vercel)

Project Settings → Environment Variables:

- `VITE_API_BASE=https://<your-backend-host>`

Build Command: `npm run build`

Output Directory: `dist`

## Roadmap

- [ ] AI-powered classification for unknown outlets
- [ ] Historical trend analysis
- [ ] User customization and filters
- [ ] Mobile app
- [ ] Real-time news monitoring
- [ ] Social sharing features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 