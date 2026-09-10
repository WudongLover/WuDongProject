/**
 * 文化导览内容：衣食住行四个模块的「先了解，再消费」入口。
 *
 * 这里是固定内容，不走后端。配图的 prompt 必须逐字来自 image-map.ts 已命中的
 * key —— 差一个字符，img()/scene() 就会回退成外网文生图链接，浏览器会真去请求。
 * 新增配图前先确认 image-map.ts 里有对应条目。
 */
import type { CultureModule, CultureSection, CultureStory } from '@/types'
import { img, scene } from './images'

/* ================= 衣 · 银与蓝 ================= */

const yiStories: CultureStory[] = [
  {
    id: 'yi-silver-hammer',
    module: 'YI',
    eyebrow: 'YI · SILVER',
    title: '银器上的锤纹',
    summary:
      '乌东的银器不用模具。一件花丝手镯要拉丝、掐花、攒焊三十余道工序，敲七天才成器。',
    paragraphs: [
      '杨师傅十四岁随父学艺，守着乌东老银铺的炉火四十余年。铺子就在银匠巷口，门脸不到两米宽，进门左手是炉，右手是锤，中间一条板凳坐过三代学徒。',
      '他坚持不用模具。「机器压的花太死，银是有呼吸的。」一块足银先在炭火上退火，抡锤延展成片，再拉成发丝般的细丝，掐、填、攒、焊，蝶恋花的纹样是一寸寸敲出来的。',
      '打坏的银器不扔，回炉重来。杨师傅说银会记得每一次锤击，所以乌东的银饰戴久了，会随着主人的手势慢慢变亮。',
    ],
    cover: img('handcrafted Miao silver filigree bracelet on dark indigo linen', 'square_hd'),
    quote: '机器压的花太死，银是有呼吸的。',
    links: [{ label: '看看银匠们的作品', to: '/goods' }],
  },
  {
    id: 'yi-batik-seven',
    module: 'YI',
    eyebrow: 'YI · BATIK',
    title: '一块布的七次深呼吸',
    summary:
      '板蓝根发酵建靛缸，布入缸七浸七晾。蜡刀点画的纹路在脱蜡后留下永不重复的冰裂纹。',
    paragraphs: [
      '蓝染坊在寨子西头，院子里立着三口靛缸。阿榜姐每年开春用板蓝根发酵建缸，缸水养得好不好，看泡沫的颜色就知道。',
      '布要下缸七次、出缸晾七次。第一次出来是黄绿，第五次转黛青，第七次才是正经的乌东蓝。中间不能急，晾布要等风，布「醒」透了颜色才咬得牢。',
      '铜鼓纹是蜡刀一笔笔点上去的。蜡在染液里护住布面，脱蜡后留下一道道冰裂纹——那是蓝与时间合作的签名，同一块布上的裂纹永远不会重复第二次。',
    ],
    cover: img('indigo blue batik square scarf folded, crackle texture pattern', 'square_hd'),
    quote: '冰裂纹是蓝与时间合作的签名。',
    links: [{ label: '看蜡染与刺绣', to: '/goods' }],
  },
  {
    id: 'yi-embroidery-mother',
    module: 'YI',
    eyebrow: 'YI · EMBROIDERY',
    title: '针脚里的蝴蝶妈妈',
    summary:
      '苗绣不画稿，纹样全在绣娘心里。蝴蝶、铜鼓、龙纹，一针一线记着苗族古歌里的来处。',
    paragraphs: [
      '苗家女孩七八岁就跟着母亲学针。不描图样，纹样长在心里——蝴蝶妈妈的翅膀、铜鼓的同心圆、水波的折线，都是从古歌里带下来的形状。',
      '乌东常见的破线绣，要把一根丝线劈成八股，再一股一股平绣上去。巴掌大的一片衣袖，断断续续绣上一个月。',
      '如今寨里的绣娘接了外面的订单，把龙纹绣到帆布包和外套上。针脚还是老针脚，只是背它的人换成了从城里来的年轻人。',
    ],
    cover: img('colorful Miao embroidery dragon wall hanging textile art', 'square_hd'),
    quote: '纹样不是画出来的，是记下来的。',
    links: [{ label: '刺绣与服饰', to: '/goods' }],
  },
  {
    id: 'yi-craft-today',
    module: 'YI',
    eyebrow: 'YI · TODAY',
    title: '把老手艺穿在身上',
    summary: '蜡染方巾、银丝耳饰、绣片外套——乌东的手艺正在被重新裁剪成日常的样子。',
    paragraphs: [
      '非遗工坊每周三、周六开班。两小时里，你可以从熔一块银开始，敲一枚刻着自己名字的银片书签；也可以拿蜡刀在一块棉布上点出第一朵铜鼓纹。',
      '年轻的设计师把苗绣的龙纹挪到西装翻领上，把银匠的锤纹做成耳夹。手艺没变，变的只是它出现的地方。',
      '离开乌东的时候带一件手工的东西回去，比带一张照片更长久——它会跟着你一起变旧。',
    ],
    cover: img('modern fashion dress with Miao embroidery elements on mannequin', 'square_hd'),
    quote: '手艺没变，变的只是它出现的地方。',
    links: [{ label: '挑一件带走', to: '/goods' }],
  },
]

