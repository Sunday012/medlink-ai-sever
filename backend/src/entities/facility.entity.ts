import { Entity, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Patient } from './patient.entity';
import { Referral } from './referral.entity';
import { AmbulanceDispatchRequest } from './ambulance-dispatch-request.entity';
import { FacilitySpecialty } from './facility-specialty.entity';

export enum FacilityType {
  PRIMARY_CLINIC = 'primary_clinic',
  SECONDARY_HOSPITAL = 'secondary_hospital',
  TERTIARY_HOSPITAL = 'tertiary_hospital',
  AMBULANCE_STATION = 'ambulance_station',
}

@Entity('facilities')
export class Facility extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({
    type: 'enum',
    enum: FacilityType,
  })
  type: FacilityType;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column({ nullable: true })
  bed_capacity: number;

  @Column({ nullable: true })
  current_available_beds: number;

  @Column({ default: false })
  ambulance_available: boolean;

  @Column({ nullable: true })
  last_sync_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => User, (user) => user.facility)
  users: User[];

  @OneToMany(() => Patient, (patient) => patient.clinic)
  patients: Patient[];

  @OneToMany(() => Referral, (referral) => referral.from_facility)
  referrals_sent: Referral[];

  @OneToMany(() => Referral, (referral) => referral.to_facility)
  referrals_received: Referral[];

  @OneToMany(() => AmbulanceDispatchRequest, (dispatch) => dispatch.from_facility)
  dispatch_requests_sent: AmbulanceDispatchRequest[];

  @OneToMany(() => AmbulanceDispatchRequest, (dispatch) => dispatch.to_facility)
  dispatch_requests_received: AmbulanceDispatchRequest[];

  @OneToMany(() => FacilitySpecialty, (fs) => fs.facility)
  facility_specialties: FacilitySpecialty[];
}
