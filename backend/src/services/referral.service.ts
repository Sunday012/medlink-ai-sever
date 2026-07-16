import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Referral,
  ReferralStatus,
  UrgencyLevel,
} from '../entities/referral.entity';
import { Patient } from '../entities/patient.entity';
import { Facility } from '../entities/facility.entity';
import { Specialty } from '../entities/specialty.entity';
import * as QRCode from 'qrcode';

export class CreateReferralDto {
  patient_id: string;
  from_facility_id: string;
  to_facility_id: string;
  recommended_specialty_id?: string;
  urgency_level: UrgencyLevel;
  symptoms?: string[];
  test_results?: Record<string, any>;
  offline_recommendation?: string;
  referral_note?: string;
}

export class UpdateReferralDto {
  to_facility_id?: string;
  recommended_specialty_id?: string;
  urgency_level?: UrgencyLevel;
  symptoms?: string[];
  test_results?: Record<string, any>;
  cloud_recommendation?: string;
  referral_note?: string;
}

export class UpdateReferralStatusDto {
  status: ReferralStatus;
}

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
  ) {}

  async createReferral(dto: CreateReferralDto): Promise<Referral> {
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patient_id },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const fromFacility = await this.facilityRepository.findOne({
      where: { id: dto.from_facility_id },
    });

    if (!fromFacility) {
      throw new NotFoundException('Sending facility not found');
    }

    const toFacility = await this.facilityRepository.findOne({
      where: { id: dto.to_facility_id },
    });

    if (!toFacility) {
      throw new NotFoundException('Receiving facility not found');
    }

    let specialty: Specialty | undefined = undefined;
    if (dto.recommended_specialty_id) {
      specialty = await this.specialtyRepository.findOne({
        where: { id: dto.recommended_specialty_id },
      }) || undefined;

      if (!specialty) {
        throw new NotFoundException('Specialty not found');
      }
    }

    const referral = this.referralRepository.create({
      patient,
      from_facility: fromFacility,
      to_facility: toFacility,
      recommended_specialty: specialty,
      urgency_level: dto.urgency_level,
      symptoms: dto.symptoms,
      test_results: dto.test_results,
      offline_recommendation: dto.offline_recommendation,
      referral_note: dto.referral_note,
      status: ReferralStatus.CREATED,
    });

    const savedReferral = await this.referralRepository.save(referral);
    savedReferral.qr_code = await this.generateQRCode(savedReferral.id);
    return this.referralRepository.save(savedReferral);
  }

  async getReferral(id: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { id },
      relations: {
        patient: true,
        from_facility: true,
        to_facility: true,
        recommended_specialty: true,
        ambulance_requests: true,
      },
    });

    if (!referral) {
      throw new NotFoundException(`Referral with ID ${id} not found`);
    }

    return referral;
  }

  async getReferralsByPatient(patientId: string): Promise<Referral[]> {
    return this.referralRepository.find({
      where: { patient_id: patientId },
      relations: {
        from_facility: true,
        to_facility: true,
        recommended_specialty: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getReferralsByFacility(facilityId: string): Promise<Referral[]> {
    return this.referralRepository.find({
      where: [
        { from_facility_id: facilityId },
        { to_facility_id: facilityId },
      ],
      relations: {
        patient: true,
        from_facility: true,
        to_facility: true,
        recommended_specialty: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getReferralsByStatus(status: ReferralStatus): Promise<Referral[]> {
    return this.referralRepository.find({
      where: { status },
      relations: {
        patient: true,
        from_facility: true,
        to_facility: true,
        recommended_specialty: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getReferralsByUrgency(urgency: UrgencyLevel): Promise<Referral[]> {
    return this.referralRepository.find({
      where: { urgency_level: urgency },
      relations: {
        patient: true,
        from_facility: true,
        to_facility: true,
        recommended_specialty: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async updateReferral(
    id: string,
    dto: UpdateReferralDto,
  ): Promise<Referral> {
    const referral = await this.getReferral(id);

    if (dto.to_facility_id) {
      const facility = await this.facilityRepository.findOne({
        where: { id: dto.to_facility_id },
      });
      if (!facility) {
        throw new NotFoundException('Receiving facility not found');
      }
      referral.to_facility = facility;
    }

    if (dto.recommended_specialty_id) {
      const specialty = await this.specialtyRepository.findOne({
        where: { id: dto.recommended_specialty_id },
      });
      if (!specialty) {
        throw new NotFoundException('Specialty not found');
      }
      referral.recommended_specialty = specialty;
    }

    Object.assign(referral, {
      urgency_level: dto.urgency_level ?? referral.urgency_level,
      symptoms: dto.symptoms ?? referral.symptoms,
      test_results: dto.test_results ?? referral.test_results,
      cloud_recommendation:
        dto.cloud_recommendation ?? referral.cloud_recommendation,
      referral_note: dto.referral_note ?? referral.referral_note,
    });

    return this.referralRepository.save(referral);
  }

  async updateReferralStatus(
    id: string,
    dto: UpdateReferralStatusDto,
  ): Promise<Referral> {
    const referral = await this.getReferral(id);
    referral.status = dto.status;

    if (dto.status === ReferralStatus.RECEIVED) {
      referral.receiving_facility_check_in_time = new Date();
    }

    if (
      dto.status === ReferralStatus.COMPLETED ||
      dto.status === ReferralStatus.DECLINED
    ) {
      referral.resolved_at = new Date();
    }

    return this.referralRepository.save(referral);
  }

  async verifyReferralQR(
    referralId: string,
    facilityId: string,
  ): Promise<Referral> {
    const referral = await this.getReferral(referralId);

    if (referral.to_facility_id !== facilityId) {
      throw new BadRequestException(
        'This referral is not for your facility',
      );
    }

    if (referral.status !== ReferralStatus.SENT) {
      throw new BadRequestException(
        'Referral is not in sent status',
      );
    }

    return this.updateReferralStatus(referralId, {
      status: ReferralStatus.RECEIVED,
    });
  }

  async addCloudRecommendation(
    id: string,
    recommendation: string,
  ): Promise<Referral> {
    const referral = await this.getReferral(id);
    referral.cloud_recommendation = recommendation;
    return this.referralRepository.save(referral);
  }

  private async generateQRCode(referralId: string): Promise<string> {
    try {
      const qrData = JSON.stringify({
        referral_id: referralId,
        timestamp: new Date().toISOString(),
      });

      return await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async getRecentReferrals(limit: number = 10): Promise<Referral[]> {
    return this.referralRepository.find({
      relations: {
        patient: true,
        from_facility: true,
        to_facility: true,
        recommended_specialty: true,
      },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
