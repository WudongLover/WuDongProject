import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { OrderService } from '../service/order';

/**
 * order 模块路由（前缀 /api/order，骨架示例）
 */
@Controller('/api/order')
export class OrderController {
  @Inject()
  orderService: OrderService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string,
    @Query('userId') userId: number,
    @Query('type') type: string,
    @Query('status') status: string
  ) {
    return this.orderService.page({ page, size, keyword, userId, type, status });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.orderService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.orderService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.orderService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.orderService.remove(id);
  }
}
