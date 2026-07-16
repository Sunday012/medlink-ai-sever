import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  OfflineQueuedAction,
  ActionType,
  EntityType,
} from '../entities/offline-queued-action.entity';
import { User } from '../entities/user.entity';
import { ReferralService } from './referral.service';
import { PatientService } from './patient.service';

export class QueueActionDto {
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string;
  payload: Record<string, any>;
}

export class SyncResultDto {
  queued_actions: number;
  synced_actions: number;
  failed_actions: number;
  details: {
    action_id: string;
    action_type: ActionType;
    synced: boolean;
    error?: string;
  }[];
}

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(OfflineQueuedAction)
    private queuedActionRepository: Repository<OfflineQueuedAction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private referralService: ReferralService,
    private patientService: PatientService,
  ) {}

  async queueAction(
    userId: string,
    dto: QueueActionDto,
  ): Promise<OfflineQueuedAction> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const action = this.queuedActionRepository.create({
      user,
      action_type: dto.action_type,
      entity_type: dto.entity_type,
      entity_id: dto.entity_id,
      payload: dto.payload,
      sync_failed: false,
    });

    return this.queuedActionRepository.save(action);
  }

  async getPendingActions(userId: string): Promise<OfflineQueuedAction[]> {
    return this.queuedActionRepository.find({
      where: {
        user_id: userId,
        synced_at: IsNull(),
      },
      order: { created_at: 'ASC' },
    });
  }

  async syncPendingActions(userId: string): Promise<SyncResultDto> {
    const pendingActions = await this.getPendingActions(userId);

    const results: SyncResultDto['details'] = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const action of pendingActions) {
      try {
        await this.replayAction(action);
        action.synced_at = new Date();
        action.sync_failed = false;
        action.sync_error = null as any;
        await this.queuedActionRepository.save(action);
        syncedCount++;
        results.push({
          action_id: action.id,
          action_type: action.action_type,
          synced: true,
        });
      } catch (error) {
        failedCount++;
        action.sync_failed = true;
        action.sync_error = error.message;
        await this.queuedActionRepository.save(action);
        results.push({
          action_id: action.id,
          action_type: action.action_type,
          synced: false,
          error: error.message,
        });
      }
    }

    return {
      queued_actions: pendingActions.length,
      synced_actions: syncedCount,
      failed_actions: failedCount,
      details: results,
    };
  }

  private async replayAction(action: OfflineQueuedAction): Promise<void> {
    switch (action.action_type) {
      case ActionType.CREATE_REFERRAL:
        await this.referralService.createReferral(action.payload as any);
        break;

      case ActionType.UPDATE_REFERRAL:
        await this.referralService.updateReferral(
          action.entity_id,
          action.payload as any,
        );
        break;

      case ActionType.UPDATE_REFERRAL_STATUS:
        await this.referralService.updateReferralStatus(
          action.entity_id,
          action.payload as any,
        );
        break;

      case ActionType.CREATE_PATIENT:
        await this.patientService.createPatient(action.payload as any);
        break;

      case ActionType.UPDATE_PATIENT:
        await this.patientService.updatePatient(
          action.entity_id,
          action.payload as any,
        );
        break;

      case ActionType.DISPATCH_AMBULANCE:
        // TODO: Implement ambulance dispatch replay
        break;

      case ActionType.UPDATE_DISPATCH_STATUS:
        // TODO: Implement dispatch status update replay
        break;

      default:
        throw new BadRequestException(`Unknown action type: ${action.action_type}`);
    }
  }

  async getFailedActions(userId: string): Promise<OfflineQueuedAction[]> {
    return this.queuedActionRepository.find({
      where: {
        user_id: userId,
        sync_failed: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async retryFailedAction(actionId: string): Promise<OfflineQueuedAction> {
    const action = await this.queuedActionRepository.findOne({
      where: { id: actionId },
    });

    if (!action) {
      throw new BadRequestException('Action not found');
    }

    try {
      await this.replayAction(action);
      action.synced_at = new Date();
      action.sync_failed = false;
      action.sync_error = null as any;
    } catch (error) {
      action.sync_error = error.message;
      throw error;
    }

    return this.queuedActionRepository.save(action);
  }

  async deleteQueuedAction(actionId: string): Promise<void> {
    await this.queuedActionRepository.delete(actionId);
  }

  async getQueueStats(userId: string): Promise<{
    total_pending: number;
    total_failed: number;
    total_synced: number;
  }> {
    const total_pending = await this.queuedActionRepository.count({
      where: { user_id: userId, synced_at: IsNull() },
    });

    const total_failed = await this.queuedActionRepository.count({
      where: { user_id: userId, sync_failed: true },
    });

    const total_synced = await this.queuedActionRepository.count({
      where: { user_id: userId, synced_at: IsNull(), sync_failed: false },
    });

    return {
      total_pending,
      total_failed,
      total_synced,
    };
  }
}
