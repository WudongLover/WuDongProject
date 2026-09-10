import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * C 端刷新令牌（对应 scripts/sql/wudong_schema.sql 1.2 wudong_common_refresh_token）
 * 只存 sha256 哈希；本期固定 30 天不轮换，登出时置 revoked_at 撤销。
 */
@Entity({
  database: 'wudong',
  name: 'wudong_common_refresh_token',
  synchronize: false,
})
export class WudongRefreshTokenEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    unsigned: true,
    comment: 'ID',
  })
  id: string;

  @Index()
  @Column({
    name: 'user_id',
    type: 'bigint',
    unsigned: true,
    comment: 'wudong_common_user.id',
  })
  userId: string;

  @Index({ unique: true })
  @Column({
    name: 'jti',
    length: 64,
    comment: '刷新令牌唯一标识（令牌本体）',
  })
  jti: string;

  @Column({
    name: 'token_hash',
    length: 128,
    comment: '令牌哈希（sha256）',
  })
  tokenHash: string;

  @Column({
    name: 'expires_at',
    type: 'datetime',
  })
  expiresAt: Date;

  @Column({
    name: 'revoked_at',
    type: 'datetime',
    nullable: true,
    comment: '撤销时间（登出/注销）',
  })
  revokedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}
