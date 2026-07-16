import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Facility } from './facility.entity';
import { Specialty } from './specialty.entity';

@Entity('facility_specialties')
export class FacilitySpecialty extends BaseEntity {
  @ManyToOne(() => Facility, (facility) => facility.facility_specialties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column()
  facility_id: string;

  @ManyToOne(() => Specialty, (specialty) => specialty.facility_specialties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;

  @Column()
  specialty_id: string;

  @Column({ nullable: true })
  available_doctors: number;

  @Column({ nullable: true })
  available_beds: number;
}
