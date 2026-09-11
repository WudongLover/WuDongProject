/**
 * 【common 模块】文化推文（wudong_common_story）
 * 表字段映射：列对齐 wudong 库（synchronize=false，禁止自动建表）
 * 内容由管理端编写维护，C 端只读 PUBLISHED；JSON 列 mysql2 默认返回已解析数组
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 推文状态（与 DDL 字面量一致） */
export type StoryStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';

/** 所属模块：衣 / 食 / 住 / 行（与前端 CultureModule 字面量一致） */
export type StoryModule = 'YI' | 'SHI' | 'ZHU' | 'XING';

/** 尾部导流项（前端 CultureStoryLink） */
export interface StoryLink {
  label: string;
  to: string;
}

@Entity('wudong_common_story')
export class StoryEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'module', type: 'varchar', length: 8, comment: 'YI 衣 / SHI 食 / ZHU 住 / XING 行' })
  module: StoryModule;

  /** 路由 id，全站唯一（前端 CultureStory.id） */
  @Column({ name: 'slug', type: 'varchar', length: 64, comment: '路由 id，全站唯一' })
  slug: string;

  @Column({ name: 'eyebrow', type: 'varchar', length: 64, default: '', comment: '英文小标' })
  eyebrow: string;

  @Column({ name: 'title', type: 'varchar', length: 128 })
  title: string;

  @Column({ name: 'summary', type: 'varchar', length: 500, default: '' })
  summary: string;

  @Column({ name: 'cover', type: 'varchar', length: 500, default: '' })
  cover: string;

  @Column({ name: 'quote', type: 'varchar', length: 255, default: '', comment: '一句话引文' })
  quote: string;

  @Column({ name: 'paragraphs', type: 'json', nullable: true, comment: '正文段落数组' })
  paragraphs: string[];

  @Column({ name: 'links', type: 'json', nullable: true, comment: '尾部导流 [{label,to}]' })
  links: StoryLink[];

  @Column({ name: 'sort', type: 'int', unsigned: true, default: 0, comment: '模块内展示顺序，小者在前' })
  sort: number;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'PUBLISHED' })
  status: StoryStatus;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt: Date | null;

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
