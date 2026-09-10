import { Body, Controller, Get, Inject, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AuthService } from '../service/auth_service';

const REFRESH_COOKIE = 'wudong_refresh';
const REFRESH_MAX_AGE_MS = 30 * 86400000;

/**
 * C 端鉴权：/api/user/*
 * 登录/注册/发码/刷新为开放接口；/me、/profile、/password 需要 access token（见 AuthMiddleware）。
 */
@Controller('/api/user')
export class AuthController {
  @Inject()
  service: AuthService;

  @Inject()
  ctx: Context;

  /** 登录成功：写 refresh Cookie + 返回 access token 与用户资料 */
  private out(x: any) {
    this.ctx.cookies.set(REFRESH_COOKIE, x.refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_MAX_AGE_MS,
      path: '/',
    });
    return {
      code: 0,
      message: 'ok',
      data: { token: x.token, expire: x.expire, user: x.user },
    };
  }

  private userId() {
    return (this.ctx as any).userId;
  }

  @Post('/sms-code')
  async smsCode(@Body('phone') phone: string) {
    const hint = await this.service.sendSmsCode(phone);
    return { code: 0, message: 'ok', data: { sent: true, hint } };
  }

  @Post('/login-sms')
  async smsLogin(
    @Body('phone') phone: string,
    @Body('smsCode') smsCode: string
  ) {
    return this.out(await this.service.smsLogin(phone, smsCode));
  }

  @Post('/login-password')
  async passwordLogin(
    @Body('phone') phone: string,
    @Body('password') password: string
  ) {
    return this.out(await this.service.login(phone, password));
  }

  @Post('/register')
  async register(@Body() body: any) {
    return this.out(
      await this.service.register(
        body?.phone,
        body?.password,
        body?.name,
        body?.smsCode
      )
    );
  }

  @Post('/refresh')
  async refresh() {
    const data = await this.service.refreshAccess(
      this.ctx.cookies.get(REFRESH_COOKIE)
    );
    return { code: 0, message: 'ok', data };
  }

  @Post('/logout')
  async logout() {
    await this.service.logout(this.ctx.cookies.get(REFRESH_COOKIE));
    this.ctx.cookies.set(REFRESH_COOKIE, null, { maxAge: 0, path: '/' });
    return { code: 0, message: 'ok', data: null };
  }

  @Get('/me')
  async me() {
    return { code: 0, message: 'ok', data: await this.service.me(this.userId()) };
  }

  @Post('/profile')
  async profile(@Body() body: any) {
    return {
      code: 0,
      message: 'ok',
      data: await this.service.updateProfile(
        this.userId(),
        body?.name,
        body?.bio
      ),
    };
  }

  /** 个人中心：设置或修改登录密码 */
  @Post('/password')
  async setPassword(@Body() body: any) {
    return {
      code: 0,
      message: 'ok',
      data: await this.service.setPassword(
        this.userId(),
        body?.newPassword,
        body?.oldPassword
      ),
    };
  }
}
