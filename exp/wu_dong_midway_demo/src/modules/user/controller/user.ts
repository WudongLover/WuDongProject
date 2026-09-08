import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { UserService } from '../service/user';

/**
 * user 模块路由（前缀 /api/user，骨架示例）
 */
@Controller('/api/user')
export class UserController {
  @Inject()
  userService: UserService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string
  ) {
    return this.userService.page({ page, size, keyword });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.userService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.userService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.userService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.userService.remove(id);
  }
}
