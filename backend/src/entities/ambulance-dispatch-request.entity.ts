import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Referral } from './referral.entity';
import { Facility } from './facility.entity';
import { Patient } from './patient.entity';
import { User } from './user.entity';

export enum DispatchStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  ARRIVED = 'arrived',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('ambulance_dispatch_requests')
@Index(['referral_id'])
@Index(['status', 'created_at'])
@Index(['from_facility_id', 'created_at'])
export class AmbulanceDispatchRequest extends BaseEntity {
  @ManyToOne(() => Referral, (referral) => referral.ambulance_requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referral_id' })
  referral: Referral;

  @Column({ nullable: true })
  referral_id: string;

  @ManyToOne(() => Facility, (facility) => facility.dispatch_requests_sent, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'from_facility_id' })
  from_facility: Facility;

  @Column({ nullable: true })
  from_facility_id: string;

  @ManyToOne(() => Facility, (facility) => facility.dispatch_requests_received, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'to_facility_id' })
  to_facility: Facility;

  @Column({ nullable: true })
  to_facility_id: string;

  @ManyToOne(() => Patient, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ nullable: true })
  patient_id: string;

  @Column({
    type: 'enum',
    enum: 'low|medium|high|critical',
    nullable: true,
  })
  urgency_level: string;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assigned_dispatcher_id' })
  assigned_dispatcher: User;

  @Column({ nullable: true })
  assigned_dispatcher_id: string;

  @Column({
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.REQUESTED,
  })
  status: DispatchStatus;

  @Column({ nullable: true })
  eta_minutes: number;

  @Column({ nullable: true })
  current_latitude: number;

  @Column({ nullable: true })
  current_longitude: number;

  @Column({ nullable: true })
  pickup_time: Date;

  @Column({ nullable: true })
  delivery_time: Date;
}