/* ================= 食 · 一碗酸汤的来路 ================= */

const shiStories: CultureStory[] = [
  {
    id: 'shi-long-table',
    module: 'SHI',
    eyebrow: 'SHI · BANQUET',
    title: '三十六米长桌，从寨头摆到寨尾',
    summary:
      '长桌宴是乌东待客的最高礼节。酸汤鱼、烟熏腊肉、五彩糯米饭沿木楼一字排开，谁来都能坐下。',
    paragraphs: [
      '三十六米长桌沿木楼一字排开，从鼓楼坪这头摆到那头。开席前有穿盛装的姑娘捧牛角杯唱敬酒歌——递到面前时手别碰杯，碰了就要喝完。',
      '酸汤鱼用高山泉水和毛辣果发酵整整三日，汤色红亮，第一口先喝汤。糯米饭用手捏成团，蘸一点干辣椒面更香。',
      '长桌宴没有固定座位，来的都是客，坐下就是一家。散席时桌上的菜多半还剩着——苗家人待客的规矩是宁可剩，不能不够。',
    ],
    cover: scene('Miao long table banquet with many dishes, warm lantern light, festival'),
    quote: '宁可剩，不能不够。',
    links: [{ label: '预订长桌宴餐位', to: '/food' }],
  },
  {
    id: 'shi-sour-soup',
    module: 'SHI',
    eyebrow: 'SHI · SOUR',
    title: '酸汤三日',
    summary: '贵州人吃酸不用醋。毛辣果在山泉水里发酵三天，酸味才从果肉里慢慢醒过来。',
    paragraphs: [
      '毛辣果是山里的小番茄，个头只有拇指大。洗净入坛，加高山泉水和一点点老坛引子，封口静置三日——第一天的酸是尖的，第三天才变得柔和回甘。',
      '红酸汤煮稻田鲤，鱼是田埂上现抓的。汤滚三滚才下筷子，鱼肉刚离骨就起锅，久煮会散。',
      '寨子里的老人说，乌东人吃酸是为了解暑气、去湿气。一碗酸汤下肚，走了一天山路的腿就轻了。',
    ],
    cover: img('red sour soup paste in vacuum package with tomatoes', 'square_hd'),
    quote: '贵州人吃酸，从来不用醋。',
    links: [
      { label: '找一家坐下', to: '/food' },
      { label: '高山特产直发', to: '/food?tab=specialty' },
    ],
  },
  {
    id: 'shi-firepit',
    module: 'SHI',
    eyebrow: 'SHI · HEARTH',
    title: '火塘不灭',
    summary: '苗家的火塘一年四季不熄。灶上挂腊肉，灰里埋着糍粑，客人来了先添一把柴。',
    paragraphs: [
      '苗家木楼正中是火塘，全年不灭。柴火上方横一根竹竿，腊肉和香肠挂上去，柏枝混橘皮的烟慢熏四十五天，肉色透明发亮。',
      '火塘灰里常埋着几个糍粑。有客来，主人用火钳夹出来拍掉灰，蘸黄豆面递过来，配一碗热油茶。',
      '乌东几个民宿把火塘留着，晚上围坐讲古歌。听不懂苗语也没关系——旋律是从很深的地方升上来的。',
    ],
    cover: scene('cozy indoor fire pit dining room, rustic wooden benches'),
    quote: '客人来了，先添一把柴。',
    links: [
      { label: '有火塘的院子', to: '/stay' },
      { label: '餐厅与特产', to: '/food' },
    ],
  },
  {
    id: 'shi-tea-rice-wine',
    module: 'SHI',
    eyebrow: 'SHI · PANTRY',
    title: '茶、米酒与糍粑',
    summary:
      '后山茶园海拔一千三百米，一年只采一季。米酒用糯米自酿，糍粑得两个人轮流捶上半小时。',
    paragraphs: [
      '雷山银球茶采独芽一叶，手工揉成球状。冲泡时银球徐徐舒展，汤色嫩绿，栗香带甜——这是乌东人待客的第一杯。',
      '糯米蒸熟拌酒曲，入缸封一个月出酒。苗家敬客用牛角杯，杯口浅，其实喝不了多少，图的是那个阵仗。',
      '糍粑要两个人配合：一个抡木槌，一个趁槌起时翻面，捶到看不见米粒为止。这是苗族年节前全家一起做的事。',
    ],
    cover: img('rice wine in ceramic jars with red paper seal', 'square_hd'),
    quote: '第一杯茶，最后一杯酒。',
    links: [{ label: '高山特产直发', to: '/food?tab=specialty' }],
  },
]

