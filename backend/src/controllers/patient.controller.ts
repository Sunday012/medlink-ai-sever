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
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

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
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(@Param('id') id: string): Promise<void> {
    return this.patientService.deletePatient(id);
  }
}
