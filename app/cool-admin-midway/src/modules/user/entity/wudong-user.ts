import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * C 端用户（对应 scripts/sql/wudong_schema.sql 1.1 wudong_common_user）
 * 表结构由 DDL 冻结管理，TypeORM 不做同步，避免误改既有表。
 */
@Entity({
  database: 'wudong',
  name: 'wudong_common_user',
  synchronize: false,
})
export class WudongUserEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    unsigned: true,
    comment: 'ID',
  })
  id: string;

  @Index({ unique: true })
  @Column({
    name: 'phone',
    length: 11,
    comment: '手机号，登录凭证',
  })
  phone: string;

  @Column({
    name: 'password_hash',
    length: 100,
    default: '',
    comment: 'bcrypt 哈希，验证码注册用户可为空串',
  })
  passwordHash: string;

  @Column({
    name: 'name',
    length: 64,
    default: '',
    comment: '昵称',
  })
  name: string;

  @Column({
    name: 'avatar',
    length: 500,
    default: '',
    comment: '头像 URL',
  })
  avatar: string;

  @Column({
    name: 'bio',
    length: 255,
    default: '',
    comment: '个人简介',
  })
  bio: string;

  @Column({
    name: 'status',
    length: 16,
    default: 'ENABLED',
    comment: 'ENABLED 启用 / DISABLED 禁用(禁言)',
  })
  status: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date;
}
