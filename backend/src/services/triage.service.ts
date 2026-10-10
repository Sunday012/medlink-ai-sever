import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TriageRule } from '../entities/triage-rule.entity';
import { User } from '../entities/user.entity';
import { UrgencyLevel } from '../entities/referral.entity';
import { FacilityType } from '../entities/facility.entity';

export class CreateTriageRuleDto {
  version: number;
  rule_set: Record<string, any>;
  description?: string;
}

export class TriageRecommendationDto {
  symptoms: string[];
  test_results?: Record<string, any>;
}

export interface TriageResult {
  urgency_level: UrgencyLevel;
  recommended_specialty?: string;
  facility_type: FacilityType;
  reasoning: string;
}

@Injectable()
export class TriageService {
  constructor(
    @InjectRepository(TriageRule)
    private triageRuleRepository: Repository<TriageRule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createTriageRule(
    createdBy: string,
    dto: CreateTriageRuleDto,
  ): Promise<TriageRule> {
    const user = await this.userRepository.findOne({
      where: { id: createdBy },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rule = this.triageRuleRepository.create({
      version: dto.version,
      rule_set: dto.rule_set,
      description: dto.description,
      created_by_user: user,
      active: false,
    });

    return this.triageRuleRepository.save(rule);
  }

  async publishTriageRule(id: string): Promise<TriageRule> {
    const rule = await this.triageRuleRepository.findOne({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Triage rule not found');
    }

    // Deactivate all previous rules
    await this.triageRuleRepository.update({ active: true }, { active: false });

    rule.active = true;
    rule.published_at = new Date();

    return this.triageRuleRepository.save(rule);
  }

  async getActiveRule(): Promise<TriageRule> {
    const rule = await this.triageRuleRepository.findOne({
      where: { active: true },
      relations: { created_by_user: true },
      order: { published_at: 'DESC' },
    });

    if (!rule) {
      throw new NotFoundException('No active triage rule found');
    }

    return rule;
  }

  async getAllRules(): Promise<TriageRule[]> {
    return this.triageRuleRepository.find({
      relations: { created_by_user: true },
      order: { version: 'DESC' },
    });
  }

  async getRuleByVersion(version: number): Promise<TriageRule> {
    const rule = await this.triageRuleRepository.findOne({
      where: { version },
      relations: { created_by_user: true },
    });

    if (!rule) {
      throw new NotFoundException(`Triage rule version ${version} not found`);
    }

    return rule;
  }

  async performTriage(dto: TriageRecommendationDto): Promise<TriageResult> {
    const activeRule = await this.getActiveRule();
    return this.evaluateRules(activeRule.rule_set, dto);
  }

  async performTriageWithRuleVersion(
    version: number,
    dto: TriageRecommendationDto,
  ): Promise<TriageResult> {
    const rule = await this.getRuleByVersion(version);
    return this.evaluateRules(rule.rule_set, dto);
  }

  private evaluateRules(
    ruleSet: Record<string, any>,
    dto: TriageRecommendationDto,
  ): TriageResult {
    const symptoms = new Set(dto.symptoms.map((s) => s.toLowerCase()));
    const testResults = dto.test_results || {};

    if (!ruleSet.urgency_tiers) {
      throw new BadRequestException('Invalid rule set format');
    }

    let matchedUrgency: UrgencyLevel | null = null;
    let matchedTier: any = null;

    for (const [urgencyKey, tier] of Object.entries(
      ruleSet.urgency_tiers,
    )) {
      const tierData = tier as any;

      if (this.matchesTier(symptoms, testResults, tierData)) {
        matchedUrgency = this.stringToUrgencyLevel(urgencyKey);
        matchedTier = tierData;
        break;
      }
    }

    if (!matchedUrgency) {
      matchedUrgency = UrgencyLevel.LOW;
      matchedTier = ruleSet.urgency_tiers.low || {};
    }

    const facilityType = this.determineFacilityType(matchedUrgency);
    const recommendedSpecialty = matchedTier.actions?.specialist || 'general';

    return {
      urgency_level: matchedUrgency,
      recommended_specialty: recommendedSpecialty,
      facility_type: facilityType,
      reasoning: this.generateReasoningText(
        symptoms,
        matchedUrgency,
        recommendedSpecialty,
      ),
    };
  }

  private matchesTier(
    symptoms: Set<string>,
    testResults: Record<string, any>,
    tier: any,
  ): boolean {
    if (!tier) return false;

    const tierSymptoms = (tier.symptoms || []).map((s: string) =>
      s.toLowerCase(),
    );

    const hasSymptom = tierSymptoms.some((symptom: string) =>
      symptoms.has(symptom),
    );

    if (!hasSymptom && tierSymptoms.length > 0) {
      return false;
    }

    if (tier.test_results) {
      for (const [key, condition] of Object.entries(tier.test_results)) {
        const testValue = testResults[key];
        if (testValue === undefined || testValue === null) continue;

        const cond = condition as any;
        if (cond.min !== undefined && testValue < cond.min) return false;
        if (cond.max !== undefined && testValue > cond.max) return false;
        if (cond.equals !== undefined && testValue !== cond.equals) return false;
      }
    }

    return true;
  }

  private determineFacilityType(urgency: UrgencyLevel): FacilityType {
    switch (urgency) {
      case UrgencyLevel.CRITICAL:
        return FacilityType.TERTIARY_HOSPITAL;
      case UrgencyLevel.HIGH:
        return FacilityType.SECONDARY_HOSPITAL;
      case UrgencyLevel.MEDIUM:
        return FacilityType.SECONDARY_HOSPITAL;
      default:
        return FacilityType.PRIMARY_CLINIC;
    }
  }

  private stringToUrgencyLevel(value: string): UrgencyLevel {
    const urgencyMap: Record<string, UrgencyLevel> = {
      critical: UrgencyLevel.CRITICAL,
      high: UrgencyLevel.HIGH,
      medium: UrgencyLevel.MEDIUM,
      low: UrgencyLevel.LOW,
    };

    return urgencyMap[value.toLowerCase()] || UrgencyLevel.LOW;
  }

  private generateReasoningText(
    symptoms: Set<string>,
    urgency: UrgencyLevel,
    specialty: string,
  ): string {
    const symptomList = Array.from(symptoms).join(', ');
    return `Patient presenting with ${symptomList} requires ${urgency} urgency care. Recommended specialist: ${specialty}.`;
  }
}
