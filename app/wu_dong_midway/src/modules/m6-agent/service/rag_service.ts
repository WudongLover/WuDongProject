/**
 * 【m6-agent 模块】RAG 知识库服务
 * 负责知识文档的加载、切分、向量化和检索
 *
 * 知识文档内容直接内嵌于此（最小改动，避免编译后 .md 文件路径问题）
 * 向量存储用简单内存实现（不依赖 MemoryVectorStore，LangChain 1.x 已移除）
 */
import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/** 知识文档：title + content */
const KNOWLEDGE_DOCS: { title: string; content: string }[] = [
  {
    title: '乌东村概况',
    content: `乌东村位于贵州省黔东南苗族侗族自治州雷山县，是一个有着数百年历史的苗族聚居村寨。村寨坐落于雷公山国家级自然保护区腹地，海拔约 1300 米，四周群山环抱，梯田层叠，云雾缭绕，素有"云端上的苗寨"之称。

地理位置与交通：距雷山县城约 20 公里，车程约 40 分钟；距黔东南州府凯里市约 60 公里，车程约 1.5 小时；距省会贵阳约 200 公里，车程约 3 小时。可从凯里南站（高铁）打车或乘坐乡村客运班车前往。

人口与民族：全村约 200 户，人口近千人，几乎全部为苗族，操苗语中部方言。村民以"杨""李"等姓氏为主，保留着完整的苗族宗族制度和鼓社组织。

气候特征：属亚热带季风气候，年平均气温约 15℃；夏季凉爽，7 月平均气温约 24℃，是避暑胜地；冬季温和，极少降雪；年降水量约 1300 毫米，多云雾天气。最佳旅游季节为 4-10 月，其中 4-5 月杜鹃花开、9-10 月梯田金黄最美。

村寨特色：干栏式吊脚楼——全村建筑均为传统木结构吊脚楼，依山而建，错落有致；梯田景观——村寨周围有数百亩梯田，随山势起伏，四季景色各异；古树群落——寨头有大片护寨古树，以红豆杉、楠木为主，树龄逾百年；溪流穿寨——多条山溪从寨中流过，水质清澈，是村民日常用水来源。`,
  },
  {
    title: '苗族银饰锻造工艺',
    content: `苗族银饰是苗族文化的重要载体，被列入国家级非物质文化遗产名录。乌东及周边苗寨的银饰锻造技艺世代相传，以工艺精湛、纹样丰富著称。

工艺流程：苗族银饰的锻造需经过数十道工序，核心步骤包括：1.熔银——将银料放入坩埚中，用炭火高温熔化，去除杂质；2.锻打——将熔化的银水倒入模具冷却成银条，再用铁锤反复锻打，增加银的韧性；3.拉丝——将银条通过不同孔径的拉丝板，拉成粗细各异的银丝，最细可至发丝般粗细；4.编结——用银丝编结出各种纹样，如麻花、网状、花瓣等；5.掐丝——将银丝掐成各种图案轮廓，焊接到银片上；6.錾刻——用錾子在银片上敲出浮雕纹样；7.洗涤——用明矾水煮沸清洗，去除氧化层，使银饰光亮如新；8.抛光——用玛瑙或铜刷反复打磨，增加光泽度。

常见纹样：蝴蝶纹——苗族始祖"蝴蝶妈妈"的象征，寓意生命与繁衍；铜鼓纹——源自铜鼓上的太阳纹、云雷纹，象征权力与祭祀；花鸟纹——取材于苗族山区的花鸟虫鱼，生动自然；几何纹——菱形、三角形、回纹等，源自苗族织锦与蜡染图案。

银饰品类：头饰——银角、银冠、银簪、银梳，是苗族女性最隆重的装饰；颈饰——项圈、项链、长命锁，从婴儿时期开始佩戴；手饰——手镯、戒指，手镯是苗族女性最常佩戴的银饰；衣饰——银片、银泡、银铃，缝在节日盛装之上；耳饰——耳环、耳坠，造型多样。

选购建议：认准"足银"标识，苗族银饰传统上使用高纯度银料；手工银饰每一件都有细微差异，这正是手工的价值所在；银饰硬度较低，日常佩戴避免碰撞和挤压；氧化发黑是正常现象，用擦银布或牙膏轻轻擦拭即可恢复光亮；乌东村的银饰多为本地匠人手工打造，可在银饰作坊现场观看锻造过程。`,
  },
  {
    title: '苗族蜡染工艺',
    content: `蜡染是苗族古老的传统印染工艺，被列入国家级非物质文化遗产名录。苗族蜡染以铜蜡刀蘸熔蜡作画，经蓝靛浸染、脱蜡漂洗后，蓝白分明的纹样便显现于布面。

工艺流程：1.备布——选用自织的棉麻布，经草木灰水煮、漂洗、捶打，使布面平整光洁；2.熔蜡——将蜂蜡与石蜡按比例混合，放入小瓷碗中用炭火加温熔化；3.画蜡——用铜制蜡刀蘸取蜡液，在布面上直接绘制纹样。苗族妇女作画无需打底，胸有成竹，一气呵成；4.浸染——将画好蜡的布放入蓝靛染缸中浸泡，反复浸染十数次，每染一次晾晒一次，使蓝色逐渐加深；5.脱蜡——将染好的布放入沸水中煮，使蜡层熔化脱落；6.漂洗——用清水反复漂洗，去除浮色和残蜡，晾晒后即成。

蓝靛染料：原料为板蓝根（蓝靛草）的茎叶；将板蓝根放入池中加水发酵，沉淀后得到靛泥；使用时将靛泥与草木灰水、米酒混合，发酵成染液；天然蓝靛染色牢度高，色泽沉稳，越洗越好看。

常见纹样：铜鼓纹——中心为太阳纹，外圈环绕锯齿纹，是蜡染中最经典的纹样；蝴蝶纹——象征苗族始祖蝴蝶妈妈，常与花卉组合；鸟纹——锦鸡、喜鹊等，寓意吉祥；鱼纹——寓意年年有余、多子多福；花草纹——取材于山间野花，灵动自然；几何纹——菱形、回纹、螺旋纹，源自苗族古老的宇宙观。

蜡染与扎染的区别：蜡染用蜡作画防染，纹样精细，可表现复杂线条；扎染用线捆扎布料防染，纹样朦胧，有自然晕染效果；苗族以蜡染为主，白族以扎染闻名。

保养建议：天然蓝靛初次洗涤会有轻微浮色，属正常现象；避免长时间暴晒，以免蓝色褪色；手洗为佳，避免与浅色衣物混洗；蜡染布艺品可作桌布、窗帘、挂画、服饰面料。`,
  },
  {
    title: '苗家长桌宴',
    content: `长桌宴是苗族最隆重的待客礼仪，已有数百年历史。每逢节庆、婚嫁、祭祖或贵客到访，苗家人便在寨中广场或屋檐下，将一张张方桌拼接成长桌，全村男女老少与客人围坐一堂，共享美酒佳肴。

宴席特色：长桌可长达数十米，少则十几人，多则上百人共餐；桌上摆满苗族传统美食，以酸汤鱼、腊肉、腊肠、酸菜、糯米饭、米酒为主；客人坐在长桌一端，苗族姑娘身着盛装，手持酒壶，边唱敬酒歌边向客人敬酒；宴席间伴有苗族飞歌、芦笙舞、木鼓舞等表演，气氛热烈。

经典菜品：酸汤鱼——苗族招牌菜，用发酵的酸汤煮稻田鱼，酸辣鲜香；腊肉腊肠——腊月间用松柏枝熏制，肥瘦相间，香气浓郁；糯米饭——苗族主食，用木甑蒸制，粒粒分明；酸菜——各种青菜发酵而成，开胃解腻；米豆腐——凉拌小吃，爽滑酸辣；米酒——自酿糯米酒，度数低，甘甜醇厚。

用餐礼仪：客人入席前，苗族长者会念祝酒词；第一杯酒需双手接过，一饮而尽，表示对主人的尊重；敬酒歌响起时，客人不能用手触碰酒杯，否则需罚酒；不能拒绝苗族姑娘的敬酒，可浅尝表示礼貌；宴席结束时，主人会在客人脸上抹上锅底灰，表示祝福。

体验建议：长桌宴需提前预订，一般按人数收费；建议晚餐时段体验，氛围最佳；可搭配苗族歌舞表演一起预订；酒量不好的客人可提前说明，主人会酌情减少敬酒；长桌宴是体验苗族文化最直接的方式，值得一试。`,
  },
  {
    title: '乌东交通与出行指南',
    content: `到达乌东村的交通方式：

高铁+打车：最推荐的方式。乘高铁至凯里南站，从凯里南站打车至乌东村，约 1.5 小时车程，费用约 150-200 元。可提前联系民宿老板帮忙叫车。

客运班车：从凯里客运站乘坐至雷山县的班车，约 1 小时，票价约 25 元；到雷山后转乘至乌东的乡村客运面包车，约 40 分钟，票价约 15 元。班次较少，需提前确认时间。

自驾：从贵阳出发，沿沪昆高速至凯里，再转省道至雷山，最后走乡村公路至乌东，全程约 3 小时。山路弯多，需谨慎驾驶。村寨内有小型停车场。

村内交通：乌东村不大，步行即可游览全村；村寨内无出租车和共享单车；去周边景点可请民宿老板帮忙联系包车。

周边景点：雷公山国家森林公园——距乌东约 15 公里，原始森林、高山草甸，适合徒步；西江千户苗寨——距乌东约 40 公里，世界最大苗族聚居村寨；郎德上寨——距乌东约 30 公里，原生态苗寨，游客较少；丹江水电站——距乌东约 10 公里，高峡平湖景观。

最佳出行时间：春季（4-5 月）——杜鹃花开，气候宜人；夏季（6-8 月）——避暑胜地，可体验插秧；秋季（9-10 月）——梯田金黄，丰收季节，最美；冬季（11-3 月）——游客少，可体验苗年（农历十月）。

注意事项：山区天气多变，建议携带雨具和薄外套；山路崎岖，穿舒适的运动鞋；村寨内多为石板路和台阶，拖行李箱不便，建议用背包；尊重苗族风俗习惯，进入人家需脱鞋，不随意拍摄老人和小孩；山区手机信号可能不稳定，建议提前下载离线地图。`,
  },
];

