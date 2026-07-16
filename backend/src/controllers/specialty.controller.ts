import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  SpecialtyService,
  CreateSpecialtyDto,
  UpdateSpecialtyDto,
} from '../services/specialty.service';
import { Specialty } from '../entities/specialty.entity';

@Controller('api/v1/specialties')
export class SpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSpecialty(@Body() dto: CreateSpecialtyDto): Promise<Specialty> {
    return this.specialtyService.createSpecialty(dto);
  }

  @Get(':id')
  async getSpecialty(@Param('id') id: string): Promise<Specialty> {
    return this.specialtyService.getSpecialty(id);
  }

  @Get('code/:code')
  async getSpecialtyByCode(@Param('code') code: string): Promise<Specialty> {
    return this.specialtyService.getSpecialtyByCode(code);
  }

  @Get()
  async getAllSpecialties(): Promise<Specialty[]> {
    return this.specialtyService.getAllSpecialties();
  }

  @Put(':id')
  async updateSpecialty(
    @Param('id') id: string,
    @Body() dto: UpdateSpecialtyDto,
  ): Promise<Specialty> {
    return this.specialtyService.updateSpecialty(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSpecialty(@Param('id') id: string): Promise<void> {
    return this.specialtyService.deleteSpecialty(id);
  }
}
