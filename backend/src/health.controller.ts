import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller('api/v1/health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', service: 'medlink-api', timestamp: new Date().toISOString() };
  }
}
