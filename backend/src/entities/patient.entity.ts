import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Facility } from './facility.entity';
import { Referral } from './referral.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('patients')
export class Patient extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  age: number;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  medical_history: string;

  @ManyToOne(() => Facility, (facility) => facility.patients, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Facility;

  @Column({ nullable: true })
  clinic_id: string;

  @OneToMany(() => Referral, (referral) => referral.patient)
  referrals: Referral[];
}
