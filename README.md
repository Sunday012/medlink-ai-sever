# MedLink AI

An offline-first medical referral management system designed for African primary healthcare centers. MedLink AI enables seamless patient referrals between healthcare facilities with intelligent triage, real-time ambulance dispatch tracking, and automatic synchronization when connectivity is restored.

## Overview

MedLink AI bridges the gap in healthcare infrastructure by providing a robust referral system that works reliably in low-connectivity environments. The system combines rule-based triage with cloud-based AI refinement to deliver smart clinical recommendations while maintaining full functionality offline.

### Key Problems Solved

- **Limited Connectivity**: Complete offline functionality with automatic sync when online
- **Inconsistent Triage**: Deterministic rule-based triage engine that works without internet
- **Patient Tracking**: QR-based referral verification and ambulance dispatch tracking
- **Data Integrity**: Offline action queuing with conflict resolution and error tracking
- **Scalability**: Supports multiple facilities and specialties across regions

## Features

### Core Capabilities

- **Offline-First Architecture**: Create referrals, triage patients, and dispatch ambulances offline
- **Intelligent Triage**: Rule-based clinical decision support (offline) + cloud AI enhancement (online)
- **QR-Based Verification**: Generate and scan QR codes for referral verification at receiving facilities
- **Ambulance Dispatch**: Real-time ambulance tracking with GPS coordinates and ETA management
- **Action Queuing**: Automatic queueing of all offline operations with replay on reconnection
- **Multi-Facility Support**: Link patients across primary, secondary, and tertiary facilities
- **Specialty Management**: Track available doctors and beds per specialty per facility
- **Role-Based Access**: Nurse, hospital admin, ambulance dispatcher, and system admin roles

### Clinical Features

- **Patient Management**: Complete patient records with medical history
- **Referral Lifecycle**: CREATED → SENT → RECEIVED → COMPLETED/DECLINED workflow
- **Symptom Tracking**: Log symptoms and test results for each referral
- **Urgency Levels**: CRITICAL, HIGH, MEDIUM, LOW with facility type recommendations
- **Recommendations**: Offline triage recommendations + cloud AI-enhanced recommendations
- **Sync Reporting**: Detailed sync results showing successful, failed, and pending actions

## Tech Stack

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL (via Supabase)
- **ORM**: TypeORM with auto-migration
- **QR Codes**: qrcode library
- **Validation**: class-validator, class-transformer
- **Environment**: Node.js with TypeScript strict mode

### Development
- **Runtime**: Node.js
- **Language**: TypeScript 5.7
- **Linting**: ESLint 9
- **Formatting**: Prettier 3.4
- **Testing**: Jest 30
- **Package Manager**: npm

## Architecture

### Data Model

The system is built around 9 core entities:

```
User (roles: nurse, hospital_admin, ambulance_dispatcher, system_admin)
├── Facility (hospitals, clinics, primary/secondary/tertiary)
│   ├── FacilitySpecialty (specialties available + doctor/bed counts)
│   │   └── Specialty (medical specialties)
│   ├── Patient (patient records linked to clinic)
│   │   └── Referral (patient referrals between facilities)
│   │       └── AmbulanceDispatchRequest (emergency transport)
│   └── OfflineQueuedAction (all offline mutations for sync)
└── TriageRule (versioned clinical rules)
```

### Offline-First Sync Flow

```
1. Client Offline
   ↓
2. Action Queued in OfflineQueuedAction table
   ├── CREATE_REFERRAL
   ├── UPDATE_REFERRAL
   ├── CREATE_PATIENT
   ├── UPDATE_PATIENT
   ├── DISPATCH_AMBULANCE
   └── UPDATE_DISPATCH_STATUS
   ↓
3. Connection Restored
   ↓
4. Sync Service Replays All Pending Actions
   ├── Validates data integrity
   ├── Executes service methods
   ├── Tracks success/failure
   └── Updates synced_at timestamp
   ↓
5. Failed Actions Marked with sync_error
   └── Can be retried manually
```

### Triage Engine

The triage service evaluates patient symptoms and test results against versioned rule sets:

```json
{
  "urgency_tiers": {
    "critical": {
      "symptoms": ["chest pain", "difficulty breathing"],
      "test_results": {
        "oxygen_level": { "max": 94 }
      },
      "actions": { "specialist": "cardiology" }
    },
    "high": { ... },
    "medium": { ... },
    "low": { ... }
  }
}
```

Result: `{ urgency_level, recommended_specialty, facility_type, reasoning }`

## Project Structure

```
src/
├── controllers/          # 7 HTTP endpoint handlers
│   ├── patient.controller.ts
│   ├── facility.controller.ts
│   ├── specialty.controller.ts
│   ├── referral.controller.ts
│   ├── triage.controller.ts
│   ├── sync.controller.ts
│   └── ambulance-dispatch.controller.ts
├── services/             # 7 business logic services
│   ├── patient.service.ts
│   ├── facility.service.ts
│   ├── specialty.service.ts
│   ├── referral.service.ts
│   ├── triage.service.ts
│   ├── sync.service.ts
│   └── ambulance-dispatch.service.ts
├── entities/             # 9 TypeORM entity models
│   ├── base.entity.ts
│   ├── user.entity.ts
│   ├── facility.entity.ts
│   ├── specialty.entity.ts
│   ├── facility-specialty.entity.ts
│   ├── patient.entity.ts
│   ├── referral.entity.ts
│   ├── triage-rule.entity.ts
│   ├── ambulance-dispatch-request.entity.ts
│   └── offline-queued-action.entity.ts
├── database/
│   └── database.config.ts
├── app.module.ts         # NestJS root module
└── main.ts               # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database (or Supabase instance)

### Installation

```bash
# Clone repository
git clone <repository>
cd medlink-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials
```

### Development

```bash
# Start development server with auto-reload
npm run start:dev

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Format code
npm run format

