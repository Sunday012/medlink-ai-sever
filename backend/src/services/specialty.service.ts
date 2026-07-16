import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialty } from '../entities/specialty.entity';

export class CreateSpecialtyDto {
  name: string;
  code: string;
  description?: string;
}

export class UpdateSpecialtyDto {
  name?: string;
  code?: string;
  description?: string;
}

@Injectable()
export class SpecialtyService {
  constructor(
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
  ) {}

  async createSpecialty(dto: CreateSpecialtyDto): Promise<Specialty> {
    const existing = await this.specialtyRepository.findOne({
      where: [{ name: dto.name }, { code: dto.code }],
    });

    if (existing) {
      throw new ConflictException('Specialty with this name or code already exists');
    }

    const specialty = this.specialtyRepository.create(dto);
    return this.specialtyRepository.save(specialty);
  }

  async getSpecialty(id: string): Promise<Specialty> {
    const specialty = await this.specialtyRepository.findOne({
      where: { id },
    });

    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }

    return specialty;
  }

  async getSpecialtyByCode(code: string): Promise<Specialty> {
    const specialty = await this.specialtyRepository.findOne({
      where: { code },
    });

    if (!specialty) {
      throw new NotFoundException(`Specialty with code ${code} not found`);
    }

    return specialty;
  }

  async getAllSpecialties(): Promise<Specialty[]> {
    return this.specialtyRepository.find({
      order: { name: 'ASC' },
    });
  }

  async updateSpecialty(
    id: string,
    dto: UpdateSpecialtyDto,
  ): Promise<Specialty> {
    const specialty = await this.getSpecialty(id);

    if (dto.name) {
      const existing = await this.specialtyRepository.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Specialty name already exists');
      }
    }

    if (dto.code) {
      const existing = await this.specialtyRepository.findOne({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Specialty code already exists');
      }
    }

    Object.assign(specialty, dto);
    return this.specialtyRepository.save(specialty);
  }

  async deleteSpecialty(id: string): Promise<void> {
    const specialty = await this.getSpecialty(id);
    await this.specialtyRepository.remove(specialty);
  }
}
