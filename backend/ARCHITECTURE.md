# MedLink AI - Backend Architecture Overview

## Project Status
✅ **Phase 1: Backend Core Implementation - COMPLETE**

All core infrastructure, data models, business logic, and REST API endpoints have been implemented and are ready for frontend integration.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | NestJS | Scalable server framework |
| **Language** | TypeScript | Type-safe development |
| **Database** | PostgreSQL 12+ | Relational data storage |
| **ORM** | TypeORM | Database abstraction & migrations |
| **Validation** | class-validator | Request validation |
| **QR Codes** | qrcode | Referral QR generation |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (PWA/Mobile)                      │
│  - Offline-first: IndexedDB local cache                     │
│  - Queues actions when offline                              │
│  - Syncs when connectivity returns                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API + WebSocket
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              MedLink AI Backend (NestJS)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Layer (Controllers)                             │   │
│  │  - PatientController      - ReferralController       │   │
│  │  - FacilityController     - TriageController         │   │
│  │  - SpecialtyController    - SyncController           │   │
│  │  - AmbulanceController                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Layer (Business Logic)                      │   │
│  │  - PatientService         - ReferralService          │   │
│  │  - FacilityService        - TriageService (AI)       │   │
│  │  - SpecialtyService       - SyncService              │   │
│  │  - AmbulanceDispatchService                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Access Layer (TypeORM Repositories)            │   │
│  │  - Entity models with relationships                  │   │
│  │  - Auto-migration on startup (synchronize: true)     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │ PostgreSQL Driver
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            PostgreSQL Database (Supabase)                    │
│  - 9 core tables (users, facilities, patients, etc.)        │
│  - Automatic schema versioning via TypeORM                  │
│  - Indexes for common queries                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Entities & Data Flow

### 1. Patient Registration
```
Client (offline)
  → Create Patient (queued)
  → Queue with user ID and payload
  
Client (online)
  → Sync pending actions
  → POST /sync/sync
  → PatientService.createPatient()
  → Saved to DB
```

### 2. Referral Creation (Offline-First)
```
Client (offline)
  → POST /triage/evaluate (local rule engine)
  → Symptoms + test results → Urgency + specialty
  → POST /referrals (with offline_recommendation)
  → Queued locally
  → QR code generated on-device
  
Client (online)
  → POST /sync/sync
  → Server validates patient, facility, specialty
  → Saves referral
  → Optional reviewed recommendation can be attached by an authorized service
  → Nurse sees the referral and deterministic triage result
```

### 3. QR Verification (Receiving Hospital)
```
Receiving Hospital (scans QR)
  → POST /referrals/:id/verify-qr
  → Server confirms facility match
  → Status: CREATED → SENT → RECEIVED
  → Check-in timestamp recorded
  → Referral marked as received
```

### 4. Ambulance Dispatch
```
Referral marked URGENT (critical)
  → Auto-create ambulance dispatch request
  → POST /ambulance/dispatch
  → Status: REQUESTED → ACCEPTED → IN_TRANSIT → DELIVERED
  → Dispatcher tracks ETA, GPS coordinates
  → Nurse sees live dispatch status
```

### 5. Triage Rule Updates (Admin)
```
Admin publishes new rule version
  → POST /triage/rules (with new rule_set)
  → POST /triage/rules/:id/publish
  → All active = false except new version
  → Clients sync new rule next time online
  → Offline triage uses new logic immediately
```

---

## Database Schema (9 Tables)

### Core Tables
1. **users** — Healthcare workers (nurses, admins, dispatchers)
2. **facilities** — Hospitals, clinics, ambulance stations
3. **specialties** — Medical specialties (Cardiology, Obstetrics, etc.)
4. **facility_specialties** — Junction: which facilities offer which specialties
5. **patients** — Patient records
6. **referrals** — Main entity: patient referrals with offline/cloud recommendations
7. **triage_rules** — Versioned clinical decision rules
8. **ambulance_dispatch_requests** — Ambulance request/status tracking
9. **offline_queued_actions** — Sync reconciliation queue

**Key Features:**
- ✅ All tables have `created_at`, `updated_at` timestamps
- ✅ UUIDs for security and scalability
