import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Patient } from './patient.entity';
import { Facility } from './facility.entity';
import { Specialty } from './specialty.entity';
import { AmbulanceDispatchRequest } from './ambulance-dispatch-request.entity';

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ReferralStatus {
  CREATED = 'created',
  SENT = 'sent',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  DECLINED = 'declined',
}

@Entity('referrals')
@Index(['patient_id', 'created_at'])
@Index(['from_facility_id', 'created_at'])
@Index(['to_facility_id', 'created_at'])
@Index(['status'])
export class Referral extends BaseEntity {
  @ManyToOne(() => Patient, (patient) => patient.referrals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column()
  patient_id: string;

  @ManyToOne(() => Facility, (facility) => facility.referrals_sent, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'from_facility_id' })
  from_facility: Facility;

  @Column({ nullable: true })
  from_facility_id: string;

  @ManyToOne(() => Facility, (facility) => facility.referrals_received, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'to_facility_id' })
  to_facility: Facility;

  @Column({ nullable: true })
  to_facility_id: string;

  @ManyToOne(() => Specialty, (specialty) => specialty.referrals, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'recommended_specialty_id' })
  recommended_specialty: Specialty;

  @Column({ nullable: true })
  recommended_specialty_id: string;

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
  })
  urgency_level: UrgencyLevel;

  @Column({ type: 'simple-array', nullable: true })
  symptoms: string[];

  @Column({ type: 'jsonb', nullable: true })
  test_results: Record<string, any>;

  @Column({ nullable: true })
  offline_recommendation: string;

  @Column({ nullable: true })
  cloud_recommendation: string;

  @Column({ nullable: true })
  referral_note: string;

  @Column({ nullable: true })
  qr_code: string;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.CREATED,
  })
  status: ReferralStatus;

  @Column({ nullable: true })
  receiving_facility_check_in_time: Date;

  @Column({ nullable: true })
  resolved_at: Date;

  @OneToMany(() => AmbulanceDispatchRequest, (dispatch) => dispatch.referral)
  ambulance_requests: AmbulanceDispatchRequest[];
}
