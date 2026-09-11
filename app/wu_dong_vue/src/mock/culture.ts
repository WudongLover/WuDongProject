/**
 * 文化导览版式配置：衣食住行四个模块的导语、词条等「版面文案」。
 *
 * 推文正文（CultureStory）已迁后端 wudong_common_story 表（管理端编写维护，
 * 见 app/wu_dong_midway src/modules/common 与 scripts/sql/wudong_seed_story.sql），
 * 前端经 @/api 的 getCultureSection / findCultureStory 异步获取，本文件不再存推文内容。
 */
import type { CultureSection } from '@/types'

/** 四个模块的文化导览区版式，顺序与首页「衣食住行」一致；stories 由后端接口填充 */
export const cultureSections: Omit<CultureSection, 'stories'>[] = [
  {
    module: 'YI',
    glyph: '衣',
    eyebrow: 'YI · INTANGIBLE HERITAGE',
    title: '先认识乌东的银',
    intro:
      '乌东被叫作银饰之乡。寨子里的炉火从早烧到晚，银被敲成花丝、拉成发丝，再掐攒成蝶恋花。往下走是蓝染坊，布在靛缸里进出七次，从黄绿染到黛青。看懂了这些手法，再挑东西不迟。',
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
    entries: [
      { label: '芦笙场', to: '/trip' },
      { label: '苗年节庆', to: '/trip' },
      { label: '雷公山', to: '/trip' },
      { label: '银匠巷', to: '/trip' },
    ],
  },
]

/** 文化词条：首页热搜位用，点击直接落到对应文化内容（storyId 即推文 slug，需与库中一致） */
export const cultureEntries: { label: string; storyId: string }[] = [
  { label: '银饰锻造', storyId: 'yi-silver-hammer' },
  { label: '蓝染手记', storyId: 'yi-batik-seven' },
  { label: '苗年节', storyId: 'xing-lusheng-festival' },
  { label: '长桌宴', storyId: 'shi-long-table' },
  { label: '雷公山', storyId: 'xing-leigongshan' },
  { label: '吊脚楼', storyId: 'zhu-stilt-house' },
]
