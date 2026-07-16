import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  SyncService,
  QueueActionDto,
  SyncResultDto,
} from '../services/sync.service';
import { OfflineQueuedAction } from '../entities/offline-queued-action.entity';

@Controller('api/v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('queue')
  @HttpCode(HttpStatus.CREATED)
  async queueAction(
    @Body() dto: QueueActionDto,
    @Query('userId') userId: string,
  ): Promise<OfflineQueuedAction> {
    return this.syncService.queueAction(userId, dto);
  }

  @Get('pending')
  async getPendingActions(
    @Query('userId') userId: string,
  ): Promise<OfflineQueuedAction[]> {
    return this.syncService.getPendingActions(userId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncPendingActions(
    @Query('userId') userId: string,
  ): Promise<SyncResultDto> {
    return this.syncService.syncPendingActions(userId);
  }

  @Get('failed')
  async getFailedActions(
    @Query('userId') userId: string,
  ): Promise<OfflineQueuedAction[]> {
    return this.syncService.getFailedActions(userId);
  }

  @Post('retry/:actionId')
  @HttpCode(HttpStatus.OK)
  async retryFailedAction(
    @Param('actionId') actionId: string,
  ): Promise<OfflineQueuedAction> {
    return this.syncService.retryFailedAction(actionId);
  }

  @Delete('queue/:actionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQueuedAction(@Param('actionId') actionId: string): Promise<void> {
    return this.syncService.deleteQueuedAction(actionId);
  }

  @Get('stats')
  async getQueueStats(
    @Query('userId') userId: string,
  ): Promise<{
    total_pending: number;
    total_failed: number;
    total_synced: number;
  }> {
    return this.syncService.getQueueStats(userId);
  }
}