/* ================= 住 · 房子为何长在半山 ================= */

const zhuStories: CultureStory[] = [
  {
    id: 'zhu-stilt-house',
    module: 'ZHU',
    eyebrow: 'ZHU · STILT HOUSE',
    title: '吊脚楼的道理',
    summary: '苗寨房子不长在平地上。杉木立柱、半悬于坡，下面关牲口堆柴，上面住人。',
    paragraphs: [
      '乌东的房子多是穿斗式木构，杉木立柱，不用一颗钉子。坡陡，就把前半边架空、后半边靠岩，一根根柱子把屋子撑在半山——这就是吊脚楼。',
      '底层放农具、堆柴火，二层正中是火塘和堂屋，三层住人。堂屋外挑出一圈「美人靠」，白天晒谷子，晚上坐着看对门山。',
      '老木楼最怕火。所以寨子里没有哪两家是紧贴着的，木楼之间留着几十公分的缝——那是几百年烧出来的经验。',
    ],
    cover: scene('wooden stilt house guesthouse on hillside with sea of clouds view'),
    quote: '木楼之间的缝隙，是烧出来的经验。',
    links: [{ label: '住进吊脚楼', to: '/stay' }],
  },
  {
    id: 'zhu-cloud-sea',
    module: 'ZHU',
    eyebrow: 'ZHU · CLOUD SEA',
    title: '推开窗就是云海',
    summary:
      '乌东在半山腰，雨后清晨云从谷底一寸寸漫上来。管家阿姐会敲门喊你上露台。',
    paragraphs: [
      '乌东的云海多在雨后第二天清晨。云从谷底往上涨，先没过梯田，再漫到三楼的窗棂。太阳出来的那十分钟，全寨子的人都站在屋顶上安静地看。',
      '观景台旁的老木楼改成了八间客房，每间都朝着梯田。管家阿姐会在五点轻轻敲三下门，端来热糯米饭和酸汤粉。',
      '也有旅人专程来看雾。雾比云海更慢，一整天都散不掉，木楼像泡在牛奶里，只听得见远处的鸡叫。',
    ],
    cover: scene('green rice terraces and morning mist over mountain village aerial view'),
    quote: '云先没过梯田，再漫到窗棂。',
    links: [{ label: '看云海的房间', to: '/stay' }],
  },
  {
    id: 'zhu-courtyard',
    module: 'ZHU',
    eyebrow: 'ZHU · COURTYARD',
    title: '住在银匠家的院子里',
    summary:
      '银匠巷 6 号是位老银匠家三代人的宅子。堂屋陈列着旧银器，楼下就是打银的炉子。',
    paragraphs: [
      '宅子临着银匠巷，进门先过堂屋。八仙桌上摆着三代人的银器：祖父的錾花项圈、父亲的茶叶罐、还有几件没来得及刻款的新作。',
      '住客可以预约楼下工坊的打银体验。老师傅手把手教你拉丝，两个小时做出一枚歪歪扭扭的银片书签，他会认真签上字——「第七个学徒」。',
      '夜里巷子很静，偶尔传来一两声锤响。那是师傅在赶第二天的活，敲到十点就收工。',
    ],
    cover: scene('traditional courtyard inn with silver craft decorations'),
    quote: '做坏了也是作品，银记得每一次锤击。',
    links: [
      { label: '银匠主题住宿', to: '/stay' },
      { label: '先看银器', to: '/goods' },
    ],
  },
  {
    id: 'zhu-meirenkao',
    module: 'ZHU',
    eyebrow: 'ZHU · TERRACE',
    title: '美人靠上的下午',
    summary:
      '吊脚楼挑出的那圈栏杆叫美人靠，白天晒谷子，晚上坐着看对门山。',
    paragraphs: [
      '吊脚楼二层外沿挑出一圈带靠背的栏杆，苗家人叫它美人靠。农忙时上面摊着新收的稻谷，农闲时是一家人吃饭歇脚的地方。',
      '靠上去的角度是按人体改过的，腰背刚好有依托。坐一下午，看对面山坡上的云影一格格移过去，梯田从亮绿变成墨绿。',
      '乌东几家庭院民宿保留着原样的美人靠，房间里不装电视。老板娘说，来这里的人需要的不是更多节目。',
    ],
    cover: scene('rural courtyard homestay next to green rice field'),
    quote: '坐一下午，看云影一格格移过梯田。',
    links: [{ label: '挑一间院子', to: '/stay' }],
  },
]

