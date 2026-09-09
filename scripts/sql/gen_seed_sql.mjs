/**
 * 由前端 mock 数据（app/wu_dong_vue/src/mock）生成数据库种子 SQL。
 *
 * 用法：  node scripts/sql/gen_seed_sql.mjs
 * 输出：  scripts/sql/wudong_seed.sql（可重复执行：先 TRUNCATE 相关表再 INSERT）
 *
 * 说明：
 * - 直接打包前端 data.ts / images.ts，保证数据与图片 URL（文生图占位）和前端完全一致；
 *   后续接入 MinIO/OSS 后，在前端 images.ts 替换实现并重新生成本种子即可。
 * - ID 采用与 mock 顺序一致的显式数字 ID，便于跨表引用（收藏/购物车/订单扩展等）。
 * - 房态日历取「生成日起 30 天」（周末 +60 元、库存收紧，与 mock getRoomCalendar 口径一致）；
 *   餐厅时段余量取「生成日起 7 天」× mock left 值。
 * - 订单评价的 order_no 为满足「一单一目标一条评价」唯一约束的合成单号（WDyymmdd9NNN）。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const vueApp = path.resolve(__dirname, '../../app/wu_dong_vue')

/* ---------- 1. 打包并加载 mock 数据（类型导入会被 esbuild 擦除，无需 path alias） ---------- */
const requireVue = createRequire(path.join(vueApp, 'package.json'))
const { build } = requireVue('esbuild')

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wudong-seed-'))
const bundle = (entry, outfile) =>
  build({
    entryPoints: [path.join(vueApp, entry)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: path.join(tmpDir, outfile),
    logLevel: 'warning',
  })

await bundle('src/mock/images.ts', 'images.mjs')
await bundle('src/mock/data.ts', 'data.mjs')
const { img } = await import(pathToFileURL(path.join(tmpDir, 'images.mjs')).href)
const d = await import(pathToFileURL(path.join(tmpDir, 'data.mjs')).href)

/* ---------- 2. 通用工具 ---------- */
const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\r?\n/g, '\\n')
const s = (v) => (v == null ? 'NULL' : `'${esc(v)}'`)
const n = (v) => (v == null ? 'NULL' : String(v))
const j = (v) => (v == null ? 'NULL' : s(JSON.stringify(v)))
const dec = (v) => Number(v).toFixed(1)
const dateAfter = (y, m, day, offset) => {
  const dtv = new Date(y, m - 1, day)
  dtv.setDate(dtv.getDate() + offset)
  return `${dtv.getFullYear()}-${String(dtv.getMonth() + 1).padStart(2, '0')}-${String(dtv.getDate()).padStart(2, '0')}`
}
const T0 = '2026-08-01 10:00:00' // 基础数据创建时间
function ins(table, cols, rows) {
  if (!rows.length) return ''
  return (
    `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES\n` +
    rows.map((r) => `  (${r.join(', ')})`).join(',\n') +
    ';\n\n'
  )
}

/* ---------- 3. 用户（u0 + 社区作者 + 评价/评论用户） ---------- */
const authorOf = { a1: d.posts[0].author, a2: d.posts[2].author, a3: d.posts[1].author, a4: d.posts[3].author, a5: d.posts[4].author }
const reviewAvatar = {
  shanyue: d.goods[0].reviews[0].avatar,
  lizhi: d.goods[0].reviews[1].avatar,
  guanshan: d.goods[2].reviews[0].avatar,
  xiyou: d.goods[4].reviews[0].avatar,
  chacha: d.goods[6].reviews[0].avatar,
  yixiangqian: d.restaurants[0].reviews[0].avatar,
  momo: d.restaurants[0].reviews[1].avatar,
  daoxiang: d.restaurants[1].reviews[0].avatar,
  chayin: d.specialties[0].reviews[0].avatar,
  weixun: d.specialties[2].reviews[0].avatar,
  chufang: d.specialties[3].reviews[0].avatar,
  feiyu: d.homestays[1].reviews[0].avatar,
}
const users = [
  [1, '13800001234', '山间旅人', img('chinese traveler avatar illustration minimal backpack', 'square'), '想去有云的地方'],
  [2, '13800000002', '追云者', authorOf.a1.avatar, '在山里找到安静'],
  [3, '13800000003', '麦子', authorOf.a2.avatar, '带孩子看世界'],
  [4, '13800000004', '旅人手记', authorOf.a3.avatar, '慢慢走，欣赏啊'],
  [5, '13800000005', '南方有雨', authorOf.a4.avatar, '胶片与蓝染'],
  [6, '13800000006', '带娃去看山', authorOf.a5.avatar, '亲子徒步中'],
  [7, '13800000007', '山月不知', reviewAvatar.shanyue, ''],
  [8, '13800000008', '荔枝', reviewAvatar.lizhi, ''],
  [9, '13800000009', '观山', reviewAvatar.guanshan, ''],
  [10, '13800000010', '西柚', reviewAvatar.xiyou, ''],
  [11, '13800000011', '茶茶', reviewAvatar.chacha, ''],
  [12, '13800000012', '一路向黔', reviewAvatar.yixiangqian, ''],
  [13, '13800000013', 'Momo', reviewAvatar.momo, ''],
  [14, '13800000014', '稻香', reviewAvatar.daoxiang, ''],
  [15, '13800000015', '茶瘾', reviewAvatar.chayin, ''],
  [16, '13800000016', '微醺旅行家', reviewAvatar.weixun, ''],
  [17, '13800000017', '厨房杀手', reviewAvatar.chufang, ''],
  [18, '13800000018', '非鱼', reviewAvatar.feiyu, ''],
]
const userRows = users.map((u) => [u[0], s(u[1]), s(''), s(u[2]), s(u[3]), s(u[4]), s('ENABLED'), s(T0)])

