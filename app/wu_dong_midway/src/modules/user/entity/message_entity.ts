import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MessageType = 'SYSTEM' | 'ORDER' | 'INTERACT';

@Entity('wudong_common_message')
export class MessageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ type: 'varchar', length: 16 })
  type: MessageType;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  @Column({ name: 'is_read', type: 'tinyint', width: 1, default: 0 })
  isRead: number;

  @Column({ name: 'related_type', type: 'varchar', length: 16, nullable: true })
  relatedType: string | null;

  @Column({ name: 'related_id', type: 'varchar', length: 64, nullable: true })
  relatedId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
