# Telegram Files Viewer

A secure view-only Telegram files viewer with backend API.

## Features
- ✅ View-only mode (no downloads)
- ✅ Direct viewing of PDF, Images, Videos
- ✅ Secure backend API
- ✅ Responsive design
- ✅ Fullscreen mode

## Setup

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` file with your Telegram Bot Token
4. `npm start`

### Frontend
1. `cd frontend`
2. Open `index.html` in browser

## Deployment

### Backend (Vercel)
- Deploy `backend/` folder to Vercel
- Set environment variables

### Frontend (GitHub Pages)
- Deploy `frontend/` folder to GitHub Pages

## API Endpoints
- `GET /api/test` - API status
- `GET /api/files` - Get files
- `GET /api/channel-info` - Channel details
