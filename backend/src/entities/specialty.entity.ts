import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FacilitySpecialty } from './facility-specialty.entity';
import { Referral } from './referral.entity';

@Entity('specialties')
export class Specialty extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true, length: 10 })
  code: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => FacilitySpecialty, (fs) => fs.specialty)
  facility_specialties: FacilitySpecialty[];

  @OneToMany(() => Referral, (referral) => referral.recommended_specialty)
  referrals: Referral[];
}
