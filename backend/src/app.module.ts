import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { RolesGuard } from './auth/roles.guard';
import {
  AmbulanceDispatchController,
  FacilityController,
  PatientController,
  ReferralController,
  SpecialtyController,
  SyncController,
  TriageController,
} from './controllers';
import { SeedService } from './database/seed.service';
import { AmbulanceDispatchRequest } from './entities/ambulance-dispatch-request.entity';
import { FacilitySpecialty } from './entities/facility-specialty.entity';
import { Facility } from './entities/facility.entity';
import { OfflineQueuedAction } from './entities/offline-queued-action.entity';
import { Patient } from './entities/patient.entity';
import { Referral } from './entities/referral.entity';
import { Specialty } from './entities/specialty.entity';
import { TriageRule } from './entities/triage-rule.entity';
import { User } from './entities/user.entity';
import { HealthController } from './health.controller';
import {
  AmbulanceDispatchService,
  FacilityService,
  PatientService,
  ReferralService,
  SpecialtyService,
  SyncService,
  TriageService,
} from './services';

const entities = [
  User,
  Facility,
  FacilitySpecialty,
  Specialty,
  Patient,
  Referral,
  TriageRule,
  AmbulanceDispatchRequest,
  OfflineQueuedAction,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'medlink_ai',
      entities,
      synchronize: process.env.DB_SYNCHRONIZE !== 'false' && process.env.NODE_ENV !== 'production',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    AuthController,
    HealthController,
    PatientController,
    FacilityController,
    SpecialtyController,
    ReferralController,
    TriageController,
    SyncController,
    AmbulanceDispatchController,
  ],
  providers: [
    AuthService,
    PatientService,
    FacilityService,
    SpecialtyService,
    ReferralService,
    TriageService,
    SyncService,
    AmbulanceDispatchService,
    SeedService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
