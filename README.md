# Sahabat Qolbu Project

Monorepo aplikasi ekosistem digital travel umroh & haji Sahabat Qolbu.

## Overview
- `backend`: REST API utama (auth, jamaah, agen, transaksi, master data, content, protected uploads)
- `dashboard`: aplikasi operasional role-based (admin, finance, staff, agen, jamaah)
- `frontend`: website publik/marketing + landing agen
- Kontrak & governance sudah terdokumentasi dan dieksekusi lewat CI (API contract, runbook, PII matrix, incident playbook)

## Repository Structure
```text
sahabat-qolbu-project/
├─ backend/
├─ dashboard/
├─ frontend/
├─ APP_CONCEPT.md
├─ PAYMENT_FLOW.md
├─ API_CONTRACT.md
├─ DEPLOYMENT_RUNBOOK.md
├─ CONCEPT_EXECUTION_PLAN.md
├─ PII_ACCESS_MATRIX.md
└─ INCIDENT_RESPONSE_PLAYBOOK.md
```

## Tech Stack
- Backend: Node.js, Express, MySQL, Drizzle ORM, Zod, JWT (cookie-based), Multer
- Dashboard/Frontend: Next.js 16, React 19, Tailwind, TanStack Query, Axios
- CI/CD: GitHub Actions (deploy, integration checks, monitoring probes, incident drill)

## Core Features (Current)
- API version bridge: `/api` and `/api/v1`
- Payment verification flow dengan status proof (`UPLOADED/VERIFIED/REJECTED`) + reject reason
- Protected upload policy (folder sensitif tidak bisa diakses publik langsung)
- Security baseline: Helmet, CORS policy, CSRF-origin guard (cookie-auth requests), rate limiting
- Contract governance: PR template + OpenAPI baseline + compliance checks
- Ops governance: runbook compliance check, PII governance check, scheduled uptime/critical probes

## Important Documents
- Product concept: `APP_CONCEPT.md`
- Payment SOP/state flow: `PAYMENT_FLOW.md`
- API standard: `API_CONTRACT.md`
- Deploy/runbook: `DEPLOYMENT_RUNBOOK.md`
- Execution progress: `CONCEPT_EXECUTION_PLAN.md`
- PII access governance: `PII_ACCESS_MATRIX.md`
- Incident handling: `INCIDENT_RESPONSE_PLAYBOOK.md`

## Prerequisites
- Node.js 20+
- npm 10+
- MySQL 8+

## Local Setup

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend default URL: `http://localhost:5000`

### 2) Dashboard
```bash
cd dashboard
npm install
npm run dev
```

Dashboard default URL: `http://localhost:3001`

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:3000`

## Environment Variables

### Backend (required minimum)
Referensi lengkap: `backend/.env.example`

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
JWT_SECRET=minimum-32-chars
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:3001
```

### Dashboard (minimum)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Frontend (minimum)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
```

## Common Commands

### Backend
```bash
npm test
npm run test:db-integration
npm run smoke
npm run check:runbook
npm run check:api-contract
npm run check:pii-governance
npm run monitor:uptime
npm run monitor:critical
npm run drill:incident
```

### Dashboard
```bash
npm run lint
npm run test:menu-routes
```

### Frontend
```bash
npm run lint
```

## CI/CD and Operations
- Deploy workflows:
  - `.github/workflows/deploy-backend.yml`
  - `.github/workflows/deploy-dashboard.yml`
  - `.github/workflows/deploy-frontend.yml`
- Monitoring workflows:
  - `.github/workflows/uptime-monitor.yml`
  - `.github/workflows/critical-alert-monitor.yml`
  - `.github/workflows/incident-drill.yml`
- Backup workflows:
  - `.github/workflows/uploads-backup.yml`
  - `.github/workflows/uploads-restore-drill.yml`

## Security Notes
- API docs/public spec endpoints are intentionally blocked in runtime (`SECURITY_DOCS_DISABLED`).
- Sensitive upload folders are protected and must be served via authenticated endpoints.
- Do not commit secrets. `.env*` files are ignored except `.env.example`.

## Current Project Review Snapshot
- Strong areas: payment flow enforcement, API response standardization, route/menu parity, governance automation in CI.
- In progress: full observability maturity (external error tracking provider, alert tuning), native role-centric UX separation, full DB integration execution in CI environments.
- Source of truth for progress: `CONCEPT_EXECUTION_PLAN.md`.

## Team
Sahabat Qolbu IT Team
