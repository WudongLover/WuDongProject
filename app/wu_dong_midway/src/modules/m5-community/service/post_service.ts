/**
 * 【m5-community 模块】帖子（wudong_m5_post）
 * service 层：业务逻辑 + VO 组装（VO 结构对齐前端 types.ts：Post / PostComment / PostAuthor）
 * 跨模块只经对方 Service（当前作者信息临时直读，见 entity/user_entity.ts 注释）
 */
import { Inject, Provide } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PostMapper, PostRow, CommentRow } from '../mapper/post_mapper';
import { ApiError } from '../error/api_error';

/** PostAuthor（前端 types.ts，id 为字符串） */
export interface PostAuthorVo {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

/** PostComment（前端 types.ts） */
export interface PostCommentVo {
  id: string;
  user: string;
  avatar: string;
  content: string;
  date: string;
  replies?: { user: string; content: string; date: string }[];
}

/** Post（前端 types.ts） */
export interface PostVo {
  id: string;
  title: string;
  content: string;
  images: string[];
  author: PostAuthorVo;
  topic?: string;
  place?: string;
  likes: number;
  collects: number;
  views: number;
  date: string;
  liked?: boolean;
  comments: PostCommentVo[];
}

/** 发布/评论入参（controller 透传 body） */
export interface PublishBody {
  title?: unknown;
  content?: unknown;
  topic?: unknown;
  place?: unknown;
  images?: unknown;
}

export interface CommentBody {
  content?: unknown;
  parentId?: unknown;
}

@Provide()
export class PostService {
  @Inject()
  postMapper: PostMapper;

  /**
   * 当前用户 id：
   * 请求头 X-User-Id 优先，缺省回退 env DEMO_USER_ID（默认 1）
   * ❗待登录鉴权模块（src/modules/user）实现后，改为从 token/会话解析并移除兜底
   */
  currentUserId(ctx: Context): number {
    const raw = ctx.headers['x-user-id'];
    const header = Array.isArray(raw) ? raw[0] : raw;
    const headerId = Number(header);
    if (Number.isFinite(headerId) && headerId > 0) {
      return headerId;
    }
    const fallback = Number(process.env.DEMO_USER_ID || 1);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 1;
  }

  /** 列表：status=PASSED 且未删除；comments 恒 []（契约），liked 按当前用户批量填充 */
  async list(ctx: Context, topic?: string, sort?: string): Promise<PostVo[]> {
    const rows = await this.postMapper.findFeed(topic, sort === 'hot' ? 'hot' : 'new');
    const userId = this.currentUserId(ctx);
    const likedSet = await this.postMapper.findLikedPostIds(
      userId,
      rows.map((r) => r.id)
    );
    return rows.map((r) => this.toPostVo(r, likedSet.has(r.id)));
  }

  /** 详情：阅读数原子 +1；评论按 parent_id 组装楼中楼 */
  async detail(ctx: Context, id: number): Promise<PostVo> {
    const row = await this.postMapper.findPostById(id);
    if (!row) {
      throw new ApiError(1003, '资源不存在', 404);
    }
    await this.postMapper.incViews(row.id);
    row.views += 1;

    const userId = this.currentUserId(ctx);
    const likedSet = await this.postMapper.findLikedPostIds(userId, [row.id]);
    const vo = this.toPostVo(row, likedSet.has(row.id));
    vo.comments = this.buildCommentTree(await this.postMapper.findCommentsByPost(row.id));
    return vo;
  }

  /** 获取帖子评论列表（单独接口，不含帖子详情） */
  async listComments(ctx: Context, postId: number): Promise<PostCommentVo[]> {
    const post = await this.postMapper.findActivePost(postId);
    if (!post) {
      throw new ApiError(1003, '资源不存在', 404);
    }
    return this.buildCommentTree(await this.postMapper.findCommentsByPost(postId));
  }

  /** 发布游记：校验后入库（status 取 DDL 默认 PASSED，立即上架；走 PENDING 审核流后续再改） */
  async create(ctx: Context, body: PublishBody): Promise<PostVo> {
    const data = this.validatePublish(body);
    const id = await this.postMapper.createPost({
      userId: this.currentUserId(ctx),
      title: data.title,
      content: data.content,
      images: data.images,
      topic: data.topic,
      place: data.place,
      status: 'PASSED',
      publishedAt: new Date(),
    });
    const row = await this.postMapper.findPostById(id);
    if (!row) {
      throw new ApiError(1000, '游记创建失败，请重试', 500);
    }
    return this.toPostVo(row, false);
  }

