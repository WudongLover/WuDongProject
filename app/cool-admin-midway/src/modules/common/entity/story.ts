import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 文化推文（对应 scripts/sql/wudong_schema.sql 1.21 wudong_common_story）
 *
 * 内容由管理端编写维护，C 端（wu_dong_midway common 模块）只读展示。
 * 表结构由 DDL 冻结管理，故指定 database 为 wudong 且 synchronize: false，
 * 避免 TypeORM 在 cool 库建同名空表、或误改线上既有表。
 */
@Entity({
  database: 'wudong',
  name: 'wudong_common_story',
  synchronize: false,
})
export class StoryEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    unsigned: true,
    comment: 'ID',
  })
  id: string;

  @Column({
    name: 'module',
    length: 8,
    comment: '所属模块：YI 衣 / SHI 食 / ZHU 住 / XING 行',
  })
  module: string;

  @Column({
    name: 'slug',
    length: 64,
    comment: '路由 id，全站唯一（C 端详情页 /culture/:id）',
  })
  slug: string;

  @Column({
    name: 'eyebrow',
    length: 64,
    default: '',
    comment: '英文小标（如 YI · SILVER）',
  })
  eyebrow: string;

  @Column({
    name: 'title',
    length: 128,
    comment: '标题',
  })
  title: string;

  @Column({
    name: 'summary',
    length: 500,
    default: '',
    comment: '导语（列表卡片与详情页共用）',
  })
  summary: string;

  @Column({
    name: 'cover',
    length: 500,
    default: '',
    comment: '封面图 URL',
  })
  cover: string;

  @Column({
    name: 'quote',
    length: 255,
    default: '',
    comment: '一句话引文',
  })
  quote: string;

  @Column({
    name: 'paragraphs',
    type: 'json',
    nullable: true,
    comment: '正文段落数组',
  })
  paragraphs: string[];

  @Column({
    name: 'links',
    type: 'json',
    nullable: true,
    comment: '尾部导流 [{label,to}]',
  })
  links: { label: string; to: string }[];

  @Column({
    name: 'sort',
    type: 'int',
    unsigned: true,
    default: 0,
    comment: '模块内展示顺序，小者在前',
  })
  sort: number;

  @Column({
    name: 'status',
    length: 16,
    default: 'PUBLISHED',
    comment: 'DRAFT 草稿 / PUBLISHED 已发布 / OFFLINE 下线',
  })
  status: string;

  @Column({
    name: 'published_at',
    type: 'datetime',
    nullable: true,
    comment: '发布时间',
  })
  publishedAt: Date;

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
    comment: '删除时间',
  })
  deletedAt: Date;
}
