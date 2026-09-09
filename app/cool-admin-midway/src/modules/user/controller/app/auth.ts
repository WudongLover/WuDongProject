import {
  Body,
  Config,
  Get,
  Inject,
  Post,
} from '@midwayjs/core';
import {
  BaseController,
  CoolController,
  CoolTag,
  CoolUrlTag,
  TagTypes,
} from '@cool-midway/core';
import { CoolCommException } from '@cool-midway/core';
import { WudongAuthService } from '../../service/wudong-auth';

/**
 * C 端认证（当前主入口）
 * 登录/注册/刷新/登出均为开放接口；/me 需要 access token。
 */
@CoolUrlTag()
@CoolController()
export class AppUserAuthController extends BaseController {
  @Inject()
  ctx;

  @Inject()
  wudongAuthService: WudongAuthService;

  @Config('module.user.auth')
  authConfig: {
    refreshCookie: string;
    cookieSecure: boolean;
  };

  private setRefreshCookie(refreshToken: string, maxAgeSec: number) {
    this.ctx.cookies.set(this.authConfig.refreshCookie, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authConfig.cookieSecure,
      maxAge: maxAgeSec * 1000,
      path: '/',
      overwrite: true,
    });
  }

  private clearRefreshCookie() {
    this.ctx.cookies.set(this.authConfig.refreshCookie, null, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authConfig.cookieSecure,
      maxAge: 0,
      expires: new Date(0),
      path: '/',
    });
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/sms-code', { summary: '发送短信验证码' })
  async smsCode(@Body('phone') phone: string) {
    const hint = await this.wudongAuthService.sendSmsCode(phone);
    return this.ok({ sent: true, hint });
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/login-sms', { summary: '短信验证码登录（自动建号）' })
  async loginSms(
    @Body('phone') phone: string,
    @Body('smsCode') smsCode: string
  ) {
    const result = await this.wudongAuthService.smsLogin(phone, smsCode);
    this.setRefreshCookie(result.refreshToken, result.refreshExpire);
    return this.ok({
      token: result.token,
      expire: result.expire,
      user: result.user,
    });
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/login-password', { summary: '密码登录' })
  async loginPassword(
    @Body('phone') phone: string,
    @Body('password') password: string
  ) {
    const result = await this.wudongAuthService.passwordLogin(phone, password);
    this.setRefreshCookie(result.refreshToken, result.refreshExpire);
    return this.ok({
      token: result.token,
      expire: result.expire,
      user: result.user,
    });
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/register', { summary: '注册/完善资料与密码' })
  async register(
    @Body('phone') phone: string,
    @Body('smsCode') smsCode: string,
    @Body('password') password: string,
    @Body('name') name: string
  ) {
    const result = await this.wudongAuthService.register(
      phone,
      smsCode,
      name,
      password
    );
    this.setRefreshCookie(result.refreshToken, result.refreshExpire);
    return this.ok({
      token: result.token,
      expire: result.expire,
      user: result.user,
    });
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/refresh', { summary: '刷新 access token（30 天固定不轮换）' })
  async refresh() {
    const refreshToken = this.ctx.cookies.get(
      this.authConfig.refreshCookie
    );
    if (!refreshToken) {
      throw new CoolCommException('登录已过期，请重新登录');
    }
    const result = await this.wudongAuthService.refresh(refreshToken);
    return this.ok({
      token: result.token,
      expire: result.expire,
      user: result.user,
    });
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/logout', { summary: '退出登录' })
  async logout() {
    const refreshToken = this.ctx.cookies.get(
      this.authConfig.refreshCookie
    );
    await this.wudongAuthService.logout(refreshToken);
    this.clearRefreshCookie();
    return this.ok();
  }

  @Get('/me', { summary: '当前登录用户' })
  async me() {
    return this.ok(await this.wudongAuthService.me(this.ctx.user.id));
  }

  @Post('/profile', { summary: '更新当前用户资料' })
  async profile(
    @Body('name') name: string,
    @Body('bio') bio: string
  ) {
    return this.ok(
      await this.wudongAuthService.updateProfile(this.ctx.user.id, name, bio)
    );
  }
}