/* ---------- 4. 商家（对应购物车/订单 shop 名 + 餐厅/民宿/路线运营方） ---------- */
const merchants = [
  [1, '乌东银铺 · 杨光银', d.goods[0].artisan.avatar, '13800000101', '杨光银师傅主理的老银铺，花丝与锻制银器四十余年。'],
  [2, '乌东蓝染合作社', d.goods[1].artisan.avatar, '13800000102', '阿榜带头的蓝染合作社，板蓝根靛缸养了十二年。'],
  [3, '潘玉珍绣坊', d.goods[2].artisan.avatar, '13800000103', '省级苗绣代表性传承人潘玉珍主理的绣坊。'],
  [4, '乌东服饰工坊', d.goods[3].cover, '13800000104', '非遗元素与现代剪裁结合的服饰工坊。'],
  [5, '乌东特产合作社', d.specialties[0].cover, '13800000105', '乌东村合作社统一出品的山货特产。'],
  [6, '云雾长桌宴', d.restaurants[0].cover, '13800000106', '三十六米长桌宴，高山泉水酸汤鱼。'],
  [7, '梯田人家', d.restaurants[1].cover, '13800000107', '稻田景观农家菜，露台正对层层梯田。'],
  [8, '阿婆火塘', d.restaurants[2].cover, '13800000108', '火塘烤肉与米酒，只做晚上。'],
  [9, '锦鸡轩茶餐', d.restaurants[3].cover, '13800000109', '雷山银球茶入馔的新中式茶空间。'],
  [10, '枕云山舍', d.homestays[0].cover, '13800000110', '老木楼改造的八间观云民宿。'],
  [11, '银匠世家客栈', d.homestays[1].cover, '13800000111', '老银匠家的宅子改的客栈。'],
  [12, '稻田畔的院子', d.homestays[2].cover, '13800000112', '院子外就是稻田的亲子民宿。'],
  [13, '雾里 · 悬廊民宿', d.homestays[3].cover, '13800000113', '悬空茶廊架在松林之上的设计民宿。'],
  [14, '乌东旅行社', d.routes[0].cover, '13800000114', '乌东村在地旅行社，深耕苗寨线路。'],
  [15, '乌东苗寨景区', d.scenics[0].cover, '13800000115', '乌东苗寨景区运营方。'],
]
const merchantRows = merchants.map((m) => [m[0], s(m[1]), s(m[2]), s(m[3]), s(m[4]), 'NULL', s('ENABLED'), s(T0)])

/* ---------- 5. 类目 + 商品 + SKU ---------- */
const categories = [
  [1, 'GOODS', '银饰', 1], [2, 'GOODS', '蜡染', 2], [3, 'GOODS', '刺绣', 3], [4, 'GOODS', '苗族服饰', 4],
  [5, 'SPECIALTY', '茶叶', 1], [6, 'SPECIALTY', '腊肉', 2], [7, 'SPECIALTY', '米酒', 3], [8, 'SPECIALTY', '酸食', 4], [9, 'SPECIALTY', '其他', 5],
]
const catIdByName = Object.fromEntries(categories.map((c) => [c[2], c[0]]))
const categoryRows = categories.map((c) => [c[0], s(c[1]), s(c[2]), c[3], s(T0)])

const prodIdOf = {}
const goodsMerchant = [1, 2, 3, 4, 1, 2, 3, 1] // g1..g8
const productRows = []
const pushProduct = (x, id, module, merchantId) => {
  prodIdOf[x.id] = id
  productRows.push([
    id, s(module), catIdByName[x.category], merchantId, s(x.title), s(x.subtitle), x.price, n(x.marketPrice ?? null),
    x.sales, dec(x.rating), x.stock, s(x.cover), j(x.images), s(x.detail ?? null), s(x.craft ?? null),
    j(x.artisan ?? null), s(x.origin ?? null), s(x.shelfLife ?? null), s('ON_SHELF'), s(T0),
  ])
}
d.goods.forEach((x, i) => pushProduct(x, i + 1, 'GOODS', goodsMerchant[i]))
d.specialties.forEach((x, i) => pushProduct(x, 9 + i, 'SPECIALTY', 5))

