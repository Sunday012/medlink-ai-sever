# MedLink API

NestJS/PostgreSQL backend for the MedLink referral-operations MVP.

## Capabilities

- Account registration/login, scrypt password hashing, signed bearer sessions,
  central authentication, and role-restricted sensitive operations.
- Facilities and their specialty/bed availability.
- Patient registration and referral lifecycle management.
- Versioned, deterministic triage rules.
- QR generation and receiving-facility handoff verification.
- Ambulance request, assignment, status, and cancellation lifecycle.
- Per-user queued-action ingestion, replay, failure reporting, and retry.
- Development seed data for facilities, specialties, and a baseline triage rule.

## Start locally

```bash
docker compose up -d postgres
cd backend
cp .env.example .env
npm install
npm run start:dev
```

The API listens on `http://localhost:3000`; all routes use `/api/v1`. Check
`GET /api/v1/health` without authentication, then register through
`POST /api/v1/auth/register` or use the web frontend.

## Verify

```bash
cd backend
npm test -- --runInBand
npm run build
npm audit --omit=dev --audit-level=high
```

## Configuration

See `backend/.env.example`. In production, provide a strong `JWT_SECRET`, set
`DB_SYNCHRONIZE=false`, set `SEED_DEMO_DATA=false`, configure an explicit CORS
origin, and use reviewed migrations rather than schema synchronization.

## Scope boundary

MedLink currently uses deterministic rules—not an external generative-AI
provider—for triage. The rules shipped here are development examples and are
not clinical guidance. Production healthcare use requires clinical validation,
tenant/facility authorization, audit logs, privacy/security review, monitoring,
backup and recovery, and the applicable regulatory approvals.
