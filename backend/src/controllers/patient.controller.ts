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
import { PatientService, CreatePatientDto, UpdatePatientDto } from '../services/patient.service';
import { Patient } from '../entities/patient.entity';

@Controller('api/v1/patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPatient(@Body() dto: CreatePatientDto): Promise<Patient> {
    return this.patientService.createPatient(dto);
  }

  @Get(':id')
  async getPatient(@Param('id') id: string): Promise<Patient> {
    return this.patientService.getPatient(id);
  }

  @Get('phone/:phone')
  async getPatientByPhone(@Param('phone') phone: string): Promise<Patient | null> {
    return this.patientService.getPatientByPhone(phone);
  }

  @Get()
  async getPatientsByClinic(@Query('clinicId') clinicId: string): Promise<Patient[]> {
    if (!clinicId) {
      return [];
    }
    return this.patientService.getPatientsByClinic(clinicId);
  }

  @Put(':id')
  async updatePatient(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<Patient> {
    return this.patientService.updatePatient(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(@Param('id') id: string): Promise<void> {
    return this.patientService.deletePatient(id);
  }
}