  /** 点赞切换：返回最新 { liked, likes } */
  async toggleLike(ctx: Context, id: number): Promise<{ liked: boolean; likes: number }> {
    const userId = this.currentUserId(ctx);
    const result = await this.postMapper.toggleLike(id, userId);
    if (!result.postExists) {
      throw new ApiError(1003, '资源不存在', 404);
    }
    return { liked: result.liked, likes: result.likes };
  }

  /** 新增评论（支持 parentId 楼中楼），返回该帖完整评论数组（契约） */
  async addComment(ctx: Context, postId: number, body: CommentBody): Promise<PostCommentVo[]> {
    if (typeof body?.content !== 'string' || !body.content.trim()) {
      throw new ApiError(1004, '评论内容不能为空', 400);
    }
    const post = await this.postMapper.findActivePost(postId);
    if (!post) {
      throw new ApiError(1003, '资源不存在', 404);
    }

    let parentId: number | null = null;
    let replyToUserId: number | null = null;
    if (body.parentId != null) {
      const pid = Number(body.parentId);
      if (!Number.isFinite(pid) || pid <= 0) {
        throw new ApiError(1000, '参数错误', 400);
      }
      const parent = await this.postMapper.findCommentById(pid);
      if (!parent || Number(parent.postId) !== postId) {
        throw new ApiError(1003, '回复的评论不存在', 404);
      }
      parentId = pid;
      replyToUserId = parent.userId;
    }

    await this.postMapper.createComment({
      postId,
      userId: this.currentUserId(ctx),
      parentId,
      replyToUserId,
      content: body.content.trim(),
      publishedAt: new Date(),
    });
    return this.buildCommentTree(await this.postMapper.findCommentsByPost(postId));
  }

  /* ---------- 私有：校验 / VO ---------- */

  /** 发布校验：title 非空≤128、content 非空、images 必须 string[] */
  private validatePublish(body: PublishBody): {
    title: string;
    content: string;
    topic: string;
    place: string;
    images: string[];
  } {
    if (!body || typeof body !== 'object') {
      throw new ApiError(1000, '参数错误', 400);
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const place = typeof body.place === 'string' ? body.place.trim() : '';
    const images = body.images ?? [];

    if (!title || title.length > 128) {
      throw new ApiError(1000, '标题不能为空且不超过 128 字', 400);
    }
    if (!content) {
      throw new ApiError(1000, '正文不能为空', 400);
    }
    if (topic.length > 64) {
      throw new ApiError(1000, '话题过长', 400);
    }
    if (place.length > 128) {
      throw new ApiError(1000, '打卡地点过长', 400);
    }
    if (!Array.isArray(images) || images.some((i) => typeof i !== 'string')) {
      throw new ApiError(1000, '配图必须为 URL 字符串数组', 400);
    }
    return { title, content, topic, place, images: images as string[] };
  }

  /** 评论列表 → 楼中楼树（replies 挂在根评论下，回复人昵称取 reply_to_user） */
  private buildCommentTree(rows: CommentRow[]): PostCommentVo[] {
    const roots: PostCommentVo[] = [];
    const children = new Map<number, { user: string; content: string; date: string }[]>();
    for (const row of rows) {
      if (row.parentId == null) {
        roots.push(this.toCommentVo(row));
      } else {
        const list = children.get(Number(row.parentId)) ?? [];
        list.push({
          user: row.replyUserName ?? '',
          content: row.content,
          date: this.fmtDate(row.publishedAt),
        });
        children.set(Number(row.parentId), list);
      }
    }
    return roots.map((root) => {
      const replies = children.get(Number(root.id));
      return replies && replies.length ? { ...root, replies } : root;
    });
  }

  private toPostVo(row: PostRow, liked: boolean): PostVo {
    return {
      id: String(row.id),
      title: row.title,
      content: row.content ?? '',
      images: row.images ?? [],
      author: {
        id: String(row.userId),
        name: row.authorName ?? '',
        avatar: row.authorAvatar ?? '',
        bio: row.authorBio ?? '',
      },
      topic: row.topic || undefined,
      place: row.place || undefined,
      likes: Number(row.likes),
      collects: Number(row.collects),
      views: Number(row.views),
      date: this.fmtDate(row.publishedAt),
      liked,
      comments: [],
    };
  }

  private toCommentVo(row: CommentRow): PostCommentVo {
    return {
      id: String(row.id),
      user: row.authorName ?? '',
      avatar: row.authorAvatar ?? '',
      content: row.content,
      date: this.fmtDate(row.publishedAt),
    };
  }

  /** published_at → 'YYYY-MM-DD'（本地时区，避免 UTC 跨天） */
  private fmtDate(d: Date | null | undefined): string {
    if (!d) {
      return '';
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
