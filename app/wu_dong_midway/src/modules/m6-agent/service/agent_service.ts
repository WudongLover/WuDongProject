/**
 * 【m6-agent 模块】智能体核心服务
 * 负责 LLM 调用编排：RAG 检索 → Prompt 拼装 → LLM 生成 → 持久化
 */
import { Inject, Provide, Logger } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { ChatOpenAI } from '@langchain/openai';
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  AIMessageChunk,
} from '@langchain/core/messages';
import { RagService } from './rag_service';
import { SessionService } from './session_service';
import { WeatherService } from './weather_service';
import { SYSTEM_PROMPT } from '../prompts/system';

/** 对话结果 */
export interface ChatResult {
  sessionId: number;
  reply: string;
  sources: string[];
}

/** 单次对话内最多的工具调用轮数，避免模型反复调用 */
const MAX_TOOL_ROUNDS = 3;

/** 暴露给 LLM 的工具定义（OpenAI function calling 格式） */
const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_wudong_weather',
      description:
        '查询乌东村（贵州省雷山县丹江镇）的当前天气和未来几天预报。当用户问到天气、气温、下雨、穿衣、出行天气等问题时调用。',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'integer',
            description: '需要预报的天数，1-7，默认 3。只问当前天气或今天天气时传 1。',
          },
        },
        required: [],
      },
    },
  },
];

@Provide()
export class AgentService {
  @Inject()
  ragService: RagService;

  @Inject()
  sessionService: SessionService;

  @Inject()
  weatherService: WeatherService;

  @Logger()
  logger: ILogger;

  /** 检查智能体是否可用（LLM API Key 是否配置） */
  isAvailable(): boolean {
    return !!process.env.LLM_API_KEY && !!process.env.LLM_MODEL_NAME;
  }

  /**
   * 公共准备：会话创建/校验、用户消息落库、RAG 检索与 LLM 消息列表拼装
   */
  private async prepare(
    content: string,
    sessionId: number | null,
    userId: number | null,
    deviceId: string
  ): Promise<{ sid: number; sources: string[]; messages: (SystemMessage | HumanMessage | AIMessage)[] }> {
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

    return { sid, sources, messages };
  }

  /**
   * 构建 LLM 客户端
   * streamUsage 关闭：部分 OpenAI 兼容端点不认 stream_options 参数，会导致流式请求失败
   */
  private buildLLM(): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: process.env.LLM_API_KEY,
      configuration: {
        baseURL: process.env.LLM_BASE_URL || undefined,
      },
      model: process.env.LLM_MODEL_NAME,
      temperature: 0.7,
      maxTokens: 1024,
      streamUsage: false,
    });
  }

  private logLLMCall(mode: string) {
    this.logger.info(
      '[m6-agent] calling LLM (%s), baseURL=%s, model=%s, apiKey=%s...',
      mode,
      process.env.LLM_BASE_URL || '(default)',
      process.env.LLM_MODEL_NAME,
      (process.env.LLM_API_KEY || '').slice(0, 6)
    );
  }

  /**
   * 带工具调用的生成循环：逐段产出回复文本。
   * 模型要求调用工具时，先执行工具并把结果回灌，再继续生成。
   */
  private async *streamReply(
    messages: (SystemMessage | HumanMessage | AIMessage)[]
  ): AsyncGenerator<string> {
    const llm = this.buildLLM().bindTools(AGENT_TOOLS);
    const conversation: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [...messages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const chunkStream = await llm.stream(conversation);

      // 边下发增量文本，边拼接完整消息（tool_calls 分片需要 concat 后才能还原）
      let acc: AIMessageChunk | null = null;
      for await (const chunk of chunkStream) {
        acc = acc ? acc.concat(chunk) : chunk;
        const text = typeof chunk.content === 'string' ? chunk.content : '';
        if (text) yield text;
      }

      const toolCalls = acc?.tool_calls ?? [];
      if (!toolCalls.length) return;

      conversation.push(new AIMessage({ content: acc?.content ?? '', tool_calls: toolCalls }));
      for (const call of toolCalls) {
        this.logger.info('[m6-agent] tool call: %s(%j)', call.name, call.args);
        const result = await this.runTool(call);
        conversation.push(
          new ToolMessage({ content: result, tool_call_id: call.id ?? '', name: call.name })
        );
      }
    }

    this.logger.warn('[m6-agent] 达到工具调用轮数上限 %d，停止继续调用', MAX_TOOL_ROUNDS);
  }

  /** 执行单个工具调用；工具异常时把错误信息交回模型，不中断对话 */
  private async runTool(call: { name: string; args: Record<string, any> }): Promise<string> {
    if (call.name === 'get_wudong_weather') {
      const days = Number(call.args?.days) || 3;
      try {
        return await this.weatherService.getWudongWeather(days);
      } catch (err: any) {
        this.logger.error('[m6-agent] get_wudong_weather failed: %s', err?.message || err);
        return `天气查询失败：${err?.message || err}`;
      }
    }
    return `未知工具：${call.name}`;
  }

  /**
   * 发送消息并获取回复（非流式：内部同样走工具调用循环，攒齐后一次返回）
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

    const { sid, sources, messages } = await this.prepare(content, sessionId, userId, deviceId);

    this.logLLMCall('non-stream');
    let reply = '';
    for await (const text of this.streamReply(messages)) {
      reply += text;
    }

    await this.sessionService.saveAssistantMessage(sid, reply);
    this.logger.info('[m6-agent] reply generated, session=%s, length=%d', sid, reply.length);

    return { sessionId: sid, reply, sources };
  }

  /**
   * 流式对话：逐段产出回复，SSE 事件序列 meta → delta* → end
   * @param content 用户输入
   * @param sessionId 会话 id（不传则新建）
   * @param userId 登录用户 id
   * @param deviceId 设备 id
   */
  async *chatStream(
    content: string,
    sessionId: number | null,
    userId: number | null,
    deviceId: string
  ): AsyncGenerator<{ event: string; data: any }> {
    if (!this.isAvailable()) {
      throw new Error('智能体未启用，请在 .env 中配置 LLM_API_KEY 和 LLM_MODEL_NAME');
    }

    const { sid, sources, messages } = await this.prepare(content, sessionId, userId, deviceId);

    // 先把会话 id 和引用来源发给前端
    yield { event: 'meta', data: { sessionId: sid, sources } };

    this.logLLMCall('stream');
    let full = '';
    for await (const text of this.streamReply(messages)) {
      full += text;
      yield { event: 'delta', data: { text } };
    }

    // 保存完整回复
    await this.sessionService.saveAssistantMessage(sid, full);
    this.logger.info('[m6-agent] stream reply generated, session=%s, length=%d', sid, full.length);
    yield { event: 'end', data: {} };
  }
}
