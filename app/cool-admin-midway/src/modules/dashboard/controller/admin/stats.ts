import { BaseController, CoolController } from '@cool-midway/core';
import { Get, Inject, Provide } from '@midwayjs/core';
import { DashboardStatsService } from '../../service/stats';

/**
 * 乌东文旅运营看板统计
 */
@CoolController()
@Provide()
export class AdminDashboardStatsController extends BaseController {
  @Inject()
  dashboardStatsService: DashboardStatsService;

  @Get('/overview', { summary: '平台总览' })
  async overview() {
    return this.ok(await this.dashboardStatsService.overview());
  }

  @Get('/heritage', { summary: '衣·非遗看板' })
  async heritage() {
    return this.ok(await this.dashboardStatsService.heritage());
  }

  @Get('/meal', { summary: '食·风味看板' })
  async meal() {
    return this.ok(await this.dashboardStatsService.meal());
  }

  @Get('/lodging', { summary: '住·山居看板' })
  async lodging() {
    return this.ok(await this.dashboardStatsService.lodging());
  }

  @Get('/travel', { summary: '行·山水看板' })
  async travel() {
    return this.ok(await this.dashboardStatsService.travel());
  }

  @Get('/community', { summary: '社区看板' })
  async community() {
    return this.ok(await this.dashboardStatsService.community());
  }

  @Get('/user', { summary: '用户看板' })
  async user() {
    return this.ok(await this.dashboardStatsService.user());
  }
}
