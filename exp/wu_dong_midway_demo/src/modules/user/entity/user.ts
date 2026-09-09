import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * C端用户（表 wudong_common_user）
 * 与 scripts/sql/wudong_schema.sql 1.1 节保持一致
 */
@Entity('wudong_common_user')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** 手机号，登录凭证 */
  @Column({ type: 'varchar', length: 11 })
  phone: string;

  /** bcrypt 哈希，验证码注册用户可为空串 */
  @Column({ type: 'varchar', length: 100, default: '' })
  password_hash: string;

  /** 昵称 */
  @Column({ type: 'varchar', length: 64, default: '' })
  name: string;

  /** 头像 URL */
  @Column({ type: 'varchar', length: 500, default: '' })
  avatar: string;

  /** 个人简介 */
  @Column({ type: 'varchar', length: 255, default: '' })
  bio: string;

  /** ENABLED 启用 / DISABLED 禁用(禁言) */
  @Column({ type: 'varchar', length: 16, default: 'ENABLED' })
  status: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deleted_at: Date;
}
