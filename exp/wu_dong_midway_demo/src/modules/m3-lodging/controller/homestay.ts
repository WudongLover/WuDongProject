import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { HomestayService } from '../service/homestay';

/**
 * m3-lodging 模块路由（前缀 /api/m3/homestay，骨架示例）
 */
@Controller('/api/m3/homestay')
export class HomestayController {
  @Inject()
  homestayService: HomestayService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string,
    @Query('status') status: string
  ) {
    return this.homestayService.page({ page, size, keyword, status });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.homestayService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.homestayService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.homestayService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.homestayService.remove(id);
  }
}