const skuRows = []
const skuIdOf = {}
let skuSeq = 0
for (const prod of [...d.goods, ...d.specialties]) {
  for (const k of prod.skus) {
    skuSeq += 1
    skuIdOf[`${prod.id}:${k.id}`] = skuSeq
    skuRows.push([skuSeq, prodIdOf[prod.id], s(k.name), k.price, k.stock, s(T0)])
  }
}

/* ---------- 6. 首页运营：Banner / 公告 / 热搜词 ---------- */
const bannerRows = d.banners.map((b, i) => [i + 1, s(b.title), s(b.subtitle), s(b.image), s(b.link), i + 1, 1, s(T0)])
const announcementRows = d.announcements.map((t, i) => [i + 1, s(t), i + 1, 1, s(T0)])
const kwHeat = [9800, 8600, 7400, 6200, 5100, 4300]
const keywordRows = d.hotKeywords.map((k, i) => [i + 1, s(k), kwHeat[i] ?? 1000, 1, s(T0)])

/* ---------- 7. 食：餐厅 / 菜品 / 时段 / 每日余量 ---------- */
const restaurantRows = d.restaurants.map((x, i) => [
  i + 1, 6 + i, s(x.name), s(x.cover), j(x.images), dec(x.rating), x.pricePerCapita,
  s(x.address), s(x.hours), x.capacity, j(x.tags), s(x.intro ?? null), s('ENABLED'), s(T0),
])
const dishRows = []
const slotRows = []
const slotLeft = []
d.restaurants.forEach((x, i) => {
  x.dishes.forEach((dish, k) =>
    dishRows.push([dishRows.length + 1, i + 1, s(dish.name), dish.price, s(dish.img), dish.signature ? 1 : 0, k + 1, s(T0)]))
  x.slots.forEach((slot, k) => {
    slotRows.push([slotRows.length + 1, i + 1, s(slot.name), slot.capacity, k + 1, s(T0)])
    slotLeft.push(slot.left)
  })
})
const quotaRows = []
let quotaSeq = 0
for (let off = 0; off < 7; off++) {
  const ds = dateAfter(2026, 9, 8, off)
  slotRows.forEach((row, idx) => {
    quotaSeq += 1
    quotaRows.push([quotaSeq, row[1], row[0], s(ds), slotLeft[idx], s('2026-09-08 00:00:00')])
  })
}

/* ---------- 8. 住：民宿 / 房型 / 房态日历 ---------- */
const homestayRows = d.homestays.map((x, i) => [
  i + 1, 10 + i, s(x.name), s(x.cover), j(x.images), dec(x.rating), j(x.score ?? null), j(x.tags ?? null),
  j(x.facilities ?? null), s(x.address), s(x.intro ?? null), s(x.notice ?? null), s('ENABLED'), s(T0),
])
const roomRows = []
const roomIdOf = {}
d.homestays.forEach((x, i) => {
  x.rooms.forEach((rm) => {
    const id = roomRows.length + 1
    roomIdOf[rm.id] = id
    roomRows.push([id, i + 1, s(rm.name), s(rm.bed), rm.area, rm.maxGuests, rm.price, rm.stock, s(rm.cover), j(rm.facilities ?? null), s(T0)])
  })
})
const calendarRows = []
let calSeq = 0
d.homestays.forEach((x) =>
  x.rooms.forEach((rm) => {
    const roomTypeId = roomIdOf[rm.id]
    for (let i = 0; i < 30; i++) {
      const weekend = [0, 6].includes(new Date(2026, 8, 8 + i).getDay())
      const stock = Math.min(rm.stock, weekend ? 1 : 2 + (i % 3))
      calSeq += 1
      calendarRows.push([calSeq, roomTypeId, s(dateAfter(2026, 9, 8, i)), stock, weekend ? 60 : 0, 0, s('2026-09-08 00:00:00')])
    }
  }))

/* ---------- 9. 行：景点 / 门票 / 路线 / 行程 ---------- */
const scenicRows = d.scenics.map((x, i) => [i + 1, s(x.name), s(x.cover), s(x.openTime), s(x.address), s(x.intro ?? null), dec(x.rating), s('ENABLED'), s(T0)])
const ticketRows = []
d.scenics.forEach((x, i) => x.tickets.forEach((t) => ticketRows.push([ticketRows.length + 1, i + 1, s(t.name), t.price, t.stock, s(t.note), s(T0)])))
const routeRows = d.routes.map((x, i) => [
  i + 1, 14, s(x.title), s(x.cover), x.days, s(x.theme), x.price, x.sales, dec(x.rating),
  s(x.departure), j(x.includes ?? null), j(x.notice ?? null), s('ON_SHELF'), s(T0),
])
const routeDayRows = []
let routeDaySeq = 0
const pushRouteDay = (routeId, day, title, desc, meals, stay) => {
  routeDaySeq += 1
  routeDayRows.push([routeDaySeq, routeId, day, s(title), s(desc), s(meals), s(stay)])
}
// rt1 为一日路线的三段行程，受 uk_route_day(route_id, day) 约束合并为 day=1 一行
pushRouteDay(1, 1, '入寨仪式 → 匠人工坊 → 火塘告别',
  '上午 · 入寨仪式：芦笙场迎宾 → 鼓藏头家做客 → 梯田步道\n下午 · 匠人工坊：银饰锻造体验（可带走作品）→ 蓝染坊参观\n傍晚 · 火塘告别：观景台日落 → 火塘油茶话别',
  '长桌宴午餐', '—')
