/**
 * 【m6-agent 模块】智能体核心服务
 * 负责 LLM 调用编排：RAG 检索 → Prompt 拼装 → LLM 生成 → 持久化
 */
import { Inject, Provide, Logger } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { RagService } from './rag_service';
import { SessionService } from './session_service';
import { SYSTEM_PROMPT } from '../prompts/system';

/** 对话结果 */
export interface ChatResult {
  sessionId: number;
  reply: string;
  sources: string[];
}

@Provide()
export class AgentService {
  @Inject()
  ragService: RagService;

  @Inject()
  sessionService: SessionService;

  @Logger()
  logger: ILogger;

  /** 检查智能体是否可用（LLM API Key 是否配置） */
  isAvailable(): boolean {
    return !!process.env.LLM_API_KEY && !!process.env.LLM_MODEL_NAME;
  }

  /**
   * 发送消息并获取回复
   * @param content 用户输入
   * @param sessionId 会话 id（不传则新建）
   * @param userId 登录用户 id
   * @param deviceId 设备 id
   */
  async chat(
    content: string,
    sessionId: number | null,
    userId: number | null,
    deviceId: string
  ): Promise<ChatResult> {
    if (!this.isAvailable()) {
      throw new Error('智能体未启用，请在 .env 中配置 LLM_API_KEY 和 LLM_MODEL_NAME');
    }

    // 1. 创建或验证会话
    let sid = sessionId;
    if (!sid) {
      sid = await this.sessionService.createSession(userId, deviceId, content);
    } else {
      const owned = await this.sessionService.verifyOwnership(sid, userId, deviceId);
      if (!owned) {
        throw new Error('无权访问该会话');
      }
    }

    // 2. 保存用户消息
    await this.sessionService.saveUserMessage(sid, content);

    // 3. RAG 检索相关知识
    const relevantDocs = await this.ragService.retrieve(content, 4);
    const sources = relevantDocs.map((d) => d.title);

    // 4. 拼装上下文
    const contextParts: string[] = [];
    if (relevantDocs.length > 0) {
      contextParts.push('以下是检索到的相关知识，请基于这些内容回答问题：\n');
      for (const doc of relevantDocs) {
        contextParts.push(`【${doc.title}】\n${doc.content}\n`);
      }
      contextParts.push('\n如果检索内容不足以回答问题，请明确说明，并基于你的通用知识给出方向性建议，但不要编造具体事实。');
    }

    // 5. 获取历史消息
    const history = await this.sessionService.getHistory(sid, 10);

    // 6. 构建 LLM 消息列表
    const messages: (SystemMessage | HumanMessage | AIMessage)[] = [
      new SystemMessage(SYSTEM_PROMPT + (contextParts.length > 0 ? '\n\n' + contextParts.join('\n') : '')),
    ];

    // 加入历史（排除刚保存的当前用户消息，因为会在下面重新加入）
    for (let i = 0; i < history.length - 1; i++) {
      const msg = history[i];
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // 加入当前用户消息
    messages.push(new HumanMessage(content));

    // 7. 调用 LLM
    const llm = new ChatOpenAI({
      apiKey: process.env.LLM_API_KEY,
      configuration: {
        baseURL: process.env.LLM_BASE_URL || undefined,
      },
      model: process.env.LLM_MODEL_NAME,
      temperature: 0.7,
      maxTokens: 1024,
    });

    this.logger.info(
      '[m6-agent] calling LLM, baseURL=%s, model=%s, apiKey=%s...',
      process.env.LLM_BASE_URL || '(default)',
      process.env.LLM_MODEL_NAME,
      (process.env.LLM_API_KEY || '').slice(0, 6)
    );

    const response = await llm.invoke(messages);
    const reply = typeof response.content === 'string' ? response.content : String(response.content);

    // 8. 保存助手回复
    const usage = response.usage_metadata as { input_tokens?: number; output_tokens?: number; total_tokens?: number } | undefined;
    await this.sessionService.saveAssistantMessage(
      sid,
      reply,
      usage?.input_tokens || 0,
      usage?.output_tokens || 0
    );

    this.logger.info('[m6-agent] reply generated, session=%s, tokens=%d', sid, (usage?.total_tokens || 0));

    return { sessionId: sid, reply, sources };
  }
}
