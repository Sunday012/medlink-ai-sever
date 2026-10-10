import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Facility } from './facility.entity';

export enum UserRole {
  NURSE = 'nurse',
  HOSPITAL_ADMIN = 'hospital_admin',
  AMBULANCE_DISPATCHER = 'ambulance_dispatcher',
  SYSTEM_ADMIN = 'system_admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.NURSE,
  })
  role: UserRole;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  organization: string;

  @ManyToOne(() => Facility, (facility) => facility.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ nullable: true })
  facility_id: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_login_at: Date;
}