d.routes.slice(1).forEach((x, i) => x.schedule.forEach((seg) => pushRouteDay(i + 2, seg.day, seg.title, seg.desc, seg.meals, seg.stay)))

/* ---------- 10. 社区：帖子 / 评论 ---------- */
const postAuthorId = [2, 4, 3, 5, 6, 5, 4, 2, 3] // p1..p9 -> user_id
const postRows = d.posts.map((x, i) => [
  i + 1, postAuthorId[i], s(x.title), s(x.content), j(x.images), s(x.topic ?? ''), s(x.place ?? ''),
  x.likes, x.collects, x.views, s('PASSED'), s(`${x.date} 10:00:00`), s('2026-07-01 10:00:00'),
])
const commentRows = [
  [1, 1, 5, 'NULL', 'NULL', s('这张构图绝了，求机位！'), s('PASSED'), s('2026-08-28 12:00:00')],
  [2, 1, 2, 1, 5, s('枕云山舍三楼露台，记得带广角～'), s('PASSED'), s('2026-08-28 12:30:00')],
  [3, 1, 11, 'NULL', 'NULL', s('已经订了下个月的房间！'), s('PASSED'), s('2026-08-29 09:00:00')],
  [4, 2, 13, 'NULL', 'NULL', s('书签上的锤纹好好看'), s('PASSED'), s('2026-08-22 09:00:00')],
  [5, 3, 12, 'NULL', 'NULL', s('牛角杯不碰杯这个真的救大命了，谢谢！'), s('PASSED'), s('2026-08-15 13:00:00')],
  [6, 3, 16, 'NULL', 'NULL', s('收藏了，下周就去实践'), s('PASSED'), s('2026-08-16 10:00:00')],
  [7, 5, 3, 'NULL', 'NULL', s('已经开始规划带娃二刷了'), s('PASSED'), s('2026-08-06 10:00:00')],
  [8, 9, 4, 'NULL', 'NULL', s('「绝不让你一个人走」，破防了'), s('PASSED'), s('2026-07-09 10:00:00')],
]

/* ---------- 11. 评价（商品/餐厅/民宿，order_no 为合成单号满足唯一约束） ---------- */
const reviewRows = []
let reviewSeq = 0
const addReview = (userId, targetType, targetId, rev, opts = {}) => {
  reviewSeq += 1
  const ono = 'WD' + rev.date.slice(2).replace(/-/g, '') + String(9000 + reviewSeq)
  reviewRows.push([
    reviewSeq, userId, s(rev.user), s(rev.avatar), s(targetType), targetId, s(ono), dec(rev.rating),
    s(rev.content), j(rev.images ?? null), s(rev.reply ?? null), rev.reply ? s(opts.replyAt) : 'NULL',
    s('PASSED'), s(`${rev.date} 12:00:00`),
  ])
}
addReview(7, 'GOODS', 1, d.goods[0].reviews[0], { replyAt: '2026-08-22 10:00:00' })
addReview(8, 'GOODS', 1, d.goods[0].reviews[1])
addReview(5, 'GOODS', 2, d.goods[1].reviews[0])
addReview(9, 'GOODS', 3, d.goods[2].reviews[0])
addReview(10, 'GOODS', 5, d.goods[4].reviews[0])
addReview(11, 'GOODS', 7, d.goods[6].reviews[0])
addReview(6, 'GOODS', 8, d.goods[7].reviews[0])
addReview(12, 'RESTAURANT', 1, d.restaurants[0].reviews[0])
addReview(13, 'RESTAURANT', 1, d.restaurants[0].reviews[1])
addReview(14, 'RESTAURANT', 2, d.restaurants[1].reviews[0])
addReview(15, 'SPECIALTY', 9, d.specialties[0].reviews[0])
addReview(16, 'SPECIALTY', 11, d.specialties[2].reviews[0])
addReview(17, 'SPECIALTY', 12, d.specialties[3].reviews[0])
addReview(2, 'HOMESTAY', 1, d.homestays[0].reviews[0])
addReview(3, 'HOMESTAY', 1, d.homestays[0].reviews[1])
addReview(18, 'HOMESTAY', 2, d.homestays[1].reviews[0])
addReview(4, 'HOMESTAY', 4, d.homestays[3].reviews[0])

