import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('wudong_common_user')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: string;
  @Column({ type: 'varchar', length: 11, unique: true }) phone: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 100, default: '' }) passwordHash: string;
  @Column({ type: 'varchar', length: 64, default: '' }) name: string;
  @Column({ type: 'varchar', length: 500, default: '' }) avatar: string;
  @Column({ type: 'varchar', length: 255, default: '' }) bio: string;
  @Column({ type: 'varchar', length: 16, default: 'ENABLED' }) status: string;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt: Date | null;
}
