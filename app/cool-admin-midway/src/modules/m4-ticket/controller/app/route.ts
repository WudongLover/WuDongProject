import { BaseController, CoolTag, CoolUrlTag, TagTypes } from '@cool-midway/core';
import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { M4RouteService, RouteAddPayload } from '../../service/route';

/** C端路线套餐接口；当前不读取 user 表，等待登录鉴权模块接入。 */
@Controller('/app/m4/route')
@CoolUrlTag()
export class AppM4RouteController extends BaseController {
  @Inject()
  routeService: M4RouteService;

  @Get('/list', { summary: '路线套餐列表查询' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async listRoutes(
    @Query('page') page: string,
    @Query('size') size: string,
    @Query('keyword') keyword: string,
    @Query('theme') theme: string,
    @Query('days') days: string,
    @Query('status') status: string,
    @Query('merchantId') merchantId: string
  ) {
    return this.ok(
      await this.routeService.page({ page, size, keyword, theme, days, status, merchantId })
    );
  }

  @Get('/page', { summary: '路线套餐分页查询' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async pageRoutes(
    @Query('page') page: string,
    @Query('size') size: string,
    @Query('keyword') keyword: string,
    @Query('theme') theme: string,
    @Query('days') days: string,
    @Query('status') status: string,
    @Query('merchantId') merchantId: string
  ) {
    return this.ok(
      await this.routeService.page({ page, size, keyword, theme, days, status, merchantId })
    );
  }

  @Get('/info', { summary: '路线套餐单点查询' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async routeInfo(@Query('id') id: string) {
    return this.ok(await this.routeService.info(id));
  }

  @Post('/add', { summary: '新增路线套餐' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async addRoute(@Body() payload: RouteAddPayload) {
    return this.ok(await this.routeService.add(payload));
  }

  @Post('/delete', { summary: '逻辑删除路线套餐' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async remove(@Body('id') id: string) {
    return this.ok(await this.routeService.remove(id));
  }
}
