# Code Sensei 🧠⚡

> **A Multi-Agent Adaptive AI Programming Mentor**

Code Sensei is an AI-powered programming education platform that helps students **become better programmers** — not just generate code.

## Features

- 🧠 **Learning Memory Graph** — tracks every concept, mastery level, and mistake
- 🤖 **AI Mentor Council** — 4 specialized agents (Professor, Senior Engineer, Debug Specialist, Interviewer)
- 🎯 **Adaptive Decision Engine** — contextual bandit RL that personalizes guidance
- 📦 **ZIP Project Analysis** — upload your full project, get file-by-file AI insights
- 📈 **Project Evolution Tracker** — compare versions, track improvement
- 💡 **Progressive Hint System** — 5-level hints before giving the solution
- 🗺️ **Personalized Roadmap** — AI-generated learning path based on weak concepts

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Monaco Editor |
| Backend | Python + Django + Django REST Framework |
| Database | PostgreSQL |
| AI | Ollama (local) + Qwen2.5-Coder |
| Vector DB | ChromaDB |
| Code Parsing | Tree-sitter |
| Task Queue | Celery + Redis |
| Containerization | Docker + Docker Compose |

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Ollama (for local LLM)
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### 1. Clone and configure
```bash
git clone <repo-url>
cd code-sensei
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start with Docker Compose
```bash
docker-compose up -d
```

### 3. Pull the Ollama model
```bash
ollama pull qwen2.5-coder:7b
```

### 4. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin: http://localhost:8000/admin

## Development Setup (without Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
React Frontend (TypeScript + Tailwind)
         ↓ REST API / JWT
Django REST Framework (API Gateway)
         ↓
    AI Orchestrator
    ┌──────┼──────┐
    ↓      ↓      ↓
Learner  Agents  Projects
Model    (4+)    Engine
    └──────┼──────┘
           ↓
  Adaptive Decision Engine
           ↓
    PostgreSQL / ChromaDB
```

## Project Structure

```
code-sensei/
├── frontend/          # React + TypeScript + Tailwind
├── backend/           # Django + DRF
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT License — for educational purposes.
