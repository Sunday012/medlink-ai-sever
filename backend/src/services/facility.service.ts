import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility, FacilityType } from '../entities/facility.entity';
import { Specialty } from '../entities/specialty.entity';
import { FacilitySpecialty } from '../entities/facility-specialty.entity';

export class CreateFacilityDto {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type: FacilityType;
  phone?: string;
  contact_person?: string;
  bed_capacity?: number;
  ambulance_available?: boolean;
}

export class UpdateFacilityDto {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type?: FacilityType;
  phone?: string;
  contact_person?: string;
  bed_capacity?: number;
  current_available_beds?: number;
  ambulance_available?: boolean;
}

export class AddSpecialtyToFacilityDto {
  specialty_id: string;
  available_doctors?: number;
  available_beds?: number;
}

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
    @InjectRepository(FacilitySpecialty)
    private facilitySpecialtyRepository: Repository<FacilitySpecialty>,
  ) {}

  async createFacility(dto: CreateFacilityDto): Promise<Facility> {
    const facility = this.facilityRepository.create(dto);
    return this.facilityRepository.save(facility);
  }

  async getFacility(id: string): Promise<Facility> {
    const facility = await this.facilityRepository.findOne({
      where: { id, is_active: true },
      relations: { facility_specialties: { specialty: true } },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    return facility;
  }

  async getFacilitiesByType(type: FacilityType): Promise<Facility[]> {
    return this.facilityRepository.find({
      where: { type, is_active: true },
      relations: { facility_specialties: { specialty: true } },
      order: { created_at: 'DESC' },
    });
  }

  async getAllFacilities(): Promise<Facility[]> {
    return this.facilityRepository.find({
      where: { is_active: true },
      relations: { facility_specialties: { specialty: true } },
      order: { name: 'ASC' },
    });
  }

  async getNearestFacility(
    latitude: number,
    longitude: number,
    type?: FacilityType,
    specialtyId?: string,
  ): Promise<Facility | null> {
    let query = this.facilityRepository
      .createQueryBuilder('facility')
      .where('facility.is_active = :active', { active: true })
      .andWhere('facility.latitude IS NOT NULL')
      .andWhere('facility.longitude IS NOT NULL')
      .orderBy(
        `SQRT(POWER(facility.latitude - :lat, 2) + POWER(facility.longitude - :lng, 2))`,
        'ASC',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .leftJoinAndSelect(
        'facility.facility_specialties',
        'facility_specialty',
      )
      .leftJoinAndSelect('facility_specialty.specialty', 'specialty')
      .take(1);

    if (type) {
      query = query.andWhere('facility.type = :type', { type });
    }

    if (specialtyId) {
      query = query.andWhere('specialty.id = :specialtyId', {
        specialtyId,
      });
    }

    return query.getOne();
  }

  async updateFacility(
    id: string,
    dto: UpdateFacilityDto,
  ): Promise<Facility> {
    const facility = await this.getFacility(id);

    Object.assign(facility, dto);

    return this.facilityRepository.save(facility);
  }

  async updateLastSync(id: string): Promise<void> {
    await this.facilityRepository.update(id, {
      last_sync_at: new Date(),
    });
  }

  async addSpecialtyToFacility(
    facilityId: string,
    dto: AddSpecialtyToFacilityDto,
  ): Promise<FacilitySpecialty> {
    const facility = await this.getFacility(facilityId);
    const specialty = await this.specialtyRepository.findOne({
      where: { id: dto.specialty_id },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    const existing = await this.facilitySpecialtyRepository.findOne({
      where: {
        facility_id: facilityId,
        specialty_id: dto.specialty_id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Facility already has this specialty',
      );
    }

    const facilitySpecialty = this.facilitySpecialtyRepository.create({
      facility,
      facility_id: facility.id,
      specialty,
      specialty_id: specialty.id,
      available_doctors: dto.available_doctors,
      available_beds: dto.available_beds,
    });

    return this.facilitySpecialtyRepository.save(facilitySpecialty);
  }

  async removeSpecialtyFromFacility(
    facilityId: string,
    specialtyId: string,
  ): Promise<void> {
    await this.facilitySpecialtyRepository.delete({
      facility_id: facilityId,
      specialty_id: specialtyId,
    });
  }

  async deactivateFacility(id: string): Promise<Facility> {
    const facility = await this.getFacility(id);
    facility.is_active = false;
    return this.facilityRepository.save(facility);
  }
}
