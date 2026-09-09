/**
 * 【m5-community 模块】C端用户（wudong_common_user）
 * 临时只读实体：为帖子/评论作者信息取昵称头像，仅做查询不写入。
 * ❗用户鉴权模块（src/modules/user）实现后：删除本实体，改为注入 user 模块 Service（模块边界约定）。
 */
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('wudong_common_user')
export class UserEntity {
  @PrimaryColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'phone', type: 'varchar', length: 11 })
  phone: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 100 })
  passwordHash: string;

  @Column({ name: 'name', type: 'varchar', length: 64, default: '' })
  name: string;

  @Column({ name: 'avatar', type: 'varchar', length: 500, default: '' })
  avatar: string;

  @Column({ name: 'bio', type: 'varchar', length: 255, default: '' })
  bio: string;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'ENABLED' })
  status: string;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
