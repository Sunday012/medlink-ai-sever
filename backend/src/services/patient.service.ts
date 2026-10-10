import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient, Gender } from '../entities/patient.entity';
import { Facility } from '../entities/facility.entity';

export class CreatePatientDto {
  name: string;
  age?: number;
  gender?: Gender;
  phone?: string;
  medical_history?: string;
  clinic_id: string;
}

export class UpdatePatientDto {
  name?: string;
  age?: number;
  gender?: Gender;
  phone?: string;
  medical_history?: string;
}

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
  ) {}

  async createPatient(dto: CreatePatientDto): Promise<Patient> {
    const clinic = await this.facilityRepository.findOne({
      where: { id: dto.clinic_id },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const patient = this.patientRepository.create({
      ...dto,
      clinic,
      clinic_id: clinic.id,
    });

    return this.patientRepository.save(patient);
  }

  async getPatient(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: { clinic: true, referrals: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async getPatientByPhone(phone: string): Promise<Patient | null> {
    return this.patientRepository.findOne({
      where: { phone },
      relations: { clinic: true, referrals: true },
    });
  }

  async getPatientsByClinic(clinicId: string): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { clinic_id: clinicId },
      relations: { clinic: true, referrals: true },
      order: { created_at: 'DESC' },
    });
  }

  async updatePatient(
    id: string,
    dto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.getPatient(id);

    Object.assign(patient, dto);

    return this.patientRepository.save(patient);
  }

  async deletePatient(id: string): Promise<void> {
    const patient = await this.getPatient(id);
    await this.patientRepository.remove(patient);
  }
}
