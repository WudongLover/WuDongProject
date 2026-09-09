/**
 * 【m5-community 模块】帖子（wudong_m5_post）
 * mapper 层：数据访问（封装 Repository / SQL），Service 只依赖本文件
 * 返回 raw 行/原始数据，不组装 VO（VO 组装在 service 层）
 */
import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In, IsNull } from 'typeorm';
import { PostEntity, PostStatus } from '../entity/post_entity';
import { CommentEntity } from '../entity/comment_entity';
import { PostLikeEntity } from '../entity/post_like_entity';
import { UserEntity } from '../entity/user_entity';

/** 帖子查询行（含作者昵称头像，作者缺失时为 null，由 service 兜底） */
export interface PostRow {
  id: number;
  userId: number;
  title: string;
  content: string | null;
  images: string[] | null;
  topic: string;
  place: string;
  likes: number;
  collects: number;
  views: number;
  status: PostStatus;
  publishedAt: Date | null;
  authorName: string | null;
  authorAvatar: string | null;
  authorBio: string | null;
}

/** 评论查询行（含评论作者昵称头像 + 被回复人昵称） */
export interface CommentRow {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  publishedAt: Date | null;
  authorName: string | null;
  authorAvatar: string | null;
  replyUserName: string | null;
}

/** 待插入的帖子数据（service 已校验） */
export interface PostInsert {
  userId: number;
  title: string;
  content: string;
  images: string[];
  topic: string;
  place: string;
  status: PostStatus;
  publishedAt: Date;
}

@Provide()
export class PostMapper {
  @InjectDataSource('default')
  dataSource: DataSource;

  /** 列表：status=PASSED 且未删除，可选 topic 精确过滤（带 # 前缀），sort=hot 按点赞 / 默认按发布时间 */
  findFeed(topic?: string, sort?: 'hot' | 'new'): Promise<PostRow[]> {
    const qb = this.dataSource
      .getRepository(PostEntity)
      .createQueryBuilder('p')
      .leftJoin(UserEntity, 'u', 'u.id = p.user_id AND u.deleted_at IS NULL')
      .select('p.id', 'id')
      .addSelect('p.user_id', 'userId')
      .addSelect('p.title', 'title')
      .addSelect('p.content', 'content')
      .addSelect('p.images', 'images')
      .addSelect('p.topic', 'topic')
      .addSelect('p.place', 'place')
      .addSelect('p.likes', 'likes')
      .addSelect('p.collects', 'collects')
      .addSelect('p.views', 'views')
      .addSelect('p.status', 'status')
      .addSelect('p.published_at', 'publishedAt')
      .addSelect('u.name', 'authorName')
      .addSelect('u.avatar', 'authorAvatar')
      .addSelect('u.bio', 'authorBio')
      .where('p.status = :status', { status: 'PASSED' })
      .andWhere('p.deleted_at IS NULL');
    if (topic) {
      qb.andWhere('p.topic = :topic', { topic });
    }
    if (sort === 'hot') {
      qb.orderBy('p.likes', 'DESC');
    } else {
      qb.orderBy('p.published_at', 'DESC');
    }
    return qb.getRawMany<PostRow>();
  }

  /** 单条帖子（含作者），未删除即可（详情不限制状态，便于作者查看审核中帖子） */
  findPostById(id: number): Promise<PostRow | null> {
    return this.dataSource
      .getRepository(PostEntity)
      .createQueryBuilder('p')
      .leftJoin(UserEntity, 'u', 'u.id = p.user_id AND u.deleted_at IS NULL')
      .select('p.id', 'id')
      .addSelect('p.user_id', 'userId')
      .addSelect('p.title', 'title')
      .addSelect('p.content', 'content')
      .addSelect('p.images', 'images')
      .addSelect('p.topic', 'topic')
      .addSelect('p.place', 'place')
      .addSelect('p.likes', 'likes')
      .addSelect('p.collects', 'collects')
      .addSelect('p.views', 'views')
      .addSelect('p.status', 'status')
      .addSelect('p.published_at', 'publishedAt')
      .addSelect('u.name', 'authorName')
      .addSelect('u.avatar', 'authorAvatar')
      .addSelect('u.bio', 'authorBio')
      .where('p.id = :id', { id })
      .andWhere('p.deleted_at IS NULL')
      .getRawOne<PostRow>();
  }

