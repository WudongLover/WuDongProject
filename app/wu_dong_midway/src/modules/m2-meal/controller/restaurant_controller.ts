import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@midwayjs/core';
import { RestaurantService } from '../service/restaurant_service';

/**
 * 【m2-meal 模块】餐厅接口
 * 前缀 /api/v1/m2/restaurant
 */
@Controller('/api/v1/m2/restaurant')
export class RestaurantController {
  @Inject()
  service!: RestaurantService;

  @Get('/page')
  async page(@Query() query: any) {
    return this.service.page(query);
  }

  @Get('/info/:id')
  async info(@Param('id') id: string) {
    return this.service.info(Number(id));
  }

  @Post('/')
  async add(@Body() body: any) {
    return this.service.add(body);
  }

  @Del('/:id')
  async delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}