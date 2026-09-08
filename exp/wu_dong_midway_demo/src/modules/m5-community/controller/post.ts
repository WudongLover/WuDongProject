import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { PostService } from '../service/post';

/**
 * m5-community 模块路由（前缀 /api/m5/post，骨架示例）
 */
@Controller('/api/m5/post')
export class PostController {
  @Inject()
  postService: PostService;

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('keyword') keyword: string,
    @Query('userId') userId: number,
    @Query('status') status: string
  ) {
    return this.postService.page({ page, size, keyword, userId, status });
  }

  @Get('/info')
  async info(@Query('id') id: number) {
    return this.postService.info(id);
  }

  @Post('/add')
  async add(@Body() body: any) {
    return this.postService.add(body);
  }

  @Post('/update')
  async update(@Body() body: any) {
    return this.postService.update(body);
  }

  @Post('/remove')
  async remove(@Body('id') id: number) {
    return this.postService.remove(id);
  }
}
