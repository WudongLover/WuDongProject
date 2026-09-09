import {
  Config,
  InjectClient,
  Logger,
  Provide,
  ILogger,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { randomInt } from 'crypto';

/**
 * 短信服务：演示环境只把验证码打印到后端控制台，不接入真实短信平台。
 */
@Provide()
export class UserSmsService extends BaseService {
  // 获得模块的配置信息
  @Config('module.user.sms')
  config;

  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  @Logger()
  logger: ILogger;

  /**
   * 发送验证码
   * @param phone
   */
  async sendSms(phone) {
    const throttleKey = `sms:throttle:${phone}`;
    if (await this.midwayCache.get(throttleKey)) {
      throw new CoolCommException('发送过于频繁，请稍后再试');
    }
    // 随机 6 位验证码，仅打印到控制台（未实际发送）
    const code = String(randomInt(100000, 1000000));
    this.logger.info(
      `[MockSMS] 发送验证码 phone=${phone} code=${code}（演示环境仅打印到后端控制台）`
    );
    this.midwayCache.set(`sms:${phone}`, code, this.config.timeout * 1000);
    this.midwayCache.set(throttleKey, 1, this.config.throttle * 1000);
  }

  /**
   * 验证验证码
   * @param phone
   * @param code
   * @returns
   */
  async checkCode(phone, code) {
    const cacheCode = await this.midwayCache.get(`sms:${phone}`);
    if (code && cacheCode == code) {
      return true;
    }
    return false;
  }
}