/* ---------- 12. 收藏 / 购物车 / 地址 ---------- */
const favoriteRows = [
  [1, 1, s('GOODS'), 1], [2, 1, s('HOMESTAY'), 1], [3, 1, s('RESTAURANT'), 1],
  [4, 1, s('ROUTE'), 1], [5, 1, s('POST'), 1], [6, 1, s('POST'), 3],
]
const cartRows = [
  [1, 1, prodIdOf.g1, skuIdOf['g1:g1s1'], 1, 1, 1, s('手工苗银花丝手镯'), s(d.goods[0].cover), s('中号 · 圈口 58mm'), 868, 12, s('乌东银铺 · 杨光银'), s('2026-09-07 10:00:00')],
  [2, 1, prodIdOf.sp4, skuIdOf['sp4:sp4s1'], 5, 2, 1, s('红酸汤底料'), s(d.specialties[3].cover), s('400g × 2 袋'), 45, 100, s('乌东特产合作社'), s('2026-09-07 10:05:00')],
  [3, 1, prodIdOf.sp1, skuIdOf['sp1:sp1s2'], 5, 1, 0, s('雷山银球茶 · 明前特级'), s(d.specialties[0].cover), s('100g × 2 礼盒'), 298, 20, s('乌东特产合作社'), s('2026-09-07 10:10:00')],
]
const addressRows = d.initialAddresses.map((a, i) => [
  i + 1, 1, s(a.name), s('13800001234'), s(a.region), s(a.detail), a.isDefault ? 1 : 0, s(T0),
])

/* ---------- 13. 订单 / 明细 / 扩展 / 支付 ---------- */
const orderRows = [
  [1, s('WD2609010001'), 'NULL', 1, 10, s('LODGING'), s('CONFIRMED'), s('枕云山舍 · 苗族木屋大床房'), s(d.homestays[0].cover), s('09-29 入住 · 09-30 离店 · 2 晚'), 976, 1, s('枕云山舍'), 'NULL', s('2026-09-01 09:25:00'), 'NULL', 'NULL', s(''), s(''), 'NULL', s('2026-09-01 09:20:00')],
  [2, s('WD2609020007'), 'NULL', 1, 14, s('ROUTE'), s('PAID'), s('苗寨漫游记 · 一日精华'), s(d.routes[0].cover), s('10-02 出发 · 2 大 1 小'), 814, 3, s('乌东旅行社'), 'NULL', s('2026-09-02 14:10:00'), 'NULL', 'NULL', s(''), s(''), 'NULL', s('2026-09-02 14:05:00')],
  [3, s('WD2609050012'), 'NULL', 1, 1, s('GOODS'), s('IN_PROGRESS'), s('手工苗银花丝手镯'), s(d.goods[0].cover), s('中号 · 圈口 58mm × 1 · 已发货（顺丰）'), 868, 1, s('乌东银铺 · 杨光银'), 'NULL', s('2026-09-05 11:35:00'), 'NULL', 'NULL', s(''), s(''), 'NULL', s('2026-09-05 11:30:00')],
  [4, s('WD2609060021'), 'NULL', 1, 6, s('MEAL'), s('UNPAID'), s('云雾长桌宴 · 餐位预订'), s(d.restaurants[0].cover), s('09-10 晚餐 17:30 场 · 4 人'), 352, 4, s('云雾长桌宴'), 'NULL', 'NULL', 'NULL', 'NULL', s(''), s(''), 'NULL', s('2026-09-06 20:15:00')],
  [5, s('WD2608180033'), 'NULL', 1, 15, s('TICKET'), s('COMPLETED'), s('乌东苗寨景区 · 家庭套票'), s(d.scenics[0].cover), s('08-18 入园 · 2 大 1 小 · 已核销'), 138, 3, s('乌东苗寨景区'), 'NULL', s('2026-08-18 09:05:00'), s('2026-08-18 16:00:00'), 'NULL', s(''), s(''), 'NULL', s('2026-08-18 09:00:00')],
  [6, s('WD2607220044'), 'NULL', 1, 4, s('GOODS'), s('REFUNDED'), s('百鸟衣改良礼服'), s(d.goods[3].cover), s('尺码不合 · 已全额退款'), 2680, 1, s('乌东服饰工坊'), 'NULL', s('2026-07-22 10:05:00'), 'NULL', 'NULL', s(''), s('尺码不合，申请全额退款'), 2680, s('2026-07-22 10:00:00')],
]
const orderItemRows = [
  [1, 3, s('GOODS'), prodIdOf.g1, skuIdOf['g1:g1s1'], s('手工苗银花丝手镯'), s(d.goods[0].cover), s('中号 · 圈口 58mm'), 868, 1, 868, s('2026-09-05 11:30:00')],
  [2, 6, s('GOODS'), prodIdOf.g4, skuIdOf['g4:g4s1'], s('百鸟衣改良礼服'), s(d.goods[3].cover), s('S (155/80A)'), 2680, 1, 2680, s('2026-07-22 10:00:00')],
]
const m1ExtRows = [
  [1, 3, prodIdOf.g1, skuIdOf['g1:g1s1'], s('刘一'), s('13800001234'), s('广东省 广州市 天河区珠江新城华夏路 26 号 1201'), s('SF1388000091'), s('2026-09-05 11:30:00')],
  [2, 6, prodIdOf.g4, skuIdOf['g4:g4s1'], s('刘一'), s('13800001234'), s('广东省 广州市 天河区珠江新城华夏路 26 号 1201'), s(''), s('2026-07-22 10:00:00')],
]
const m2ExtRows = [
  [1, 4, 1, 2, s('2026-09-10'), s('晚餐 17:30 - 19:30'), 4, s('刘一'), s('13800001234'), s('2026-09-06 20:15:00')],
]
const m3ExtRows = [
  [1, 1, 1, 1, s('2026-09-29'), s('2026-09-30'), 2, 2, s('刘一'), s('13800001234'), s('2026-09-01 09:20:00')],
]
const m4ExtRows = [
  [1, 2, 'NULL', 'NULL', 1, s('2026-10-02'), 3, s('刘一'), s('13800001234'), s('2026-09-02 14:05:00')],
  [2, 5, 1, 3, 'NULL', s('2026-08-18'), 3, s('刘一'), s('13800001234'), s('2026-08-18 09:00:00')],
]
const paymentRows = [
  [1, s('PAYWD2609010001'), s('WD2609010001'), 1, 976, s('SUCCESS'), s('mock'), s('MOCK-PAY-SUCCESS'), s('2026-09-01 09:25:00'), s('2026-09-01 09:20:00')],
  [2, s('PAYWD2609020007'), s('WD2609020007'), 1, 814, s('SUCCESS'), s('mock'), s('MOCK-PAY-SUCCESS'), s('2026-09-02 14:10:00'), s('2026-09-02 14:05:00')],
  [3, s('PAYWD2609050012'), s('WD2609050012'), 1, 868, s('SUCCESS'), s('mock'), s('MOCK-PAY-SUCCESS'), s('2026-09-05 11:35:00'), s('2026-09-05 11:30:00')],
  [4, s('PAYWD2609060021'), s('WD2609060021'), 1, 352, s('PENDING'), s('mock'), s(''), 'NULL', s('2026-09-06 20:15:00')],
  [5, s('PAYWD2608180033'), s('WD2608180033'), 1, 138, s('SUCCESS'), s('mock'), s('MOCK-PAY-SUCCESS'), s('2026-08-18 09:05:00'), s('2026-08-18 09:00:00')],
  [6, s('PAYWD2607220044'), s('WD2607220044'), 1, 2680, s('REFUNDED'), s('mock'), s('MOCK-PAY-SUCCESS'), s('2026-07-22 10:05:00'), s('2026-07-22 10:00:00')],
]

