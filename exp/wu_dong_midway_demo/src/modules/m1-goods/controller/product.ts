import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { ProductService } from '../service/product';

/**
 * m1-goods 模块路由（前缀 /api/m1/product，骨架示例）
 */
@Controller('/api/m1/product')
export class ProductController {
  @Inject()
  productService: ProductService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string,
    @Query('module') module: string,
    @Query('status') status: string,
    @Query('categoryId') categoryId: number
  ) {
    return this.productService.page({ page, size, keyword, module, status, categoryId });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.productService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.productService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.productService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.productService.remove(id);
  }
}
