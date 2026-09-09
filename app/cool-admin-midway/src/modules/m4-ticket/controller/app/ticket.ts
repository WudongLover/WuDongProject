import { BaseController, CoolTag, CoolUrlTag, TagTypes } from '@cool-midway/core';
import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { M4TicketService, TicketAddPayload } from '../../service/ticket';

/** C端门票接口；当前不读取 user 表，等待登录鉴权模块接入。 */
@Controller('/app/m4/ticket')
@CoolUrlTag()
export class AppM4TicketController extends BaseController {
  @Inject()
  ticketService: M4TicketService;

  @Get('/list', { summary: '门票列表查询' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async listTickets(
    @Query('page') page: string,
    @Query('size') size: string,
    @Query('keyword') keyword: string,
    @Query('scenicId') scenicId: string
  ) {
    return this.ok(await this.ticketService.page({ page, size, keyword, scenicId }));
  }

  @Get('/page', { summary: '门票分页查询' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async pageTickets(
    @Query('page') page: string,
    @Query('size') size: string,
    @Query('keyword') keyword: string,
    @Query('scenicId') scenicId: string
  ) {
    return this.ok(await this.ticketService.page({ page, size, keyword, scenicId }));
  }

  @Get('/info', { summary: '门票单点查询' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async ticketInfo(@Query('id') id: string) {
    return this.ok(await this.ticketService.info(id));
  }

  @Post('/add', { summary: '新增门票' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async addTicket(@Body() payload: TicketAddPayload) {
    return this.ok(await this.ticketService.add(payload));
  }

  @Post('/delete', { summary: '逻辑删除门票' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async remove(@Body('id') id: string) {
    return this.ok(await this.ticketService.remove(id));
  }
}