/* ---------- 14. 消息 / 首页推荐位 ---------- */
const messageRows = [
  [1, 1, s('ORDER'), s('订单已确认'), s('您预订的「枕云山舍 · 苗族木屋大床房」已获商家确认，入住当天出示订单号即可。'), 0, s('ORDER'), s('WD2609010001'), s('2026-09-01 10:24:00')],
  [2, 1, s('ORDER'), s('包裹已发出'), s('您购买的手工苗银花丝手镯已由顺丰揽收，运单号 SF1388…0091。'), 0, s('ORDER'), s('WD2609050012'), s('2026-09-05 18:40:00')],
  [3, 1, s('INTERACT'), s('收到新的点赞'), s('「追云者」赞了你的游记《一个人的乌东》。'), 0, s('POST'), s('9'), s('2026-09-06 09:12:00')],
  [4, 1, s('SYSTEM'), s('苗年节早鸟优惠开启'), s('「苗年节庆 · 三日狂欢」路线现已开放预订，前 50 名立减 100 元。'), 1, s('ROUTE'), s('4'), s('2026-09-06 08:00:00')],
]
const recommendRows = []
let recSeq = 0
const addRec = (position, targetType, ids) =>
  ids.forEach((id, i) => {
    recSeq += 1
    recommendRows.push([recSeq, s(position), s(targetType), id, i + 1, 1, s(T0)])
  })
// 对齐 mock getHomeData：goods.slice(0,4) / restaurants/homestays/routes.slice(0,3) / posts.slice(0,6)
addRec('HOME_GOODS', 'GOODS', [1, 2, 3, 4])
addRec('HOME_RESTAURANT', 'RESTAURANT', [1, 2, 3])
addRec('HOME_HOMESTAY', 'HOMESTAY', [1, 2, 3])
addRec('HOME_ROUTE', 'ROUTE', [1, 2, 3])
addRec('HOME_POST', 'POST', [1, 2, 3, 4, 5, 6])

/* ---------- 15. 组装 SQL ---------- */
const seedTables = [
  'wudong_common_user', 'wudong_common_address', 'wudong_common_merchant', 'wudong_common_favorite',
  'wudong_common_cart_item', 'wudong_common_order', 'wudong_common_order_item', 'wudong_common_payment',
  'wudong_common_review', 'wudong_common_message', 'wudong_common_banner', 'wudong_common_announcement',
  'wudong_common_recommend', 'wudong_common_search_keyword',
  'wudong_m1_category', 'wudong_m1_product', 'wudong_m1_sku', 'wudong_m1_order_ext',
  'wudong_m2_restaurant', 'wudong_m2_dish', 'wudong_m2_time_slot', 'wudong_m2_slot_quota', 'wudong_m2_order_ext',
  'wudong_m3_homestay', 'wudong_m3_room_type', 'wudong_m3_room_calendar', 'wudong_m3_order_ext',
  'wudong_m4_scenic', 'wudong_m4_ticket', 'wudong_m4_route', 'wudong_m4_route_day', 'wudong_m4_order_ext',
  'wudong_m5_post', 'wudong_m5_comment', 'wudong_m5_post_like',
]

