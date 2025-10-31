# Digital Signage v2.0

Modern Digital Signage System with React Frontend and FastAPI Backend.

## Features

### Content Management
- Image Support - Display images with automatic scaling
- Video Support - Stream videos with playback controls
- PDF Support - Multi-page PDF viewing with page-by-page display
- Organized content library with metadata

### Playlist Management
- Drag & Drop Interface - Easy item reordering
- Time-Based Scheduling - Display playlists at specific times and days
- Loop & Shuffle - Configure playback behavior
- Duration Override - Set custom display durations per item
- Batch Operations - Manage multiple playlists efficiently

### Display Management
- Real-Time Status - Monitor online/offline screen status
- Live Assignment - Assign playlists to displays instantly
- Batch Assign - Assign playlists to multiple screens at once
- Live Preview - WebSocket-powered real-time view

### Control & Interaction
- Hotkey Control (K-key)
  - Single press: Stop running playlist
  - While stopped: Advance to next slide
  - Hold 3+ seconds: Restart presentation
- Remote Control - Full admin interface
- API-Driven - Complete REST API

### User Management
- Authentication & Authorization - Secure login system
- Role-Based Access - Admin and user roles
- JWT Tokens - Stateless authentication

## Tech Stack

- Frontend: React 18 + Vite + TailwindCSS
- Backend: Python 3.11 + FastAPI
- Database: MySQL 8.0
- Communication: WebSocket + REST API
- Deployment: Docker + Docker Compose + nginx

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone Repository

git clone https://github.com/christopherlanz-debug/dsV2.git
cd dsV2

### 2. Configure Environment

cp .env.example .env

Edit .env and set your passwords and secret key.

### 3. Start Services

docker-compose up -d

Services will start at:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 4. Access Application

- Admin Dashboard: http://localhost/login
- API Documentation: http://localhost:8000/docs
- Display View: http://localhost/display.html

Default Credentials:
- Username: admin
- Password: admin123

## Usage

### 1. Upload Content
1. Go to Content section
2. Click Upload
3. Select images, videos, or PDFs

### 2. Create Playlists
1. Go to Playlists
2. Click Create
3. Add items via drag & drop
4. Configure loop and shuffle

### 3. Add Schedules
1. Open playlist editor
2. Click Show Schedules
3. Set start/end time and days

### 4. Assign to Displays
1. Go to Playlists
2. Select playlist
3. Click Assign to Screens
4. Select target displays

### 5. Control Display
Use K-key on display:
- Press: Stop playlist
- Press (stopped): Next slide
- Hold 3+ sec: Restart

## Project Structure

dsV2/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── nginx/            # nginx config
├── storage/          # File uploads (ignored in git)
└── docker-compose.yml

## API Documentation

Complete API documentation: http://localhost:8000/docs

Key Endpoints:
- POST /api/v1/auth/login
- GET /api/v1/playlists
- POST /api/v1/playlists
- GET /api/v1/playlists/{id}/full
- POST /api/v1/playlists/{id}/schedules
- GET /api/v1/screens
- WS /ws/screen/{screen_id}

## Development

### Backend Development

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

### Frontend Development

cd frontend
npm install
npm run dev

## License

MIT License

## Support

For issues and questions, open an Issue on GitHub.
