# 🚀 DeployFlow — End-to-End CI/CD Automation Platform

> A full-stack CI/CD automation platform with containerization and real-time monitoring.

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-2.4.1-blue)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running with Docker](#running-with-docker)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)

---

## Overview

DeployFlow is an end-to-end CI/CD automation platform that provides a unified dashboard to manage:

- **Build Pipelines** — Automated build, test, dockerize, and deploy workflows
- **Docker Containers** — Real-time container management with resource monitoring
- **Infrastructure Monitoring** — CPU, memory, request rate, and error tracking
- **Centralized Logging** — Aggregated log streams from all microservices

The platform automates the entire software delivery lifecycle — from code commit to production deployment.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    DeployFlow Platform                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────┐  │
│  │   Frontend   │───▶│   Backend   │───▶│ Database │  │
│  │   (React)    │    │  (Express)  │    │(Postgres)│  │
│  │   Port 3000  │    │  Port 5000  │    │Port 5432 │  │
│  └─────────────┘    └──────┬──────┘    └──────────┘  │
│                            │                          │
│                     ┌──────┴──────┐                   │
│                     │    Redis    │                   │
│                     │  Port 6379  │                   │
│                     └─────────────┘                   │
│                                                       │
│  Microservices Monitored:                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │frontend  │ │auth-svc  │ │payments  │              │
│  │:3000 x3  │ │:8080 x2  │ │:8443 x2  │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│  ┌──────────┐ ┌──────────┐                            │
│  │notif-svc │ │api-gw    │                            │
│  │:5000 x1  │ │:443  x3  │                            │
│  └──────────┘ └──────────┘                            │
└──────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology              |
|----------------|------------------------|
| Frontend       | React.js 18 (Hooks)    |
| Backend        | Node.js + Express.js   |
| Database       | PostgreSQL 16          |
| Caching        | Redis 7.2              |
| Containerization | Docker + Docker Compose |
| CI/CD          | GitHub Actions         |
| Deployment     | Vercel (frontend) / Docker (backend) |
| Monitoring     | Custom SVG charts      |

---

## Features

### 1. Pipeline Management
- 4-stage CI/CD workflow: **Build → Test → Dockerize → Deploy**
- Real-time pipeline status (Success / Running / Failed / Queued)
- Create new pipelines via the UI
- Re-run failed pipelines with one click
- Git metadata: repository, branch, commit hash, author

### 2. Container Management
- Docker container monitoring for 7 microservices
- Live CPU and memory usage tracking
- Image version, port mapping, and replica count
- Health status indicators

### 3. Real-Time Monitoring
- CPU Utilization, Memory Usage, Request Rate, Error Rate
- 30-point time-series bar charts
- Active alert system (WARN / INFO / ERROR)
- Auto-scaling notifications

### 4. Centralized Logging
- Live log stream from all services
- Color-coded severity levels (INFO / WARN / ERROR / DEBUG)
- Timestamp, service name, and message detail

### 5. Working Backend API
- RESTful API with 10+ endpoints
- Pipeline simulation engine (pipelines actually run through stages)
- Live metrics generation
- Dynamic log generation

---

## Project Structure

```
deployflow/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # GitHub Actions CI/CD pipeline
├── backend/
│   ├── server.js                  # Express API server
│   ├── tests/
│   │   └── test.js                # Backend test suite (20+ tests)
│   ├── Dockerfile                 # Multi-stage Docker build
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main React dashboard
│   │   ├── App.test.js            # Frontend tests
│   │   └── index.js               # Entry point
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile                 # Multi-stage build + nginx
│   ├── nginx.conf                 # Nginx reverse proxy config
│   └── package.json
├── docker-compose.yml             # Full stack orchestration
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional, for containerized deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/deployflow.git
cd deployflow

# Start the backend
cd backend
npm install
npm start
# Backend runs on http://localhost:5000

# In a new terminal, start the frontend
cd frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

### Run Backend Tests

```bash
cd backend
npm test
```

---

## Running with Docker

### Using Docker Compose (recommended)

```bash
# Build and start all services
docker-compose up --build

# Services:
# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
# Redis    → localhost:6379
# Postgres → localhost:5432
```

### Individual Docker Builds

```bash
# Build backend
docker build -t deployflow-backend ./backend
docker run -p 5000:5000 deployflow-backend

# Build frontend
docker build -t deployflow-frontend ./frontend
docker run -p 3000:3000 deployflow-frontend
```

---

## CI/CD Pipeline

The project includes a fully configured **GitHub Actions** pipeline (`.github/workflows/ci-cd.yml`) with 5 stages:

```
Push to GitHub → Build → Test → Dockerize → Deploy → Notify
```

| Stage | Description |
|-------|-------------|
| 🔨 Build | Installs dependencies, compiles frontend |
| 🧪 Test | Runs backend (20+ tests) and frontend tests in parallel |
| 🐳 Dockerize | Builds Docker images, runs health check |
| 🚀 Deploy | Deploys to production (main branch only) |
| 📢 Notify | Sends deployment notification |

**To see it in action:** Push any commit to the `main` branch and check the **Actions** tab on GitHub.

---

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/pipelines` | List all pipelines |
| GET | `/api/pipelines/:id` | Get pipeline details |
| POST | `/api/pipelines` | Create new pipeline |
| POST | `/api/pipelines/:id/rerun` | Re-run a pipeline |
| GET | `/api/containers` | List containers with live metrics |
| GET | `/api/metrics` | Get monitoring metrics |
| GET | `/api/alerts` | Get active alerts |
| GET | `/api/logs` | Get log stream |

### Example: Create Pipeline

```bash
curl -X POST http://localhost:5000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"name": "my-service", "repo": "github.com/team/svc", "branch": "main"}'
```

---

## Future Enhancements

- [ ] MongoDB integration for persistent pipeline history
- [ ] Real GitHub webhook integration
- [ ] Docker API integration for live container metrics
- [ ] Prometheus + Grafana monitoring stack
- [ ] Slack/Email notifications for pipeline failures
- [ ] Role-based access control (RBAC)
- [ ] Kubernetes orchestration support
- [ ] WebSocket for real-time log streaming

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by the DeployFlow Team**