const sql = [
  '-- =====================================================================',
  '-- 乌东文旅 种子数据（由 app/wu_dong_vue/src/mock 生成，勿手改）',
  `-- 生成：node scripts/sql/gen_seed_sql.mjs（脚本见同目录 gen_seed_sql.mjs）`,
  `-- 图片：沿用前端文生图占位 URL，接入 MinIO/OSS 后重新生成即可`,
  '-- =====================================================================',
  'USE `wudong`;',
  'SET NAMES utf8mb4;',
  'SET FOREIGN_KEY_CHECKS = 0;',
  '',
  '-- 清空种子相关表（可重复执行）',
  ...seedTables.map((t) => `TRUNCATE TABLE \`${t}\`;`),
  '',
  '-- ===== 公共：用户 =====',
  ins('wudong_common_user', ['id', 'phone', 'password_hash', 'name', 'avatar', 'bio', 'status', 'created_at'], userRows),
  '-- ===== 公共：收货地址 =====',
  ins('wudong_common_address', ['id', 'user_id', 'name', 'phone', 'region', 'detail', 'is_default', 'created_at'], addressRows),
  '-- ===== 公共：商家 =====',
  ins('wudong_common_merchant', ['id', 'name', 'logo', 'contact_phone', 'intro', 'admin_user_id', 'status', 'created_at'], merchantRows),
  '-- ===== 公共：收藏（山间旅人） =====',
  ins('wudong_common_favorite', ['id', 'user_id', 'target_type', 'target_id'], favoriteRows),
  '-- ===== 公共：购物车（山间旅人） =====',
  ins('wudong_common_cart_item', ['id', 'user_id', 'product_id', 'sku_id', 'merchant_id', 'qty', 'checked', 'title', 'cover', 'sku_name', 'price', 'stock', 'shop_name', 'created_at'], cartRows),
  '-- ===== 公共：订单 =====',
  ins('wudong_common_order', ['id', 'order_no', 'checkout_id', 'user_id', 'merchant_id', 'type', 'status', 'title', 'cover', 'summary', 'amount', 'qty', 'shop_name', 'expire_at', 'paid_at', 'completed_at', 'cancelled_at', 'cancel_reason', 'refund_reason', 'refund_amount', 'created_at'], orderRows),
  '-- ===== 公共：订单明细 =====',
  ins('wudong_common_order_item', ['id', 'order_id', 'target_type', 'target_id', 'sku_id', 'title', 'cover', 'sku_name', 'price', 'qty', 'amount', 'created_at'], orderItemRows),
  '-- ===== 公共：支付单 =====',
  ins('wudong_common_payment', ['id', 'pay_no', 'order_no', 'user_id', 'amount', 'status', 'provider', 'credential', 'paid_at', 'created_at'], paymentRows),
  '-- ===== 公共：评价 =====',
  ins('wudong_common_review', ['id', 'user_id', 'user_name', 'user_avatar', 'target_type', 'target_id', 'order_no', 'rating', 'content', 'images', 'reply', 'reply_at', 'status', 'created_at'], reviewRows),
  '-- ===== 公共：站内消息 =====',
  ins('wudong_common_message', ['id', 'user_id', 'type', 'title', 'content', 'is_read', 'related_type', 'related_id', 'created_at'], messageRows),
  '-- ===== 公共：Banner / 公告 / 热搜词 / 推荐位 =====',
  ins('wudong_common_banner', ['id', 'title', 'subtitle', 'image', 'link', 'sort', 'enabled', 'created_at'], bannerRows),
  ins('wudong_common_announcement', ['id', 'content', 'sort', 'enabled', 'created_at'], announcementRows),
  ins('wudong_common_search_keyword', ['id', 'keyword', 'heat', 'enabled', 'created_at'], keywordRows),
  ins('wudong_common_recommend', ['id', 'position', 'target_type', 'target_id', 'sort', 'enabled', 'created_at'], recommendRows),
  '-- ===== m1 衣/特产：类目 / 商品 / SKU =====',
  ins('wudong_m1_category', ['id', 'module', 'name', 'sort', 'created_at'], categoryRows),
  ins('wudong_m1_product', ['id', 'module', 'category_id', 'merchant_id', 'title', 'subtitle', 'price', 'market_price', 'sales', 'rating', 'stock', 'cover', 'images', 'detail', 'craft', 'artisan', 'origin', 'shelf_life', 'status', 'created_at'], productRows),
  ins('wudong_m1_sku', ['id', 'product_id', 'name', 'price', 'stock', 'created_at'], skuRows),
  '-- ===== m1 衣/特产：订单扩展 =====',
  ins('wudong_m1_order_ext', ['id', 'order_id', 'product_id', 'sku_id', 'receiver_name', 'receiver_phone', 'receiver_addr', 'logistics_no', 'created_at'], m1ExtRows),
  '-- ===== m2 食：餐厅 / 菜品 / 时段 / 每日余量 =====',
  ins('wudong_m2_restaurant', ['id', 'merchant_id', 'name', 'cover', 'images', 'rating', 'price_per_capita', 'address', 'hours', 'capacity', 'tags', 'intro', 'status', 'created_at'], restaurantRows),
  ins('wudong_m2_dish', ['id', 'restaurant_id', 'name', 'price', 'img', 'is_signature', 'sort', 'created_at'], dishRows),
  ins('wudong_m2_time_slot', ['id', 'restaurant_id', 'name', 'capacity', 'sort', 'created_at'], slotRows),
  ins('wudong_m2_slot_quota', ['id', 'restaurant_id', 'slot_id', 'date', 'remaining', 'created_at'], quotaRows),
  '-- ===== m2 食：订单扩展 =====',
  ins('wudong_m2_order_ext', ['id', 'order_id', 'restaurant_id', 'slot_id', 'dining_date', 'dining_time', 'guests', 'contact_name', 'contact_phone', 'created_at'], m2ExtRows),
  '-- ===== m3 住：民宿 / 房型 / 房态日历 =====',
  ins('wudong_m3_homestay', ['id', 'merchant_id', 'name', 'cover', 'images', 'rating', 'score', 'tags', 'facilities', 'address', 'intro', 'notice', 'status', 'created_at'], homestayRows),
  ins('wudong_m3_room_type', ['id', 'homestay_id', 'name', 'bed', 'area', 'max_guests', 'price', 'stock', 'cover', 'facilities', 'created_at'], roomRows),
  ins('wudong_m3_room_calendar', ['id', 'room_type_id', 'date', 'stock', 'price_delta', 'closed', 'created_at'], calendarRows),
  '-- ===== m3 住：订单扩展 =====',
  ins('wudong_m3_order_ext', ['id', 'order_id', 'homestay_id', 'room_type_id', 'check_in_date', 'check_out_date', 'nights', 'guests', 'contact_name', 'contact_phone', 'created_at'], m3ExtRows),
  '-- ===== m4 行：景点 / 门票 / 路线 / 行程 =====',
  ins('wudong_m4_scenic', ['id', 'name', 'cover', 'open_time', 'address', 'intro', 'rating', 'status', 'created_at'], scenicRows),
  ins('wudong_m4_ticket', ['id', 'scenic_id', 'name', 'price', 'stock', 'note', 'created_at'], ticketRows),
  ins('wudong_m4_route', ['id', 'merchant_id', 'title', 'cover', 'days', 'theme', 'price', 'sales', 'rating', 'departure', 'includes', 'notice', 'status', 'created_at'], routeRows),
  ins('wudong_m4_route_day', ['id', 'route_id', 'day', 'title', 'description', 'meals', 'stay'], routeDayRows),
  '-- ===== m4 行：订单扩展 =====',
  ins('wudong_m4_order_ext', ['id', 'order_id', 'scenic_id', 'ticket_id', 'route_id', 'travel_date', 'guests', 'contact_name', 'contact_phone', 'created_at'], m4ExtRows),
  '-- ===== m5 社区：帖子 / 评论 =====',
  ins('wudong_m5_post', ['id', 'user_id', 'title', 'content', 'images', 'topic', 'place', 'likes', 'collects', 'views', 'status', 'published_at', 'created_at'], postRows),
  ins('wudong_m5_comment', ['id', 'post_id', 'user_id', 'parent_id', 'reply_to_user_id', 'content', 'status', 'published_at'], commentRows),
  'SET FOREIGN_KEY_CHECKS = 1;',
  '',
].join('\n')

const outFile = path.join(__dirname, 'wudong_seed.sql')
fs.writeFileSync(outFile, sql, 'utf8')
fs.rmSync(tmpDir, { recursive: true, force: true })

const stats = [
  ['用户', userRows.length], ['商家', merchantRows.length], ['类目', categoryRows.length],
  ['商品', productRows.length], ['SKU', skuRows.length], ['餐厅', restaurantRows.length],
  ['菜品', dishRows.length], ['时段', slotRows.length], ['时段余量', quotaRows.length],
  ['民宿', homestayRows.length], ['房型', roomRows.length], ['房态日历', calendarRows.length],
  ['景点', scenicRows.length], ['门票', ticketRows.length], ['路线', routeRows.length],
  ['路线行程', routeDayRows.length], ['帖子', postRows.length], ['评论', commentRows.length],
  ['评价', reviewRows.length], ['订单', orderRows.length], ['支付单', paymentRows.length],
  ['消息', messageRows.length], ['推荐位', recommendRows.length],
]
console.log('已生成 ' + outFile)
console.log(stats.map(([k, v]) => `${k}=${v}`).join(' '))
