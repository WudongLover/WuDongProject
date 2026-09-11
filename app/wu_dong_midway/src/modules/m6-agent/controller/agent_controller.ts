/**
 * 【m6-agent 模块】智能体对话接口
 * 路由前缀 /api/v1/agent
 */
import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PassThrough } from 'stream';
import { AgentService } from '../service/agent_service';
import { SessionService } from '../service/session_service';
import { ChatSendBody } from '../dto/chat_dto';

@Controller('/api/v1/agent')
export class AgentController {
  @Inject()
  ctx: Context;

  @Inject()
  agentService: AgentService;

  @Inject()
  sessionService: SessionService;

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }

  private fail(message: string, code = 1) {
    return { code, message, data: null };
  }

  /** 检查智能体是否可用（前端用于判断是否展示对话入口） */
  @Get('/status')
  status() {
    return this.ok({ available: this.agentService.isAvailable() });
  }

  /** 发送消息，获取智能体回复（非流式，等待完整回复后返回） */
  @Post('/chat')
  async chat(@Body() body: ChatSendBody) {
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return this.fail('消息内容不能为空');
    }
    if (content.length > 1000) {
      return this.fail('消息内容过长，请控制在 1000 字以内');
    }

    const sessionId = body?.sessionId ? Number(body.sessionId) || null : null;
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId : '';

    // 从 ctx 中获取登录用户 id（AuthMiddleware 已解析，未登录为 null）
    const userId = (this.ctx as any).user?.id ?? null;

    if (!this.agentService.isAvailable()) {
      return this.fail('智能体暂未启用，请稍后再试');
    }

    try {
      const result = await this.agentService.chat(content, sessionId, userId, deviceId);
      return this.ok(result);
    } catch (err: any) {
      this.ctx.logger.error('[m6-agent] chat error: %s', err?.message || err);
      return this.fail('智能体服务暂时不可用，请稍后再试');
    }
  }

  /** 发送消息，SSE 流式返回智能体回复（事件序列 meta → delta* → end） */
  @Post('/chat/stream')
  async chatStream(@Body() body: ChatSendBody) {
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return this.fail('消息内容不能为空');
    }
    if (content.length > 1000) {
      return this.fail('消息内容过长，请控制在 1000 字以内');
    }
    if (!this.agentService.isAvailable()) {
      return this.fail('智能体暂未启用，请稍后再试');
    }

    const sessionId = body?.sessionId ? Number(body.sessionId) || null : null;
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId : '';
    const userId = (this.ctx as any).user?.id ?? null;

    const sse = (event: string, data: unknown) =>
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.ctx.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    this.ctx.status = 200;

    const stream = new PassThrough();
    this.ctx.body = stream;

    // 客户端断开时停止生成
    let closed = false;
    const onClose = () => {
      closed = true;
    };
    this.ctx.res.on('close', onClose);

    const write = (chunk: string) => {
      if (!closed) {
        stream.write(chunk);
      }
    };

    try {
      const events = this.agentService.chatStream(content, sessionId, userId, deviceId);
      for await (const ev of events) {
        if (closed) break;
        write(sse(ev.event, ev.data));
      }
    } catch (err: any) {
      this.ctx.logger.error('[m6-agent] chat stream error: %s', err?.message || err);
      write(sse('error', { message: '智能体服务暂时不可用，请稍后再试' }));
    } finally {
      this.ctx.res.removeListener('close', onClose);
      if (!closed) {
        stream.end();
      }
    }
  }

  /** 获取当前用户/设备的会话列表 */
  @Get('/sessions')
  async sessions() {
    const userId = (this.ctx as any).user?.id ?? null;
    const deviceId = typeof this.ctx.query.deviceId === 'string' ? this.ctx.query.deviceId : '';
    const list = await this.sessionService.listSessions(userId, deviceId);
    return this.ok(
      list.map((s) => ({
        id: String(s.id),
        title: s.title,
        messageCount: s.messageCount,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    );
  }

  /** 获取会话历史消息 */
  @Get('/sessions/:id/messages')
  async messages(@Query('id') id: string) {
    const sessionId = Number(id);
    if (!sessionId || sessionId <= 0) {
      return this.fail('无效的会话 id');
    }
    const userId = (this.ctx as any).user?.id ?? null;
    const deviceId = typeof this.ctx.query.deviceId === 'string' ? this.ctx.query.deviceId : '';

    const owned = await this.sessionService.verifyOwnership(sessionId, userId, deviceId);
    if (!owned) {
      return this.fail('无权访问该会话');
    }

    const history = await this.sessionService.getHistory(sessionId, 50);
    return this.ok(history);
  }
}
