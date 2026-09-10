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

/** 评论回复（扁平挂在根评论下） */
export interface PostReplyVo {
  id: string;
  userId: string;
  user: string;
  avatar: string;
  content: string;
  date: string;
  replyToUser?: string;
}

/** PostComment（前端 types.ts） */
export interface PostCommentVo {
  id: string;
  userId: string;
  user: string;
  avatar: string;
  content: string;
  date: string;
  replies?: PostReplyVo[];
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
   * 可选身份：游客/未登录返回 0（列表/详情公开可浏览，liked 恒 false）。
   * 优先级：
   * 1. ctx.userId（AuthMiddleware 校验 Bearer token 后写入，真实身份）
   * 2. X-User-Id 请求头（仅非生产环境，联调兜底）
   * 3. DEMO_USER_ID 环境变量（仅非生产环境）
   */
  currentUserId(ctx: Context): number {
    const authedId = Number((ctx as any).userId);
    if (Number.isFinite(authedId) && authedId > 0) {
      return authedId;
    }
    if (process.env.NODE_ENV !== 'production') {
      const raw = ctx.headers['x-user-id'];
      const header = Array.isArray(raw) ? raw[0] : raw;
      const headerId = Number(header);
      if (Number.isFinite(headerId) && headerId > 0) {
        return headerId;
      }
      const fallback = Number(process.env.DEMO_USER_ID || 1);
      if (Number.isFinite(fallback) && fallback > 0) {
        return fallback;
      }
    }
    return 0;
  }

  /** 必须身份：写操作（发布/点赞/评论/删除）调用，未登录抛 401 */
  requireUserId(ctx: Context): number {
    const id = this.currentUserId(ctx);
    if (!id) {
      throw new ApiError(1001, '未登录', 401);
    }
    return id;
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
      userId: this.requireUserId(ctx),
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
    const userId = this.requireUserId(ctx);
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
      userId: this.requireUserId(ctx),
      parentId,
      replyToUserId,
      content: body.content.trim(),
      publishedAt: new Date(),
    });
    return this.buildCommentTree(await this.postMapper.findCommentsByPost(postId));
  }

  /** 逻辑删除帖子（仅作者可删除） */
  async deletePost(ctx: Context, postId: number): Promise<boolean> {
    const userId = this.requireUserId(ctx);
    const post = await this.postMapper.findPostById(postId);
    if (!post) {
      throw new ApiError(1003, '资源不存在', 404);
    }
    if (Number(post.userId) !== userId) {
      throw new ApiError(403, '无权删除此帖子', 403);
    }
    return this.postMapper.softDeletePost(postId);
  }

  /** 逻辑删除评论（评论作者或帖子作者可删除） */
  async deleteComment(ctx: Context, postId: number, commentId: number): Promise<boolean> {
    const userId = this.requireUserId(ctx);
    const post = await this.postMapper.findActivePost(postId);
    if (!post) {
      throw new ApiError(1003, '资源不存在', 404);
    }
    const comment = await this.postMapper.findCommentById(commentId);
    if (!comment || Number(comment.postId) !== postId) {
      throw new ApiError(1003, '评论不存在', 404);
    }
    const isCommentAuthor = Number(comment.userId) === userId;
    const isPostAuthor = Number(post.userId) === userId;
    if (!isCommentAuthor && !isPostAuthor) {
      throw new ApiError(403, '无权删除此评论', 403);
    }
    return this.postMapper.softDeleteComment(commentId, postId);
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

  /** 评论列表 → 两级拍平（根评论 + 回复列表）
  * 回复沿 parentId 链向上回溯到根，保证三级以上评论不丢失 */
  private buildCommentTree(rows: CommentRow[]): PostCommentVo[] {
    if (!rows.length) {
      return [];
    }
    // 全量索引
    const map = new Map<number, CommentRow>();
    for (const r of rows) {
      map.set(r.id, r);
    }
    // 按发布时间升序排列
    const sorted = [...rows].sort(
      (a, b) =>
        (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0),
    );
    const roots: PostCommentVo[] = [];
    const children = new Map<number, PostReplyVo[]>();

    for (const row of sorted) {
      if (row.parentId == null) {
        roots.push(this.toCommentVo(row));
      } else {
        const rootId = this.backtrackRoot(row.id, map, 10);
        const list = children.get(rootId) ?? [];
        list.push(this.toReplyVo(row));
        children.set(rootId, list);
      }
    }
    return roots.map((root) => {
      const replies = children.get(Number(root.id));
      return replies?.length ? { ...root, replies } : root;
    });
  }

  /** 沿 parentId 向上回溯到根评论（depth 上限防循环） */
  private backtrackRoot(
    id: number,
    map: Map<number, CommentRow>,
    depth: number,
  ): number {
    if (depth <= 0) {
      return id;
    }
    const row = map.get(id);
    if (!row || row.parentId == null) {
      return id;
    }
    return this.backtrackRoot(row.parentId, map, depth - 1);
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
      userId: String(row.userId),
      user: row.authorName ?? '',
      avatar: row.authorAvatar ?? '',
      content: row.content,
      date: this.fmtDate(row.publishedAt),
    };
  }

  private toReplyVo(row: CommentRow): PostReplyVo {
    return {
      id: String(row.id),
      userId: String(row.userId),
      user: row.authorName ?? '',
      avatar: row.authorAvatar ?? '',
      content: row.content,
      date: this.fmtDate(row.publishedAt),
      replyToUser: row.replyUserName ?? undefined,
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
