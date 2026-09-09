import { Config, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { WudongUserEntity } from '../entity/wudong-user';
import { WudongRefreshTokenEntity } from '../entity/wudong-refresh-token';
import { UserSmsService } from './sms';

const PHONE_RE = /^1\d{10}$/;
const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/;
const BCRYPT_ROUNDS = 12;

export interface WudongAuthResult {
  token: string;
  expire: number;
  refreshToken: string;
  refreshExpire: number;
  user: WudongUserProfile;
}

export interface WudongRefreshResult {
  token: string;
  expire: number;
  user: WudongUserProfile;
}

export interface WudongUserProfile {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  status: string;
}

/**
 * C 端鉴权（方案 B：JWT access + 数据库哈希 refresh，本期不加 Redis、
 * refresh 固定 30 天不轮换，登出/注销时撤销）
 */
@Provide()
export class WudongAuthService extends BaseService {
  @InjectEntityModel(WudongUserEntity)
  userEntity: Repository<WudongUserEntity>;

  @InjectEntityModel(WudongRefreshTokenEntity)
  refreshTokenEntity: Repository<WudongRefreshTokenEntity>;

  @Inject()
  userSmsService: UserSmsService;

  @Config('module.user.jwt')
  jwtConfig: {
    secret: string;
    expire: number;
    refreshExpire: number;
  };

  private sha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private maskPhone(phone: string) {
    return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  }

  private toProfile(user: WudongUserEntity): WudongUserProfile {
    return {
      id: String(user.id),
      phone: this.maskPhone(user.phone),
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
    };
  }

  /**
   * 发送短信验证码：仅打印到后端控制台，不接入真实短信平台
   */
  async sendSmsCode(phone: string) {
    if (!PHONE_RE.test(phone)) {
      throw new CoolCommException('请输入正确的手机号');
    }
    await this.userSmsService.sendSms(phone);
    return '验证码已发送，请查看后端控制台';
  }

  /**
   * 校验验证码通过后，按手机号查/建用户
   */
  private async ensureUserByPhone(phone: string) {
    let user = await this.userEntity.findOneBy({ phone });
    if (!user) {
      user = await this.userEntity.save(
        this.userEntity.create({
          phone,
          name: this.maskPhone(phone),
          passwordHash: '',
          avatar: '',
          bio: '',
          status: 'ENABLED',
        })
      );
    }
    if (user.status !== 'ENABLED') {
      throw new CoolCommException('账号已被禁用，请联系平台处理');
    }
    return user;
  }

  private async issueAccessToken(user: WudongUserEntity) {
    const { secret, expire } = this.jwtConfig;
    return jwt.sign(
      {
        id: String(user.id),
        typ: 'access',
      },
      secret,
      {
        expiresIn: expire,
        jwtid: randomUUID(),
        subject: String(user.id),
      }
    );
  }

  private async createRefreshToken(user: WudongUserEntity) {
    const { refreshExpire } = this.jwtConfig;
    // 令牌本体即 jti，库里只落 sha256 哈希
    const token = randomBytes(32).toString('base64url');
    await this.refreshTokenEntity.insert({
      userId: String(user.id),
      jti: token,
      tokenHash: this.sha256(token),
      expiresAt: new Date(Date.now() + refreshExpire * 1000),
    });
    return token;
  }

  /**
   * 登录成功：签发 access + 新 refresh 会话
   */
  private async issueLoginResult(user: WudongUserEntity) {
    const { expire, refreshExpire } = this.jwtConfig;
    return {
      token: await this.issueAccessToken(user),
      expire,
      refreshToken: await this.createRefreshToken(user),
      refreshExpire,
      user: this.toProfile(user),
    } as WudongAuthResult;
  }

  /**
   * 短信验证码登录：验证通过后自动建号（不存在则创建）
   */
  async smsLogin(phone: string, smsCode: string) {
    if (!PHONE_RE.test(phone)) {
      throw new CoolCommException('请输入正确的手机号');
    }
    const check = await this.userSmsService.checkCode(phone, smsCode);
    if (!check) {
      throw new CoolCommException('验证码错误');
    }
    const user = await this.ensureUserByPhone(phone);
    return this.issueLoginResult(user);
  }

  /**
   * 注册/完善资料：验证码通过后自动建号，随后补昵称与密码。
   * 已存在账号时等价于“设置资料与密码”。
   */
  async register(
    phone: string,
    smsCode: string,
    name: string,
    password: string
  ) {
    if (!PHONE_RE.test(phone)) {
      throw new CoolCommException('请输入正确的手机号');
    }
    if (!PASSWORD_RE.test(password)) {
      throw new CoolCommException('密码需 8-20 位，且同时包含字母与数字');
    }
    const check = await this.userSmsService.checkCode(phone, smsCode);
    if (!check) {
      throw new CoolCommException('验证码错误');
    }
    const user = await this.ensureUserByPhone(phone);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const nickName = (name || '').trim();
    if (nickName) {
      user.name = nickName;
    }
    user.passwordHash = passwordHash;
    await this.userEntity.update(
      { id: String(user.id) },
      {
        name: user.name,
        passwordHash,
      }
    );
    return this.issueLoginResult(user);
  }

  /**
   * 密码登录：bcrypt 校验；未设置密码视为账号或密码错误
   */
  async passwordLogin(phone: string, password: string) {
    if (!PHONE_RE.test(phone) || !password) {
      throw new CoolCommException('账号或密码错误');
    }
    const user = await this.userEntity.findOneBy({ phone });
    if (!user || !user.passwordHash || user.status !== 'ENABLED') {
      throw new CoolCommException('账号或密码错误');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new CoolCommException('账号或密码错误');
    }
    return this.issueLoginResult(user);
  }

  /**
   * 刷新 access：refresh 固定 30 天，不轮换；过期/已撤销则要求重新登录
   */
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new CoolCommException('登录已过期，请重新登录');
    }
    const row = await this.refreshTokenEntity.findOneBy({
      jti: refreshToken,
    });
    if (
      !row ||
      row.revokedAt ||
      row.expiresAt.getTime() <= Date.now() ||
      this.sha256(refreshToken) !== row.tokenHash
    ) {
      throw new CoolCommException('登录已过期，请重新登录');
    }
    const user = await this.userEntity.findOneBy({
      id: String(row.userId),
    });
    if (!user || user.status !== 'ENABLED') {
      throw new CoolCommException('账号已被禁用，请联系平台处理');
    }
    return {
      token: await this.issueAccessToken(user),
      expire: this.jwtConfig.expire,
      user: this.toProfile(user),
    } as WudongRefreshResult;
  }

  /**
   * 登出：按令牌撤销对应会话
   */
  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const row = await this.refreshTokenEntity.findOneBy({
      jti: refreshToken,
    });
    if (row && !row.revokedAt) {
      await this.refreshTokenEntity.update(
        { jti: refreshToken },
        { revokedAt: new Date() }
      );
    }
  }

  /**
   * 当前用户
   */
  async me(userId: string) {
    const user = await this.userEntity.findOneBy({
      id: String(userId),
    });
    if (!user || user.status !== 'ENABLED') {
      throw new CoolCommException('登录失效，请重新登录');
    }
    return this.toProfile(user);
  }

  /**
   * 更新当前用户资料（昵称/简介）
   */
  async updateProfile(userId: string, name?: string, bio?: string) {
    const user = await this.userEntity.findOneBy({
      id: String(userId),
    });
    if (!user || user.status !== 'ENABLED') {
      throw new CoolCommException('登录失效，请重新登录');
    }
    const updates: { name?: string; bio?: string } = {};
    if (name !== undefined) {
      updates.name = (name || '').trim().slice(0, 64);
    }
    if (bio !== undefined) {
      updates.bio = (bio || '').trim().slice(0, 255);
    }
    if (Object.keys(updates).length) {
      await this.userEntity.update(
        { id: String(user.id) },
        { ...updates }
      );
      if (updates.name !== undefined) user.name = updates.name;
      if (updates.bio !== undefined) user.bio = updates.bio;
    }
    return this.toProfile(user);
  }
}
