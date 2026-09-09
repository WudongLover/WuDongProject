import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@midwayjs/core';
import { ProductService } from '../service/product_service';

/**
 * 【m1-goods 模块】商品接口（衣/特产统一表）
 * 前缀 /api/v1/m1/product；特产= module=SPECIALTY，衣= module=GOODS
 */
@Controller('/api/v1/m1/product')
export class ProductController {
  @Inject()
  service: ProductService;

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

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}