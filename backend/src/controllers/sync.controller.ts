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
  Req,
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
    @Req() request: { user: { id: string } },
  ): Promise<OfflineQueuedAction> {
    return this.syncService.queueAction(request.user.id, dto);
  }

  @Get('pending')
  async getPendingActions(
    @Req() request: { user: { id: string } },
  ): Promise<OfflineQueuedAction[]> {
    return this.syncService.getPendingActions(request.user.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncPendingActions(
    @Req() request: { user: { id: string } },
  ): Promise<SyncResultDto> {
    return this.syncService.syncPendingActions(request.user.id);
  }

  @Get('failed')
  async getFailedActions(
    @Req() request: { user: { id: string } },
  ): Promise<OfflineQueuedAction[]> {
    return this.syncService.getFailedActions(request.user.id);
  }

  @Post('retry/:actionId')
  @HttpCode(HttpStatus.OK)
  async retryFailedAction(
    @Param('actionId') actionId: string,
    @Req() request: { user: { id: string } },
  ): Promise<OfflineQueuedAction> {
    return this.syncService.retryFailedAction(actionId, request.user.id);
  }

  @Delete('queue/:actionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQueuedAction(
    @Param('actionId') actionId: string,
    @Req() request: { user: { id: string } },
  ): Promise<void> {
    return this.syncService.deleteQueuedAction(actionId, request.user.id);
  }

  @Get('stats')
  async getQueueStats(
    @Req() request: { user: { id: string } },
  ): Promise<{
    total_pending: number;
    total_failed: number;
    total_synced: number;
  }> {
    return this.syncService.getQueueStats(request.user.id);
  }
}
