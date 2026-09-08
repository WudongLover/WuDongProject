import { Controller, Get } from '@midwayjs/core';

/**
 * 服务健康检查：GET / 与 GET /api/health
 */
@Controller('/')
export class HomeController {
  @Get('/')
  async home() {
    return { service: 'wu-dong-midway-demo', ok: true };
  }

  @Get('/api/health')
  async health() {
    return {
      service: 'wu-dong-midway-demo',
      status: 'up',
      time: new Date().toISOString(),
    };
  }
}
