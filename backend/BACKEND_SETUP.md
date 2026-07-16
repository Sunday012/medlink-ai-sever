# MedLink AI - Backend Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- PostgreSQL 12+ ([download](https://www.postgresql.org/download) or use Docker)
- npm or yarn
- Git

### 1. Clone & Install

```bash
git clone https://github.com/icekidtech/medlink-ai.git
cd medlink-ai
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**

```bash
# Create database
psql -U postgres
CREATE DATABASE medlink_ai;
\q
```

**Option B: Docker PostgreSQL**

```bash
docker run --name medlink-postgres \
  -e POSTGRES_DB=medlink_ai \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=medlink_ai
NODE_ENV=development
API_PORT=3000
```

### 4. Start Development Server

```bash
npm run start:dev
```

Server will:
- Connect to PostgreSQL
- Auto-create/migrate schema (TypeORM synchronize: true)
- Start listening on http://localhost:3000

You'll see:
```
[Nest] 12345   07/16/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345   07/16/2026, 10:30:02 AM     LOG [TypeOrmModule] Database connected
MedLink AI Backend running on port 3000
```

### 5. Verify Database

```bash
# Connect to your database
psql -U postgres -d medlink_ai

# List all tables
\dt

# You should see:
# - users
# - facilities
# - specialties
# - facility_specialties
# - patients
# - referrals
# - triage_rules
# - ambulance_dispatch_requests
# - offline_queued_actions
```

### 6. Test an Endpoint

```bash
# Get all facilities (should be empty initially)
curl -X GET http://localhost:3000/api/v1/facilities \
  -H "Content-Type: application/json"

# Create a specialty
curl -X POST http://localhost:3000/api/v1/specialties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cardiology",
    "code": "CARD",
    "description": "Heart and cardiovascular diseases"
  }'
```

---

## Development Workflow

### Project Structure

```
medlink-ai/
├── src/
│   ├── controllers/          # HTTP endpoint handlers
│   ├── services/             # Business logic
│   ├── entities/             # TypeORM database models
│   ├── database/             # Database configuration
│   ├── app.module.ts         # Main app module
│   └── main.ts               # Entry point
├── test/                     # End-to-end tests
├── DATABASE_SCHEMA.md        # Schema documentation
├── API_ENDPOINTS.md          # API reference
├── BACKEND_SETUP.md          # This file
├── package.json
├── tsconfig.json
└── .env.example
```

### Useful Commands

**Development**
```bash
npm run start:dev        # Start with auto-reload
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

**Testing**
```bash
