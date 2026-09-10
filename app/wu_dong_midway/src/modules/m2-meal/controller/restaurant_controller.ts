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
 *
 * 响应统一包 { code, message, data } 信封：前端 apiFetch 按此契约解包。
 * 统一响应体按 TODO.md 属 P1 公共交付物（wudong/common），就绪前与 m4 一样在本模块内自建。
 */
@Controller('/api/v1/m2/restaurant')
export class RestaurantController {
  @Inject()
  service!: RestaurantService;

  private ok(data: any) {
    return { code: 0, message: 'ok', data };
  }

  @Get('/page')
  async page(@Query() query: any) {
    return this.ok(await this.service.page(query));
  }

  @Get('/info/:id')
  async info(@Param('id') id: string) {
    return this.ok(await this.service.info(Number(id)));
  }

  @Post('/')
  async add(@Body() body: any) {
    return this.ok(await this.service.add(body));
  }

  @Del('/:id')
  async delete(@Param('id') id: string) {
    return this.ok(await this.service.delete(Number(id)));
  }
}
