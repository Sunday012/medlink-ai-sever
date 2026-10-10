import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility, FacilityType } from '../entities/facility.entity';
import { Specialty } from '../entities/specialty.entity';
import { TriageRule } from '../entities/triage-rule.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Facility) private readonly facilities: Repository<Facility>,
    @InjectRepository(Specialty) private readonly specialties: Repository<Specialty>,
    @InjectRepository(TriageRule) private readonly rules: Repository<TriageRule>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO_DATA === 'false') return;

    if ((await this.facilities.count()) === 0) {
      await this.facilities.save([
        this.facilities.create({ name: 'Sabon Gari Primary Clinic', address: 'Sabon Gari, Kano', type: FacilityType.PRIMARY_CLINIC, bed_capacity: 28, current_available_beds: 8, ambulance_available: false }),
        this.facilities.create({ name: 'Kano General Hospital', address: 'Gida Quarters, Kano', type: FacilityType.TERTIARY_HOSPITAL, bed_capacity: 500, current_available_beds: 42, ambulance_available: true }),
        this.facilities.create({ name: 'Northline Ambulance Station', address: 'Airport Road, Kano', type: FacilityType.AMBULANCE_STATION, bed_capacity: 0, current_available_beds: 0, ambulance_available: true }),
      ]);
    }

    if ((await this.specialties.count()) === 0) {
      await this.specialties.save([
        this.specialties.create({ name: 'General Medicine', code: 'GEN' }),
        this.specialties.create({ name: 'Cardiology', code: 'CARD' }),
        this.specialties.create({ name: 'Obstetrics', code: 'OBGYN' }),
        this.specialties.create({ name: 'Emergency Medicine', code: 'EMERG' }),
      ]);
    }

    if ((await this.rules.count({ where: { active: true } })) === 0) {
      await this.rules.save(this.rules.create({
        version: 1,
        active: true,
        published_at: new Date(),
        description: 'MedLink development triage baseline. Must be clinically reviewed before production.',
        rule_set: {
          urgency_tiers: {
            critical: { symptoms: ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding'], test_results: { oxygen_level: { max: 94 } }, actions: { specialist: 'cardiology' } },
            high: { symptoms: ['severe abdominal pain', 'seizure', 'high fever'], actions: { specialist: 'emergency medicine' } },
            medium: { symptoms: ['fever', 'dehydration', 'persistent vomiting'], actions: { specialist: 'general medicine' } },
            low: { symptoms: [], actions: { specialist: 'general medicine' } },
          },
        },
      }));
    }
    this.logger.log('Development seed data is ready');
  }
}
