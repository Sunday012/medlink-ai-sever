import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AmbulanceDispatchRequest,
  DispatchStatus,
} from '../entities/ambulance-dispatch-request.entity';
import { Referral } from '../entities/referral.entity';
import { Facility } from '../entities/facility.entity';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { UrgencyLevel } from '../entities/referral.entity';

export class CreateAmbulanceDispatchDto {
  referral_id?: string;
  patient_id: string;
  from_facility_id: string;
  to_facility_id: string;
  urgency_level: UrgencyLevel;
  eta_minutes?: number;
}

export class UpdateDispatchStatusDto {
  status: DispatchStatus;
  current_latitude?: number;
  current_longitude?: number;
  pickup_time?: Date;
  delivery_time?: Date;
}

export class AssignDispatcherDto {
  dispatcher_id: string;
  eta_minutes: number;
}

@Injectable()
export class AmbulanceDispatchService {
  constructor(
    @InjectRepository(AmbulanceDispatchRequest)
    private dispatchRepository: Repository<AmbulanceDispatchRequest>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createDispatchRequest(
    dto: CreateAmbulanceDispatchDto,
  ): Promise<AmbulanceDispatchRequest> {
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

    if (!fromFacility.ambulance_available && !toFacility.ambulance_available) {
      throw new BadRequestException('No ambulance available at either facility');
    }

    let referral: Referral | null = null;
    if (dto.referral_id) {
      referral = await this.referralRepository.findOne({
        where: { id: dto.referral_id },
      });

      if (!referral) {
        throw new NotFoundException('Referral not found');
      }
    }

    const dispatch = this.dispatchRepository.create({
      referral: referral || undefined,
      referral_id: referral?.id,
      patient,
      patient_id: patient.id,
      from_facility: fromFacility,
      from_facility_id: fromFacility.id,
      to_facility: toFacility,
      to_facility_id: toFacility.id,
      urgency_level: dto.urgency_level,
      status: DispatchStatus.REQUESTED,
      eta_minutes: dto.eta_minutes,
    });

    return this.dispatchRepository.save(dispatch);
  }

  async getDispatch(id: string): Promise<AmbulanceDispatchRequest> {
    const dispatch = await this.dispatchRepository.findOne({
      where: { id },
      relations: {
        referral: true,
        patient: true,
        from_facility: true,
        to_facility: true,
        assigned_dispatcher: true,
      },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch request with ID ${id} not found`);
    }

    return dispatch;
  }

  async getDispatchesByFacility(
    facilityId: string,
  ): Promise<AmbulanceDispatchRequest[]> {
    return this.dispatchRepository.find({
      where: [
        { from_facility_id: facilityId },
        { to_facility_id: facilityId },
      ],
      relations: {
        referral: true,
        patient: true,
        from_facility: true,
        to_facility: true,
        assigned_dispatcher: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getDispatchesByStatus(
    status: DispatchStatus,
  ): Promise<AmbulanceDispatchRequest[]> {
    return this.dispatchRepository.find({
      where: { status },
      relations: {
        referral: true,
        patient: true,
        from_facility: true,
        to_facility: true,
        assigned_dispatcher: true,
      },
      order: { created_at: 'ASC' },
    });
  }

  async assignDispatcher(
    dispatchId: string,
    dto: AssignDispatcherDto,
  ): Promise<AmbulanceDispatchRequest> {
    const dispatch = await this.getDispatch(dispatchId);

    if (dispatch.status !== DispatchStatus.REQUESTED) {
      throw new BadRequestException('Can only assign dispatcher to requested dispatches');
    }

    const dispatcher = await this.userRepository.findOne({
      where: { id: dto.dispatcher_id },
    });

    if (!dispatcher) {
      throw new NotFoundException('Dispatcher not found');
    }

    dispatch.assigned_dispatcher = dispatcher;
    dispatch.eta_minutes = dto.eta_minutes;
    dispatch.status = DispatchStatus.ACCEPTED;

    return this.dispatchRepository.save(dispatch);
  }

  async updateDispatchStatus(
    dispatchId: string,
    dto: UpdateDispatchStatusDto,
  ): Promise<AmbulanceDispatchRequest> {
    const dispatch = await this.getDispatch(dispatchId);

    if (!dispatch.assigned_dispatcher) {
      throw new BadRequestException('Dispatcher must be assigned before updating status');
    }

    dispatch.status = dto.status;

    if (dto.current_latitude !== undefined) {
      dispatch.current_latitude = dto.current_latitude;
    }

    if (dto.current_longitude !== undefined) {
      dispatch.current_longitude = dto.current_longitude;
    }

    if (dto.pickup_time) {
      dispatch.pickup_time = dto.pickup_time;
    }

    if (dto.delivery_time) {
      dispatch.delivery_time = dto.delivery_time;
    }

    return this.dispatchRepository.save(dispatch);
  }

  async getPendingDispatches(): Promise<AmbulanceDispatchRequest[]> {
    return this.dispatchRepository.find({
      where: [
        { status: DispatchStatus.REQUESTED },
        { status: DispatchStatus.ACCEPTED },
        { status: DispatchStatus.ARRIVED },
        { status: DispatchStatus.IN_TRANSIT },
      ],
      relations: {
        referral: true,
        patient: true,
        from_facility: true,
        to_facility: true,
        assigned_dispatcher: true,
      },
      order: { created_at: 'ASC' },
    });
  }

  async getDispatchesByUrgency(
    urgencyLevel: UrgencyLevel,
  ): Promise<AmbulanceDispatchRequest[]> {
    return this.dispatchRepository.find({
      where: { urgency_level: urgencyLevel },
      relations: {
        referral: true,
        patient: true,
        from_facility: true,
        to_facility: true,
        assigned_dispatcher: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async cancelDispatch(dispatchId: string): Promise<AmbulanceDispatchRequest> {
    const dispatch = await this.getDispatch(dispatchId);

    if (
      dispatch.status === DispatchStatus.DELIVERED ||
      dispatch.status === DispatchStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot cancel a delivered or already cancelled dispatch',
      );
    }

    dispatch.status = DispatchStatus.CANCELLED;
    return this.dispatchRepository.save(dispatch);
  }
}