/** 向量片段 */
interface VectorChunk {
  content: string;
  title: string;
  vector: number[];
}

/** 余弦相似度 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class RagService {
  private chunks: VectorChunk[] = [];
  private embeddings: OpenAIEmbeddings | null = null;
  private initialized = false;

  /** 初始化向量库（懒加载，首次调用时执行） */
  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      this.initialized = true;
      return;
    }

    // 向量模型优先使用独立的 EMBEDDING 配置（如阿里云百炼），未配置时回退到主 LLM
    const embeddingApiKey = process.env.LLM_EMBEDDING_API_KEY || apiKey
    const embeddingBaseUrl = process.env.LLM_EMBEDDING_URL || process.env.LLM_BASE_URL || undefined

    this.embeddings = new OpenAIEmbeddings({
      apiKey: embeddingApiKey,
      configuration: {
        baseURL: embeddingBaseUrl,
      },
      model: process.env.LLM_EMBEDDING_MODEL || undefined,
    })

    // 将知识文档切分为小块
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const allTexts: string[] = [];
    const allMetas: { title: string }[] = [];

    for (const doc of KNOWLEDGE_DOCS) {
      const chunks = await splitter.splitText(doc.content);
      for (const chunk of chunks) {
        allTexts.push(chunk);
        allMetas.push({ title: doc.title });
      }
    }

    // 批量向量化
    const vectors = await this.embeddings.embedDocuments(allTexts);

    this.chunks = allTexts.map((content, i) => ({
      content,
      title: allMetas[i].title,
      vector: vectors[i],
    }));

    this.initialized = true;
  }

  /**
   * 检索与问题最相关的知识片段
   * @param query 用户问题
   * @param k 返回条数，默认 4
   */
  async retrieve(query: string, k = 4): Promise<{ content: string; title: string }[]> {
    await this.ensureInitialized();
    if (!this.embeddings || this.chunks.length === 0) return [];

    const queryVector = await this.embeddings.embedQuery(query);

    // 计算相似度并排序
    const scored = this.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.vector),
    }));
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, k).map((s) => ({
      content: s.chunk.content,
      title: s.chunk.title,
    }));
  }

  /** 检查 RAG 是否可用（API Key 是否配置） */
  isAvailable(): boolean {
    return !!process.env.LLM_API_KEY;
  }
}
