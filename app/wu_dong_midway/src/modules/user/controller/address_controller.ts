import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ApiError } from '../../m5-community/error/api_error';
import { AddressService } from '../service/address_service';

@Controller('/api/user/addresses')
export class AddressController {
  @Inject()
  ctx: Context;

  @Inject()
  addressService: AddressService;

  @Get('/')
  async list() {
    return this.ok(await this.addressService.list(this.userId()));
  }

  @Post('/')
  async create(@Body() body: any) {
    return this.ok(await this.addressService.create(this.userId(), body));
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.ok(await this.addressService.update(this.userId(), id, body));
  }

  @Del('/:id')
  async remove(@Param('id') id: string) {
    return this.ok(await this.addressService.remove(this.userId(), id));
  }

  @Put('/:id/default')
  async setDefault(@Param('id') id: string) {
    return this.ok(await this.addressService.setDefault(this.userId(), id));
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
