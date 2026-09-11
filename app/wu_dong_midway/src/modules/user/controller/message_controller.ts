import { Controller, Get, Inject, Param, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ApiError } from '../../m5-community/error/api_error';
import { MessageService } from '../service/message_service';

@Controller('/api/user/messages')
export class MessageController {
  @Inject()
  ctx: Context;

  @Inject()
  messageService: MessageService;

  @Get('/')
  async list() {
    return this.ok(await this.messageService.list(this.userId()));
  }

  @Get('/unread-count')
  async unreadCount() {
    return this.ok(await this.messageService.unreadCount(this.userId()));
  }

  @Put('/read-all')
  async markAllRead() {
    return this.ok(await this.messageService.markAllRead(this.userId()));
  }

  @Put('/:id/read')
  async markRead(@Param('id') id: string) {
    return this.ok(await this.messageService.markRead(this.userId(), id));
  }

  private userId(): string {
    const id = String((this.ctx as any).userId ?? '');
    if (!/^\d+$/.test(id)) throw new ApiError(1001, '未登录', 401);
    return id;
  }

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }
}
