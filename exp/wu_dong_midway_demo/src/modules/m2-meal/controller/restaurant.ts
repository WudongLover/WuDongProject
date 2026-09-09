import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { RestaurantService } from '../service/restaurant';

/**
 * m2-meal 模块路由（前缀 /api/m2/restaurant，骨架示例）
 */
@Controller('/api/m2/restaurant')
export class RestaurantController {
  @Inject()
  restaurantService: RestaurantService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string,
    @Query('status') status: string
  ) {
    return this.restaurantService.page({ page, size, keyword, status });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.restaurantService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.restaurantService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.restaurantService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.restaurantService.remove(id);
  }
}