  /** 评论列表（PASSED 且未删除），含作者昵称头像与被回复人昵称，按时间升序 */
  findCommentsByPost(postId: number): Promise<CommentRow[]> {
    return this.dataSource
      .getRepository(CommentEntity)
      .createQueryBuilder('c')
      .leftJoin(UserEntity, 'u', 'u.id = c.user_id AND u.deleted_at IS NULL')
      .leftJoin(UserEntity, 'ru', 'ru.id = c.reply_to_user_id')
      .select('c.id', 'id')
      .addSelect('c.post_id', 'postId')
      .addSelect('c.parent_id', 'parentId')
      .addSelect('c.content', 'content')
      .addSelect('c.published_at', 'publishedAt')
      .addSelect('u.name', 'authorName')
      .addSelect('u.avatar', 'authorAvatar')
      .addSelect('ru.name', 'replyUserName')
      .where('c.post_id = :postId', { postId })
      .andWhere('c.status = :status', { status: 'PASSED' })
      .andWhere('c.deleted_at IS NULL')
      .orderBy('c.published_at', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .getRawMany<CommentRow>();
  }

  /** 当前用户点赞过的帖子 id 集合（批量判 liked，避免 N+1） */
  async findLikedPostIds(userId: number, postIds: number[]): Promise<Set<number>> {
    if (!postIds.length) {
      return new Set();
    }
    const rows = await this.dataSource.getRepository(PostLikeEntity).find({
      where: { userId, postId: In(postIds) },
      select: ['postId'],
    });
    return new Set(rows.map((r) => r.postId));
  }

  /** 阅读数原子自增 */
  incViews(id: number): Promise<void> {
    return this.dataSource
      .getRepository(PostEntity)
      .increment({ id }, 'views', 1)
      .then(() => void 0);
  }

  /** 点赞数 +1（下单带库内自增，保持原子） */
  incLikes(id: number): Promise<void> {
    return this.dataSource.query('UPDATE wudong_m5_post SET likes = likes + 1 WHERE id = ?', [id]);
  }

  /** 点赞数 -1（下限 0） */
  decLikes(id: number): Promise<void> {
    return this.dataSource.query('UPDATE wudong_m5_post SET likes = GREATEST(likes - 1, 0) WHERE id = ?', [id]);
  }

  /**
   * 点赞切换（事务）：点赞记录存在 → 删除 + 计数-1（下限0）；不存在 → 插入 + 计数+1
   * uk_post_user 唯一键兜底并发（重复插入冲突时回退为已点赞状态）
   */
  async toggleLike(postId: number, userId: number): Promise<{ postExists: boolean; liked: boolean; likes: number }> {
    return this.dataSource.transaction(async (em) => {
      const post = await em.findOne(PostEntity, {
        where: { id: postId, status: 'PASSED' as PostStatus, deletedAt: IsNull() },
      });
      if (!post) {
        return { postExists: false, liked: false, likes: 0 };
      }
      const like = await em.findOne(PostLikeEntity, { where: { postId, userId } });
      let liked: boolean;
      try {
        if (like) {
          await em.delete(PostLikeEntity, { postId, userId });
          await em.query('UPDATE wudong_m5_post SET likes = GREATEST(likes - 1, 0) WHERE id = ?', [postId]);
          liked = false;
        } else {
          await em.insert(PostLikeEntity, { postId, userId });
          await em.query('UPDATE wudong_m5_post SET likes = likes + 1 WHERE id = ?', [postId]);
          liked = true;
        }
      } catch (err) {
        // ER_DUP_ENTRY：并发重复点击，视为已点赞
        if (err?.errno === 1062) {
          liked = true;
        } else {
          throw err;
        }
      }
      const fresh = await em.findOne(PostEntity, { where: { id: postId } });
      return { postExists: true, liked, likes: Number(fresh?.likes ?? post.likes) };
    });
  }

  /** 新增帖子，返回插入主键 */
  async createPost(data: PostInsert): Promise<number> {
    const result = await this.dataSource.getRepository(PostEntity).insert({
      userId: data.userId,
      title: data.title,
      content: data.content,
      images: data.images,
      topic: data.topic,
      place: data.place,
      status: data.status,
      publishedAt: data.publishedAt,
    });
    return this.extractInsertId(result.identifiers?.[0]);
  }

  /** 新增评论，返回插入主键 */
  async createComment(data: {
    postId: number;
    userId: number;
    parentId: number | null;
    replyToUserId: number | null;
    content: string;
    publishedAt: Date;
  }): Promise<number> {
    const result = await this.dataSource.getRepository(CommentEntity).insert(data);
    return this.extractInsertId(result.identifiers?.[0]);
  }

  /** 父评论校验：存在、未删除、属于同一帖子 */
  findCommentById(id: number): Promise<CommentEntity | null> {
    return this.dataSource.getRepository(CommentEntity).findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /** 帖子是否存在（点赞/评论前置校验，仅 PASSED+未删除可交互） */
  findActivePost(id: number): Promise<PostEntity | null> {
    return this.dataSource.getRepository(PostEntity).findOne({
      where: { id, status: 'PASSED' as PostStatus, deletedAt: IsNull() },
    });
  }

  /** 读取单用户（作者兜底展示） */
  findUser(userId: number): Promise<UserEntity | null> {
    return this.dataSource.getRepository(UserEntity).findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  /** 逻辑删除帖子（设置 deleted_at） */
  softDeletePost(id: number): Promise<boolean> {
    return this.dataSource
      .getRepository(PostEntity)
      .update({ id, deletedAt: IsNull() }, { deletedAt: new Date() })
      .then((r) => (r.affected ?? 0) > 0);
  }

  /** 逻辑删除评论（设置 deleted_at） */
  softDeleteComment(id: number, postId: number): Promise<boolean> {
    return this.dataSource
      .getRepository(CommentEntity)
      .update({ id, postId, deletedAt: IsNull() }, { deletedAt: new Date() })
      .then((r) => (r.affected ?? 0) > 0);
  }

  /** 插入结果主键提取（insertId 可能为 string/number，统一转 Number） */
  private extractInsertId(identifier: { id?: unknown } | undefined): number {
    const id = identifier?.id;
    if (id == null) {
      throw new Error('insert 未返回主键');
    }
    return Number(id);
  }
}
