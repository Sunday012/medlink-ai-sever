# MedLink AI - Database Schema Documentation

## Overview

This document describes the complete database schema for MedLink AI, an offline-first medical referral system for African healthcare centers. The schema is implemented using TypeORM with PostgreSQL and features automatic migrations on every server restart (via `synchronize: true`).

## Entity Relationships

```
User
├─ Facility (many-to-one)
└─ OfflineQueuedAction (one-to-many)

Facility
├─ User (one-to-many)
├─ Patient (one-to-many)
├─ Referral (sent) (one-to-many)
├─ Referral (received) (one-to-many)
├─ AmbulanceDispatchRequest (sent) (one-to-many)
├─ AmbulanceDispatchRequest (received) (one-to-many)
└─ FacilitySpecialty (one-to-many)

Specialty
├─ FacilitySpecialty (one-to-many)
└─ Referral (one-to-many)

Patient
├─ Facility (clinic) (many-to-one)
└─ Referral (one-to-many)

Referral (core entity)
├─ Patient (many-to-one)
├─ Facility (from_facility) (many-to-one)
├─ Facility (to_facility) (many-to-one)
├─ Specialty (recommended_specialty) (many-to-one)
└─ AmbulanceDispatchRequest (one-to-many)

TriageRule
└─ User (created_by) (many-to-one)

AmbulanceDispatchRequest
├─ Referral (many-to-one)
├─ Facility (from_facility) (many-to-one)
├─ Facility (to_facility) (many-to-one)
├─ Patient (many-to-one)
└─ User (assigned_dispatcher) (many-to-one)

FacilitySpecialty (junction table)
├─ Facility (many-to-one)
└─ Specialty (many-to-one)

OfflineQueuedAction
└─ User (many-to-one)
```

## Entity Descriptions

### Users
Stores healthcare workers (nurses, hospital admins, ambulance dispatchers, system admins).

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key (auto-generated) |
| email | String | Unique email for login |
| phone | String | Optional contact number |
| role | Enum | NURSE, HOSPITAL_ADMIN, AMBULANCE_DISPATCHER, SYSTEM_ADMIN |
| password_hash | String | Hashed password (bcrypt) |
| first_name | String | User's first name |
| last_name | String | User's last name |
| facility_id | UUID (FK) | Which facility they work at |
| is_active | Boolean | Soft delete flag |
| last_login_at | Timestamp | For audit/monitoring |
| created_at | Timestamp | Auto-managed |
| updated_at | Timestamp | Auto-managed |

**Indexes:**
- Primary key on `id`
- Unique on `email`

---

### Facilities
Represents clinics, hospitals, and ambulance stations.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Facility name (e.g., "Kano General Hospital") |
| address | String | Physical location |
| latitude | Decimal | GPS coordinate for distance calculations |
| longitude | Decimal | GPS coordinate for distance calculations |
| type | Enum | PRIMARY_CLINIC, SECONDARY_HOSPITAL, TERTIARY_HOSPITAL, AMBULANCE_STATION |
| phone | String | Contact number |
| contact_person | String | Name of admin/coordinator |
| bed_capacity | Integer | Total beds available |
| current_available_beds | Integer | Beds available now (updated by hospital admin) |
| ambulance_available | Boolean | Whether facility has ambulance service |
| last_sync_at | Timestamp | When this facility's data was last synced to clients (for offline-first) |
| is_active | Boolean | Soft delete flag |
| created_at | Timestamp | Auto-managed |
| updated_at | Timestamp | Auto-managed |

**Indexes:**
- Primary key on `id`
- Compound index on `type`, `created_at` (for querying active facilities)

---

### Specialties
Medical specialties (Cardiology, Obstetrics, Emergency Medicine, etc.).

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Unique specialty name |
| code | String | Short code (e.g., "CARD", "OBS", "EMER") |
| description | String | What this specialty handles |
| created_at | Timestamp | Auto-managed |
| updated_at | Timestamp | Auto-managed |

**Indexes:**
- Unique on `name`
- Unique on `code`

---

### FacilitySpecialty
Junction table: which specialties does each facility offer?

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| facility_id | UUID (FK) | References Facility |
| specialty_id | UUID (FK) | References Specialty |
| available_doctors | Integer | How many doctors in this specialty |
| available_beds | Integer | Dedicated beds for this specialty |
| created_at | Timestamp | Auto-managed |
| updated_at | Timestamp | Auto-managed |

**Indexes:**
- Composite primary key on `(facility_id, specialty_id)`
- Foreign keys cascade on delete

---

### Patients
Patient records (created when first presented at a clinic).

| Field | Type | Notes |
|-------|------|-------|
