/**
 * 【m6-agent 模块】联网搜索服务
 * 数据源：360 搜索（www.so.com，免密钥），解析结果页后整理成供 LLM 阅读的中文文本。
 *
 * 选型说明：实测本机访问 Bing/DuckDuckGo 的结果被降级（只回首个关键词）或不可达，
 * 360 结果正常且结果项带 data-mdurl（真实地址，无需解跳转链接），故采用 360。
 * 注意：这是解析结果页 HTML 的非官方接口，页面结构变更时需要同步调整下面的选择器。
 */
import { Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

/** 单次搜索最多返回给模型的结果条数，太多会挤占上下文 */
const MAX_RESULTS = 5;
/** 单条摘要最大长度 */
const MAX_SNIPPET = 120;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** 去标签、去注释、还原常见 HTML 实体（含 &#123; / &#x1F; 这类数字实体） */
function cleanHtml(raw: string): string {
  return String(raw || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;|&ensp;|&emsp;|&thinsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

@Provide()
export class WebSearchService {
  @Logger()
  logger: ILogger;

  /**
   * 联网搜索，返回供 LLM 阅读的中文文本
   * @param query 搜索关键词
   */
  async search(query: string): Promise<string> {
    const keyword = String(query || '').trim();
    if (!keyword) return '搜索关键词为空，需要先确定要搜什么。';

    const params = new URLSearchParams({ q: keyword });
    const res = await fetch(`https://www.so.com/s?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    if (!res.ok) {
      throw new Error(`搜索接口返回 ${res.status}`);
    }
    const html = await res.text();

    const results = this.parse(html);
    this.logger.info('[m6-agent] web search done, query=%s, results=%d', keyword, results.length);

    if (!results.length) {
      // 命中反爬或页面结构变化时也会走到这里
      return `没有搜到"${keyword}"的相关结果。可以换个更具体的说法再试。`;
    }

    const lines = [`【联网搜索】关键词"${keyword}"，取前 ${results.length} 条：`];
    results.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.title}`);
      if (item.snippet) lines.push(`   摘要：${item.snippet}`);
      if (item.url) lines.push(`   来源：${item.url}`);
    });
    return lines.join('\n');
  }

  /** 从 360 结果页 HTML 中提取自然结果（li.res-list 块），跳过广告位与知识卡 */
  private parse(html: string): SearchResult[] {
    const itemRe = /<li[^>]*class="(res-list[^"]*)"[^>]*>([\s\S]*?)(?=<li[^>]*class="res-list|$)/gi;
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    let matched: RegExpExecArray | null;
    while ((matched = itemRe.exec(html))) {
      const className = matched[1];
      const block = matched[2];
      // 广告位不是自然结果
      if (/ec_|_ad|res-ad|wise/i.test(className)) continue;
      // 知识卡/聚合卡的正文结构不稳定，跳过
      if (/g-card-layout|mh-default-wrap/.test(block)) continue;

      // data-mdurl 是真实地址；没有它的条目（跳转链、卡片）一律跳过
      const linkMatch = block.match(/data-mdurl="([^"]+)"/i);
      const titleMatch = block.match(/<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch || !titleMatch) continue;

      const title = cleanHtml(titleMatch[1]);
      const url = cleanHtml(linkMatch[1]);
      if (!title || !url || seen.has(url)) continue;
      seen.add(url);

      // 摘要有两种容器：p.res-desc 与 span/div.res-list-summary
      const snippetMatch =
        block.match(/<p[^>]*class="[^"]*res-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
        block.match(/<(span|div|p)[^>]*class="[^"]*res-list-summary[^"]*"[^>]*>([\s\S]*?)<\/\1>/i) ||
        block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      // 第二个分支的内容在捕获组 2，其余分支在捕获组 1
      const snippet = snippetMatch ? cleanHtml(snippetMatch[2] ?? snippetMatch[1]) : '';

      results.push({
        title,
        url,
        snippet: snippet.length > MAX_SNIPPET ? `${snippet.slice(0, MAX_SNIPPET)}…` : snippet,
      });
      if (results.length >= MAX_RESULTS) break;
    }

    return results;
  }
}
