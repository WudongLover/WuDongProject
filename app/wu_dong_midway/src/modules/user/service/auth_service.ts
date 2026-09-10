import {
  Config,
  Logger,
  ILogger,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user_entity';
import { RefreshTokenEntity } from '../entity/refresh_token_entity';
import { ApiError } from '../../m5-community/error/api_error';

const PHONE_RE = /^1\d{10}$/;
/** 密码：8-20 位，同时包含字母与数字（与前端表单提示一致） */
const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/;
const ACCESS_EXPIRE_SEC = 7200;
const REFRESH_EXPIRE_MS = 30 * 86400000;

/**
 * 演示环境短信验证码：随机 6 位码打印到后端控制台，不接真实短信平台。
 * 只存进程内存（C 端服务未引入 Redis），服务重启后未使用的验证码即失效。
 */
const SMS_TTL_MS = 5 * 60 * 1000;
const SMS_RESEND_MS = 60 * 1000;
const smsStore = new Map<
  string,
  { code: string; expireAt: number; sentAt: number }
>();

/**
 * C 端鉴权：JWT access（内存态）+ 数据库 refresh 会话，密码 scrypt 落库。
 */
@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class AuthService {
  @InjectEntityModel(UserEntity)
  users: Repository<UserEntity>;

  @InjectEntityModel(RefreshTokenEntity)
  refresh: Repository<RefreshTokenEntity>;

  @Logger()
  logger: ILogger;

  @Config('auth')
  config: any;

  private secret() {
    return process.env.JWT_SECRET || 'wu-dong-dev-secret';
  }

  private profile(u: UserEntity) {
    return {
      id: String(u.id),
      phone: u.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
      name: u.name,
      avatar: u.avatar,
      bio: u.bio,
      status: u.status,
      hasPassword: !!u.passwordHash,
    };
  }

  private jwt(id: string) {
    const h = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' })
    ).toString('base64url');
    const p = Buffer.from(
      JSON.stringify({
        id,
        typ: 'access',
        exp: Math.floor(Date.now() / 1000) + ACCESS_EXPIRE_SEC,
        jti: randomUUID(),
      })
    ).toString('base64url');
    return (
      h +
      '.' +
      p +
      '.' +
      createHmac('sha256', this.secret()).update(h + '.' + p).digest('base64url')
    );
  }

  verify(token: string) {
    try {
      const [h, p, s] = token.split('.');
      const sig = createHmac('sha256', this.secret())
        .update(h + '.' + p)
        .digest('base64url');
      if (sig !== s) return null;
      const x = JSON.parse(Buffer.from(p, 'base64url').toString());
      return x.exp > Date.now() / 1000 ? String(x.id) : null;
    } catch {
      return null;
    }
  }

  private hash(pwd: string) {
    return scryptSync(pwd, this.secret(), 32).toString('hex');
  }

  private verifyPassword(input: string, stored: string) {
    if (!stored) return false;
    const a = Buffer.from(this.hash(input));
    const b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private assertPassword(pwd: string) {
    if (!PASSWORD_RE.test(pwd || '')) {
      throw new ApiError(1004, '密码需 8-20 位，且同时包含字母与数字');
    }
  }

  /**
   * 发送验证码：写入进程内存并打印到后端控制台
   */
  async sendSmsCode(phone: string) {
    if (!PHONE_RE.test(phone)) {
      throw new ApiError(1004, '手机号格式不正确');
    }
    const now = Date.now();
    const last = smsStore.get(phone);
    if (last && now - last.sentAt < SMS_RESEND_MS) {
      throw new ApiError(1005, '验证码发送过于频繁，请稍后再试');
    }
    const code = String(randomInt(100000, 1000000));
    smsStore.set(phone, { code, expireAt: now + SMS_TTL_MS, sentAt: now });
    this.logger.info(
      `[MockSMS] 发送验证码 phone=${phone} code=${code}（5 分钟内有效，演示环境不真实发送短信）`
    );
    return '验证码已发送，请查看后端控制台';
  }

  /** 校验并消费验证码（一次性，用后即废） */
  private consumeSmsCode(phone: string, code?: string) {
    const rec = smsStore.get(phone);
    if (!rec) {
      throw new ApiError(1004, '请先获取验证码');
    }
    if (rec.expireAt <= Date.now()) {
      smsStore.delete(phone);
      throw new ApiError(1004, '验证码已过期，请重新获取');
    }
    if (!code || String(code) !== rec.code) {
      throw new ApiError(1004, '验证码错误');
    }
    smsStore.delete(phone);
  }

  /**
   * 手机验证码登录：验证码校验通过后自动建号
   */
  async smsLogin(phone: string, code: string) {
    if (!PHONE_RE.test(phone)) {
      throw new ApiError(1004, '手机号格式不正确');
    }
    this.consumeSmsCode(phone, code);
    return this.login(phone, undefined, 'sms');
  }

  async login(phone: string, password?: string, sms?: string) {
    if (!PHONE_RE.test(phone)) {
      throw new ApiError(1004, '手机号格式不正确');
    }
    let u = await this.users.findOneBy({ phone });
    if (!u && sms) {
      u = await this.users.save(
        this.users.create({
          phone,
          name: phone,
          avatar: '',
          bio: '',
          passwordHash: '',
          status: 'ENABLED',
        })
      );
    }
    if (
      !u ||
      u.status !== 'ENABLED' ||
      (password && !this.verifyPassword(password, u.passwordHash))
    ) {
      throw new ApiError(1001, '账号或密码错误');
    }
    const rt = randomBytes(32).toString('base64url');
    await this.refresh.insert({
      userId: u.id,
      jti: rt,
      tokenHash: createHash('sha256').update(rt).digest('hex'),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRE_MS),
    });
    return {
      token: this.jwt(String(u.id)),
      expire: ACCESS_EXPIRE_SEC,
      refreshToken: rt,
      user: this.profile(u),
    };
  }

  /**
   * 注册：验证码校验通过后建号，密码写库
   */
  async register(
    phone: string,
    password: string,
    name: string,
    code?: string
  ) {
    if (!PHONE_RE.test(phone)) {
      throw new ApiError(1004, '手机号格式不正确');
    }
    this.assertPassword(password);
    this.consumeSmsCode(phone, code);
    const u = await this.users.findOneBy({ phone });
    if (u && u.passwordHash) {
      throw new ApiError(1004, '手机号已注册，请直接登录');
    }
    const user =
      u ||
      this.users.create({ phone, avatar: '', bio: '', status: 'ENABLED' });
    user.name = name || phone;
    user.passwordHash = this.hash(password);
    await this.users.save(user);
    return this.login(phone, password);
  }

  /**
   * 设置/修改密码：未设密码时直接设置，已设密码时必须提供原密码
   */
  async setPassword(id: string, newPassword: string, oldPassword?: string) {
    const u = await this.users.findOneBy({ id });
    if (!u || u.status !== 'ENABLED') {
      throw new ApiError(1001, '登录失效，请重新登录', 401);
    }
    this.assertPassword(newPassword);
    if (u.passwordHash) {
      if (!oldPassword || !this.verifyPassword(oldPassword, u.passwordHash)) {
        throw new ApiError(1004, '原密码不正确');
      }
      if (this.verifyPassword(newPassword, u.passwordHash)) {
        throw new ApiError(1004, '新密码不能与原密码相同');
      }
    }
    const passwordHash = this.hash(newPassword);
    await this.users.update({ id: u.id }, { passwordHash });
    return this.profile({ ...u, passwordHash });
  }

  /**
   * 刷新 access token：refresh 固定 30 天不轮换，登出即撤销
   */
  async refreshAccess(rt: string) {
    const expired = new ApiError(1001, '登录已过期，请重新登录', 401);
    if (!rt) throw expired;
    const row = await this.refresh.findOneBy({ jti: rt });
    if (
      !row ||
      row.revokedAt ||
      row.expiresAt.getTime() <= Date.now() ||
      createHash('sha256').update(rt).digest('hex') !== row.tokenHash
    ) {
      throw expired;
    }
    const u = await this.users.findOneBy({ id: row.userId });
    if (!u || u.status !== 'ENABLED') {
      throw new ApiError(1001, '账号已被禁用，请联系平台处理', 403);
    }
    return {
      token: this.jwt(String(u.id)),
      expire: ACCESS_EXPIRE_SEC,
      user: this.profile(u),
    };
  }

  async me(id: string) {
    const u = await this.users.findOneBy({ id });
    if (!u || u.status !== 'ENABLED') {
      throw new ApiError(1001, '登录失效，请重新登录', 401);
    }
    return this.profile(u);
  }

  async updateProfile(id: string, name?: string, bio?: string) {
    const u = await this.users.findOneBy({ id });
    if (!u || u.status !== 'ENABLED') {
      throw new ApiError(1001, '登录失效，请重新登录', 401);
    }
    const next: any = {};
    if (name !== undefined) next.name = String(name).trim().slice(0, 64);
    if (bio !== undefined) next.bio = String(bio).trim().slice(0, 255);
    if (Object.keys(next).length) {
      await this.users.update({ id: u.id }, next);
    }
    return this.profile({ ...u, ...next });
  }

  async logout(rt: string) {
    if (rt) {
      await this.refresh.update({ jti: rt }, { revokedAt: new Date() });
    }
  }
}