/* ================= 行 · 山水与节庆的秩序 ================= */

const xingStories: CultureStory[] = [
  {
    id: 'xing-entry-ritual',
    module: 'XING',
    eyebrow: 'XING · ENTRY',
    title: '入寨先过芦笙场',
    summary:
      '进乌东要先在芦笙场受一场迎宾礼。鼓藏头家的门为客人开，梯田步道从寨中穿过。',
    paragraphs: [
      '芦笙场在寨子正中，铺着青石板。节庆时这里是迎宾的地方，四支芦笙同时吹起来，穿盛装的姑娘在场上绕圈，客人在圈外被请进去，就算入了寨。',
      '鼓藏头是寨里管祭祀的长者。他的家就在芦笙场上方，堂屋梁上挂着鼓藏节的旧物。游人上门，主人一般会递一杯茶。',
      '从芦笙场往西是梯田步道，三百来级石阶，走完大约四十分钟。沿途能看见晒谷场、老井和几株护寨树。',
    ],
    cover: scene('Miao village panorama wooden houses terraces valley'),
    quote: '进了芦笙场，才算到了乌东。',
    links: [{ label: '看景区与门票', to: '/trip' }],
  },
  {
    id: 'xing-lusheng-festival',
    module: 'XING',
    eyebrow: 'XING · FESTIVAL',
    title: '芦笙一响，全寨放假',
    summary: '苗年是乌东最隆重的节。芦笙大赛、斗牛观礼、篝火夜歌，连着热闹三天。',
    paragraphs: [
      '苗年在每年十一月中旬，前后共三天。头一天迎苗年：入寨仪式、盛装巡游、长桌宴。全寨人换上绣花衣，银饰从脖子戴到手腕。',
      '第二天最热闹。芦笙场上有大赛，各寨的芦笙队轮番上场，比音准也比衣裳；下午在斗牛场观礼，牛角相碰时围观的人一起喊。',
      '夜里在广场点篝火，唱古歌、跳踩歌堂，一直闹到后半夜。第三天是鼓藏节俗体验与非遗市集，热闹完，就准备送客了。',
    ],
    cover: img(
      'lusheng instrument Miao festival performance colorful costumes valley, wide banner',
    ),
    quote: '芦笙一响，全寨子就放假了。',
    links: [{ label: '苗年三日路线', to: '/trip' }],
  },
  {
    id: 'xing-leigongshan',
    module: 'XING',
    eyebrow: 'XING · HIKING',
    title: '雷公山的八公里',
    summary:
      '苗岭主峰海拔 2178 米。秃杉林像绿色的教堂，山脊上风把云吹成一匹一匹的白布。',
    paragraphs: [
      '雷公山距乌东十二公里，主峰海拔 2178 米，夏季平均气温 22℃。从山门进，走小环线约八公里，半天可以走完。',
      '林子里最多的是秃杉。树干笔直，抬头看不到顶，向导老杨认得每一种鸟叫。他说山里有一千七百多种种子植物，「你们脚底下踩的都是药材书」。',
      '过了观佛台就是山脊草甸，风大，云从脚边过。运气好能遇上佛光——影子落在云上，外圈一道彩环。',
    ],
    cover: scene('mountain forest park misty peaks boardwalk'),
    quote: '你们脚底下踩的都是药材书。',
    links: [{ label: '徒步路线与门票', to: '/trip' }],
  },
  {
    id: 'xing-silver-lane',
    module: 'XING',
    eyebrow: 'XING · WALK',
    title: '银匠巷的半日',
    summary:
      '半日步行路线：芦笙场、银匠巷、蓝染坊、晒谷场。慢慢走，四个地方，一下午刚好。',
    paragraphs: [
      '从寨门进，先在芦笙场停十分钟；往北拐进银匠巷，两百米的巷子里开着七八家铺子，炉火从早烧到晚。',
      '巷子中段是蓝染坊，院子里晾着刚出缸的布，蓝从深到浅排成一排。可以进去看阿榜姐点蜡，也可以坐下自己染一块。',
      '再往西上几级台阶是晒谷场，傍晚有小孩在场上打球。坐在场边的石头上，能看见对面梯田的日落。',
    ],
    cover: scene('day tour village walking path silversmith workshop'),
    quote: '两百米的巷子，一下午走不完。',
    links: [{ label: '一日漫游路线', to: '/trip' }],
  },
]

