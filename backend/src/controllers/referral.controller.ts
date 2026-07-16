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
  ReferralService,
  CreateReferralDto,
  UpdateReferralDto,
  UpdateReferralStatusDto,
} from '../services/referral.service';
import { Referral, ReferralStatus, UrgencyLevel } from '../entities/referral.entity';

@Controller('api/v1/referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReferral(@Body() dto: CreateReferralDto): Promise<Referral> {
    return this.referralService.createReferral(dto);
  }

  @Get(':id')
  async getReferral(@Param('id') id: string): Promise<Referral> {
    return this.referralService.getReferral(id);
  }

  @Get()
  async getReferrals(
    @Query('patientId') patientId?: string,
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: ReferralStatus,
    @Query('urgency') urgency?: UrgencyLevel,
    @Query('limit') limit?: number,
  ): Promise<Referral[]> {
    const limitValue = limit || 10;

    if (patientId) {
      return this.referralService.getReferralsByPatient(patientId);
    }

    if (facilityId) {
      return this.referralService.getReferralsByFacility(facilityId);
    }

    if (status) {
      return this.referralService.getReferralsByStatus(status);
    }

    if (urgency) {
      return this.referralService.getReferralsByUrgency(urgency);
    }

    return this.referralService.getRecentReferrals(limitValue);
  }

  @Put(':id')
  async updateReferral(
    @Param('id') id: string,
    @Body() dto: UpdateReferralDto,
  ): Promise<Referral> {
    return this.referralService.updateReferral(id, dto);
  }

  @Put(':id/status')
  async updateReferralStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReferralStatusDto,
  ): Promise<Referral> {
    return this.referralService.updateReferralStatus(id, dto);
  }

  @Post(':id/verify-qr')
  async verifyReferralQR(
    @Param('id') referralId: string,
    @Query('facilityId') facilityId: string,
  ): Promise<Referral> {
    return this.referralService.verifyReferralQR(referralId, facilityId);
  }

  @Post(':id/cloud-recommendation')
  @HttpCode(HttpStatus.OK)
  async addCloudRecommendation(
    @Param('id') id: string,
    @Body() dto: { recommendation: string },
  ): Promise<Referral> {
    return this.referralService.addCloudRecommendation(id, dto.recommendation);
  }

  @Get(':id/qr')
  async getReferralQR(@Param('id') id: string): Promise<{ qr_code: string }> {
    const referral = await this.referralService.getReferral(id);
    return {
      qr_code: referral.qr_code,
    };
  }
}
