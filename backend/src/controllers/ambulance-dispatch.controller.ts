import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  AmbulanceDispatchService,
  CreateAmbulanceDispatchDto,
  UpdateDispatchStatusDto,
  AssignDispatcherDto,
} from '../services/ambulance-dispatch.service';
import { AmbulanceDispatchRequest, DispatchStatus } from '../entities/ambulance-dispatch-request.entity';
import { UrgencyLevel } from '../entities/referral.entity';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('api/v1/ambulance')
export class AmbulanceDispatchController {
  constructor(
    private readonly ambulanceDispatchService: AmbulanceDispatchService,
  ) {}

  @Post('dispatch')
  @HttpCode(HttpStatus.CREATED)
  async createDispatchRequest(
    @Body() dto: CreateAmbulanceDispatchDto,
  ): Promise<AmbulanceDispatchRequest> {
    return this.ambulanceDispatchService.createDispatchRequest(dto);
  }

  @Get('dispatch/:id')
  async getDispatch(@Param('id') id: string): Promise<AmbulanceDispatchRequest> {
    return this.ambulanceDispatchService.getDispatch(id);
  }

  @Get('dispatch')
  async getDispatches(
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: DispatchStatus,
    @Query('urgency') urgency?: UrgencyLevel,
    @Query('pending') pending?: boolean,
  ): Promise<AmbulanceDispatchRequest[]> {
    if (facilityId) {
      return this.ambulanceDispatchService.getDispatchesByFacility(facilityId);
    }

    if (status) {
      return this.ambulanceDispatchService.getDispatchesByStatus(status);
    }

    if (urgency) {
      return this.ambulanceDispatchService.getDispatchesByUrgency(urgency);
    }

    if (pending === true) {
      return this.ambulanceDispatchService.getPendingDispatches();
    }

    return [];
  }

  @Post('dispatch/:id/assign')
  @Roles(UserRole.AMBULANCE_DISPATCHER, UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  async assignDispatcher(
    @Param('id') dispatchId: string,
    @Body() dto: AssignDispatcherDto,
  ): Promise<AmbulanceDispatchRequest> {
    return this.ambulanceDispatchService.assignDispatcher(dispatchId, dto);
  }

  @Put('dispatch/:id/status')
  @Roles(UserRole.AMBULANCE_DISPATCHER, UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN)
  async updateDispatchStatus(
    @Param('id') dispatchId: string,
    @Body() dto: UpdateDispatchStatusDto,
  ): Promise<AmbulanceDispatchRequest> {
    return this.ambulanceDispatchService.updateDispatchStatus(dispatchId, dto);
  }

  @Post('dispatch/:id/cancel')
  @Roles(UserRole.AMBULANCE_DISPATCHER, UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelDispatch(
    @Param('id') dispatchId: string,
  ): Promise<AmbulanceDispatchRequest> {
    return this.ambulanceDispatchService.cancelDispatch(dispatchId);
  }
}
