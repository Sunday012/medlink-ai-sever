import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  FacilityService,
  CreateFacilityDto,
  UpdateFacilityDto,
  AddSpecialtyToFacilityDto,
} from '../services/facility.service';
import { Facility, FacilityType } from '../entities/facility.entity';
import { FacilitySpecialty } from '../entities/facility-specialty.entity';

@Controller('api/v1/facilities')
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFacility(@Body() dto: CreateFacilityDto): Promise<Facility> {
    return this.facilityService.createFacility(dto);
  }

  @Get(':id')
  async getFacility(@Param('id') id: string): Promise<Facility> {
    return this.facilityService.getFacility(id);
  }

  @Get()
  async getAllFacilities(
    @Query('type') type?: FacilityType,
  ): Promise<Facility[]> {
    if (type) {
      return this.facilityService.getFacilitiesByType(type);
    }
    return this.facilityService.getAllFacilities();
  }

  @Get('nearest/location')
  async getNearestFacility(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('type') type?: FacilityType,
    @Query('specialtyId') specialtyId?: string,
  ): Promise<Facility | null> {
    return this.facilityService.getNearestFacility(
      +latitude,
      +longitude,
      type,
      specialtyId,
    );
  }

  @Put(':id')
  async updateFacility(
    @Param('id') id: string,
    @Body() dto: UpdateFacilityDto,
  ): Promise<Facility> {
    return this.facilityService.updateFacility(id, dto);
  }

  @Post(':id/specialties')
  @HttpCode(HttpStatus.CREATED)
  async addSpecialtyToFacility(
    @Param('id') facilityId: string,
    @Body() dto: AddSpecialtyToFacilityDto,
  ): Promise<FacilitySpecialty> {
    return this.facilityService.addSpecialtyToFacility(facilityId, dto);
  }

  @Delete(':id/specialties/:specialtyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSpecialtyFromFacility(
    @Param('id') facilityId: string,
    @Param('specialtyId') specialtyId: string,
  ): Promise<void> {
    return this.facilityService.removeSpecialtyFromFacility(
      facilityId,
      specialtyId,
    );
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async updateLastSync(@Param('id') facilityId: string): Promise<void> {
    return this.facilityService.updateLastSync(facilityId);
  }

  @Put(':id/deactivate')
  async deactivateFacility(@Param('id') id: string): Promise<Facility> {
    return this.facilityService.deactivateFacility(id);
  }
}
