import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { TicketService } from '../service/ticket';

/**
 * m4-ticket 模块路由（前缀 /api/m4/ticket，骨架示例）
 */
@Controller('/api/m4/ticket')
export class TicketController {
  @Inject()
  ticketService: TicketService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string,
    @Query('scenicId') scenicId: number
  ) {
    return this.ticketService.page({ page, size, keyword, scenicId });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.ticketService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.ticketService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.ticketService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.ticketService.remove(id);
  }
}
