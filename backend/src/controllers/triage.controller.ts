import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  TriageService,
  CreateTriageRuleDto,
  TriageRecommendationDto,
  TriageResult,
} from '../services/triage.service';
import { TriageRule } from '../entities/triage-rule.entity';

@Controller('api/v1/triage')
export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  @Post('evaluate')
  async performTriage(
    @Body() dto: TriageRecommendationDto,
    @Query('ruleVersion') ruleVersion?: number,
  ): Promise<TriageResult> {
    if (ruleVersion) {
      return this.triageService.performTriageWithRuleVersion(
        ruleVersion,
        dto,
      );
    }
    return this.triageService.performTriage(dto);
  }

  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  async createTriageRule(
    @Body() dto: CreateTriageRuleDto,
    @Query('createdBy') createdBy: string,
  ): Promise<TriageRule> {
    return this.triageService.createTriageRule(createdBy, dto);
  }

  @Get('rules/active')
  async getActiveRule(): Promise<TriageRule> {
    return this.triageService.getActiveRule();
  }

  @Get('rules/version/:version')
  async getRuleByVersion(@Param('version') version: number): Promise<TriageRule> {
    return this.triageService.getRuleByVersion(version);
  }

  @Get('rules')
  async getAllRules(): Promise<TriageRule[]> {
    return this.triageService.getAllRules();
  }

  @Post('rules/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishTriageRule(@Param('id') id: string): Promise<TriageRule> {
    return this.triageService.publishTriageRule(id);
  }
}
