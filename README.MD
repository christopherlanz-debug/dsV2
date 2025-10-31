# Digital Signage v2.0

Modern Digital Signage System with React Frontend and FastAPI Backend.

## Features

- Content Management (Images, Videos, PDFs)
- Playlist Management
- Display Management
- Real-time WebSocket Communication
- Hotkey Control (K-key for start/stop/navigate)
- User Authentication & Authorization
- MySQL Database

## Tech Stack

**Backend:** Python 3.11 + FastAPI
**Frontend:** React 18 + Vite
**Database:** MySQL 8.0
**Deployment:** Docker + nginx

## Quick Start

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd digital-signage-v2
\`\`\`

### 2. Configure Environment

\`\`\`bash
cp .env.example .env
# Edit .env and set your passwords and secret key
\`\`\`

### 3. Start Services

\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Create Initial Migration

\`\`\`bash
docker exec -it ds-backend alembic revision --autogenerate -m "Initial migration"
docker exec -it ds-backend alembic upgrade head
\`\`\`

### 5. Access Application

- **Admin Interface:** http://localhost
- **API Documentation:** http://localhost:8000/docs
- **Display Client:** http://localhost/display.html

## Development

### Backend Development

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
\`\`\`

### Create Database Migrations

\`\`\`bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
\`\`\`

## Project Structure

\`\`\`
digital-signage-v2/
├── backend/           # FastAPI backend
├── frontend/          # React frontend (Phase 3)
├── nginx/             # nginx configuration
├── storage/           # File uploads
└── docker-compose.yml
\`\`\`

## License

MIT
