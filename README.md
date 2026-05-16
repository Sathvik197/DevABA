# ✒️ Inkwell — Full-Stack Blog Platform

A production-ready blog application with a complete DevOps pipeline: containerization, automated testing, CI/CD, and Kubernetes-ready deployment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP
┌───────────────────────────▼─────────────────────────────┐
│              Frontend  (React + Vite + Nginx)            │
│              Port 80   /api/* → backend proxy            │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP :8000
┌───────────────────────────▼─────────────────────────────┐
│              Backend  (FastAPI + SQLAlchemy)              │
│              Port 8000   REST API                        │
└───────────────────────────┬─────────────────────────────┘
                            │ TCP :5432
┌───────────────────────────▼─────────────────────────────┐
│              Database  (PostgreSQL 16)                   │
│              Persistent volume                           │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer          | Technology                      |
|----------------|---------------------------------|
| Frontend       | React 18, Vite, Vitest          |
| Backend        | Python 3.12, FastAPI, SQLAlchemy|
| Database       | PostgreSQL 16                   |
| Container      | Docker, Docker Compose          |
| Reverse proxy  | Nginx                           |
| CI/CD          | GitHub Actions                  |
| Orchestration  | Kubernetes + HPA (optional)     |

---

## Quick Start (Docker Compose)

```bash
# 1. Clone
git clone https://github.com/YOUR_ORG/blog-app.git
cd blog-app

# 2. Configure env
cp .env.example .env

# 3. Start everything
./scripts/setup.sh

# ─── Or manually ───
docker compose up -d

# 4. Open in browser
open http://localhost          # Frontend
open http://localhost:8000/docs  # API docs (Swagger UI)
```

### Development (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## API Reference

| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| GET    | /health          | Health check      |
| GET    | /posts           | List all posts    |
| GET    | /posts/{id}      | Get single post   |
| POST   | /posts           | Create post       |
| PUT    | /posts/{id}      | Update post       |
| DELETE | /posts/{id}      | Delete post       |

**Create post body:**
```json
{ "title": "Hello", "content": "World", "author": "Alice" }
```

Full interactive docs at `http://localhost:8000/docs`.

---

## Running Tests

```bash
# Run all test suites
./scripts/test.sh

# Backend only
cd backend && pytest test_main.py -v --cov=main

# Frontend only
cd frontend && npm test

# Docker build test stages
docker build ./backend  --target test
docker build ./frontend --target test
```

---

## CI/CD Pipeline

```
Push to branch
    │
    ├─► test-backend  ── pytest + ruff lint + coverage report
    │
    ├─► test-frontend ── vitest + eslint + vite build
    │
    └─► (main only)
         │
         ├─► build-and-push ── multi-stage Docker builds → ghcr.io
         │                     Layer caching (GitHub Actions cache)
         │
         └─► deploy ─────────── SSH into production server
                                docker compose rolling update
                                health check → Slack notification
```

### Required GitHub Secrets

| Secret              | Description                     |
|---------------------|---------------------------------|
| `DEPLOY_HOST`       | Production server IP / hostname |
| `DEPLOY_USER`       | SSH username (e.g. `ubuntu`)    |
| `DEPLOY_SSH_KEY`    | Private SSH key                 |
| `SLACK_BOT_TOKEN`   | Slack bot token (optional)      |
| `SLACK_CHANNEL_ID`  | Slack channel ID (optional)     |

---

## Kubernetes Deployment

```bash
# Replace placeholder org name first
sed -i 's/YOUR_ORG/your-actual-org/g' k8s/manifests.yaml

# Edit secrets in k8s/manifests.yaml, then:
kubectl apply -f k8s/manifests.yaml

# Verify
kubectl get pods -n blog
kubectl get ingress -n blog

# Scale manually
kubectl scale deployment backend --replicas=4 -n blog
```

The HPA will auto-scale the backend between 2–10 replicas at 70% CPU.

---

## Project Structure

```
blog-app/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── test_main.py         # pytest test suite
│   ├── requirements.txt
│   └── Dockerfile           # multi-stage: base → deps → test → production
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── App.test.jsx     # Vitest unit tests
│   │   ├── index.css        # All styles
│   │   └── main.jsx         # Entry point
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile           # multi-stage: builder → test → production (nginx)
│
├── nginx/
│   └── nginx.conf           # SPA fallback + /api proxy
│
├── k8s/
│   └── manifests.yaml       # Deployment, Service, Ingress, HPA, StatefulSet
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # Full CI/CD pipeline
│
├── scripts/
│   ├── setup.sh             # First-time local setup
│   ├── test.sh              # Run all test suites
│   └── deploy.sh            # Production deploy script
│
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Dev override (hot reload)
├── .env.example
└── README.md
```

---

## Deployment Targets

### Option A — Single VM with Docker Compose
Point your DNS at the VM, run `./scripts/setup.sh`, done.

### Option B — Kubernetes (GKE / EKS / AKS)
1. Push images via CI to `ghcr.io`
2. `kubectl apply -f k8s/manifests.yaml`
3. Add cert-manager for automatic TLS via Let's Encrypt

### Option C — Cloud PaaS
The backend image runs on any container platform (Railway, Render, Fly.io).
Set `DATABASE_URL` env var to a managed PostgreSQL connection string.

---

## Security Notes

- Backend runs as non-root user inside container
- Secrets passed via environment variables, never baked into images
- Kubernetes Secrets used for database credentials
- CORS locked down to your domain in production (update `allow_origins` in `main.py`)
- `POSTGRES_PASSWORD` should be a strong random string in production