/** 四个模块的文化导览区，顺序与首页「衣食住行」一致 */
export const cultureSections: CultureSection[] = [
  {
    module: 'YI',
    glyph: '衣',
    eyebrow: 'YI · INTANGIBLE HERITAGE',
    title: '先认识乌东的银',
    intro:
      '乌东被叫作银饰之乡。寨子里的炉火从早烧到晚，银被敲成花丝、拉成发丝，再掐攒成蝶恋花。往下走是蓝染坊，布在靛缸里进出七次，从黄绿染到黛青。看懂了这些手法，再挑东西不迟。',
    stories: yiStories,
    entries: [
      { label: '银饰锻造', to: '/goods' },
      { label: '蜡染', to: '/goods' },
      { label: '苗绣', to: '/goods' },
      { label: '苗族服饰', to: '/goods' },
    ],
  },
  {
    module: 'SHI',
    glyph: '食',
    eyebrow: 'SHI · TASTE OF MIAO',
    title: '一碗酸汤的来路',
    intro:
      '贵州人吃酸不用醋。毛辣果封在坛子里发酵三日，酸味才从果肉里慢慢醒过来。长桌宴沿木楼摆出三十六米，火塘一年到头不熄，客人进门先添一把柴。这些不是布景，是乌东人每天的日子。',
    stories: shiStories,
    entries: [
      { label: '长桌宴', to: '/food' },
      { label: '火塘腊味', to: '/food' },
      { label: '高山特产', to: '/food?tab=specialty' },
      { label: '雷山银球茶', to: '/food?tab=specialty' },
    ],
  },
  {
    module: 'ZHU',
    glyph: '住',
    eyebrow: 'ZHU · MOUNTAIN LODGE',
    title: '房子为何长在半山',
    intro:
      '苗寨少平地，房子就一半架在坡上、一半靠着岩，杉木立柱不用一颗钉子——这就是吊脚楼。推窗是梯田与云海，挑出的栏杆叫美人靠。住进一栋老木楼，才算真正到了乌东。',
    stories: zhuStories,
    entries: [
      { label: '吊脚楼', to: '/stay' },
      { label: '云海房', to: '/stay' },
      { label: '银匠院落', to: '/stay' },
      { label: '美人靠', to: '/stay' },
    ],
  },
  {
    module: 'XING',
    glyph: '行',
    eyebrow: 'XING · JOURNEY',
    title: '山水与节庆的秩序',
    intro:
      '进寨先过芦笙场，绕场一周就算入了乌东。往西是三百级梯田步道，再远是雷公山八公里的秃杉林。若赶上十一月苗年，芦笙大赛、斗牛观礼、篝火夜歌会连着热闹三天。',
    stories: xingStories,
    entries: [
      { label: '芦笙场', to: '/trip' },
      { label: '苗年节庆', to: '/trip' },
      { label: '雷公山', to: '/trip' },
      { label: '银匠巷', to: '/trip' },
    ],
  },
]

/** 文化词条：首页热搜位用，点击直接落到对应文化内容，不走商品搜索 */
export const cultureEntries: { label: string; storyId: string }[] = [
  { label: '银饰锻造', storyId: 'yi-silver-hammer' },
  { label: '蓝染手记', storyId: 'yi-batik-seven' },
  { label: '苗年节', storyId: 'xing-lusheng-festival' },
  { label: '长桌宴', storyId: 'shi-long-table' },
  { label: '雷公山', storyId: 'xing-leigongshan' },
  { label: '吊脚楼', storyId: 'zhu-stilt-house' },
]

/** 按模块取导览区 */
export function getCultureSection(module: CultureModule): CultureSection | undefined {
  return cultureSections.find((s) => s.module === module)
}

/** 按 id 取单条，详情页用 */
export function findCultureStory(id: string): CultureStory | undefined {
  return cultureSections.flatMap((s) => s.stories).find((x) => x.id === id)
}

/** 相关推荐：同模块剔除自身，最多 limit 条 */
export function relatedCultureStories(story: CultureStory, limit = 3): CultureStory[] {
  const section = cultureSections.find((s) => s.module === story.module)
  if (!section) return []
  return section.stories.filter((x) => x.id !== story.id).slice(0, limit)
}