# Lint code
npm run lint
```

### Build & Production

```bash
# Build TypeScript
npm run build

# Run production build
npm run start:prod
```

### Database

The system uses TypeORM with auto-migration enabled in development:

```typescript
synchronize: true  // Auto-creates/updates schema on server start
```

**⚠️ Warning**: Disable `synchronize` in production and use explicit migrations instead.

## API Endpoints

The backend exposes 100+ REST endpoints across 7 controllers:

### Patient Endpoints
- `POST /patients` - Create patient
- `GET /patients/:id` - Get patient
- `GET /patients/phone/:phone` - Find by phone
- `GET /clinics/:clinicId/patients` - List by clinic
- `PATCH /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Facility Endpoints
- `POST /facilities` - Create facility
- `GET /facilities/:id` - Get facility
- `GET /facilities/type/:type` - Filter by type
- `GET /facilities` - List all
- `GET /facilities/nearest` - Find nearest facility
- `PATCH /facilities/:id` - Update facility
- `POST /facilities/:id/specialties` - Add specialty
- `DELETE /facilities/:id/specialties/:specialtyId` - Remove specialty

### Referral Endpoints
- `POST /referrals` - Create referral
- `GET /referrals/:id` - Get referral
- `GET /patients/:patientId/referrals` - List by patient
- `GET /facilities/:facilityId/referrals` - List by facility
- `GET /referrals/status/:status` - Filter by status
- `PATCH /referrals/:id` - Update referral
- `PATCH /referrals/:id/status` - Update status
- `POST /referrals/:id/verify-qr` - Verify QR code
- `POST /referrals/:id/cloud-recommendation` - Add AI recommendation

### Triage Endpoints
- `POST /triage/rules` - Create rule
- `GET /triage/rules` - List all rules
- `GET /triage/rules/:version` - Get by version
- `POST /triage/rules/:id/publish` - Publish rule
- `POST /triage/evaluate` - Evaluate triage

### Sync Endpoints
- `POST /sync/queue` - Queue offline action
- `POST /sync/:userId/sync` - Sync pending actions
- `GET /sync/:userId/pending` - List pending actions
- `GET /sync/:userId/failed` - List failed actions
- `POST /sync/:actionId/retry` - Retry failed action
- `DELETE /sync/:actionId` - Delete queued action
- `GET /sync/:userId/stats` - Get sync statistics

### Ambulance Dispatch Endpoints
- `POST /dispatch` - Create dispatch request
- `GET /dispatch/:id` - Get dispatch
- `GET /facilities/:facilityId/dispatch` - List by facility
- `GET /dispatch/status/:status` - Filter by status
- `POST /dispatch/:id/assign` - Assign dispatcher
- `PATCH /dispatch/:id/status` - Update status
- `POST /dispatch/:id/cancel` - Cancel dispatch

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for detailed request/response examples.

## Configuration

### Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=medlink_ai

NODE_ENV=development
PORT=3000

# Optional: Claude API for cloud triage enhancement
CLAUDE_API_KEY=your_key_here
```

### Database Configuration

Located in `src/database/database.config.ts`:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [...],
  synchronize: true,  // Set to false in production
  logging: false,
})
```

## Documentation

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Complete entity descriptions and relationships
- **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - All endpoints with examples and workflows
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, data flows, and deployment guide
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Setup instructions and troubleshooting

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

## Deployment

### Production Checklist

- [ ] Disable TypeORM `synchronize`
- [ ] Use explicit database migrations
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database credentials
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for frontend domain
- [ ] Set up automated backups
- [ ] Enable request logging
- [ ] Configure health check endpoint

### Hosting Options

- **Heroku** - Simple deployment with buildpack support
- **AWS** - EC2, ECS, or Elastic Beanstalk
- **DigitalOcean** - App Platform or Droplets
- **Railway** - Git-based deployment
- **Render** - Free tier available

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for deployment details.

## Roadmap

### Phase 1 (Current)
- ✅ Core services implementation
- ✅ Offline sync system
- ✅ Triage engine
- ⏳ JWT authentication
- ⏳ Role-based access control

### Phase 2
- SMS notifications for urgent referrals
- Cloud AI integration (Claude API)
- Data encryption at rest
- Advanced analytics dashboard
- Mobile app (React Native)

### Phase 3
- Voice-based triage support
- ML-based triage refinement
- Predictive analytics
- Regional deployment support
- Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All user inputs are validated with class-validator
- Database queries use parameterized statements (TypeORM)
- Environment variables for sensitive data
- Role-based access control per endpoint
- Cascading deletes to maintain referential integrity

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review error logs in sync service for offline sync failures

## License

UNLICENSED - Proprietary

## Acknowledgments

Built for healthcare workers in African primary healthcare centers. Designed to work reliably in offline scenarios with automatic data synchronization.

---

**Status**: Active Development | **Version**: 0.0.1
