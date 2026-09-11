-- =====================================================================
-- 文化推文模拟数据（wudong_common_story）
-- 来源：app/wu_dong_vue/src/mock/culture.ts 的 16 条 CultureStory
-- cover 已解析为前端 image-map.ts 命中的本地路径（public/images 下），
-- 接口替换 mock 后 <img :src> 可直接使用。
-- 可重复执行：先按 slug 清理再插入。
-- =====================================================================
USE `wudong`;

DELETE FROM `wudong_common_story`;

-- ---------------- 衣 YI ----------------
INSERT INTO `wudong_common_story`
  (`module`, `slug`, `eyebrow`, `title`, `summary`, `cover`, `quote`, `paragraphs`, `links`, `sort`, `status`, `published_at`)
VALUES
('YI', 'yi-silver-hammer', 'YI · SILVER', '银器上的锤纹',
 '乌东的银器不用模具。一件花丝手镯要拉丝、掐花、攒焊三十余道工序，敲七天才成器。',
 '/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg',
 '机器压的花太死，银是有呼吸的。',
 JSON_ARRAY(
   '杨师傅十四岁随父学艺，守着乌东老银铺的炉火四十余年。铺子就在银匠巷口，门脸不到两米宽，进门左手是炉，右手是锤，中间一条板凳坐过三代学徒。',
   '他坚持不用模具。「机器压的花太死，银是有呼吸的。」一块足银先在炭火上退火，抡锤延展成片，再拉成发丝般的细丝，掐、填、攒、焊，蝶恋花的纹样是一寸寸敲出来的。',
   '打坏的银器不扔，回炉重来。杨师傅说银会记得每一次锤击，所以乌东的银饰戴久了，会随着主人的手势慢慢变亮。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '看看银匠们的作品', 'to', '/goods')),
 0, 'PUBLISHED', '2026-08-01 09:00:00'),

('YI', 'yi-batik-seven', 'YI · BATIK', '一块布的七次深呼吸',
 '板蓝根发酵建靛缸，布入缸七浸七晾。蜡刀点画的纹路在脱蜡后留下永不重复的冰裂纹。',
 '/images/010_indigo-blue-batik-square-scarf-folded-crac_7c8bb2d7.jpg',
 '冰裂纹是蓝与时间合作的签名。',
 JSON_ARRAY(
   '蓝染坊在寨子西头，院子里立着三口靛缸。阿榜姐每年开春用板蓝根发酵建缸，缸水养得好不好，看泡沫的颜色就知道。',
   '布要下缸七次、出缸晾七次。第一次出来是黄绿，第五次转黛青，第七次才是正经的乌东蓝。中间不能急，晾布要等风，布「醒」透了颜色才咬得牢。',
   '铜鼓纹是蜡刀一笔笔点上去的。蜡在染液里护住布面，脱蜡后留下一道道冰裂纹——那是蓝与时间合作的签名，同一块布上的裂纹永远不会重复第二次。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '看蜡染与刺绣', 'to', '/goods')),
 1, 'PUBLISHED', '2026-08-02 09:00:00'),

('YI', 'yi-embroidery-mother', 'YI · EMBROIDERY', '针脚里的蝴蝶妈妈',
 '苗绣不画稿，纹样全在绣娘心里。蝴蝶、铜鼓、龙纹，一针一线记着苗族古歌里的来处。',
 '/images/015_colorful-miao-embroidery-dragon-wall-hangi_48870d33.jpg',
 '纹样不是画出来的，是记下来的。',
 JSON_ARRAY(
   '苗家女孩七八岁就跟着母亲学针。不描图样，纹样长在心里——蝴蝶妈妈的翅膀、铜鼓的同心圆、水波的折线，都是从古歌里带下来的形状。',
   '乌东常见的破线绣，要把一根丝线劈成八股，再一股一股平绣上去。巴掌大的一片衣袖，断断续续绣上一个月。',
   '如今寨里的绣娘接了外面的订单，把龙纹绣到帆布包和外套上。针脚还是老针脚，只是背它的人换成了从城里来的年轻人。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '刺绣与服饰', 'to', '/goods')),
 2, 'PUBLISHED', '2026-08-03 09:00:00'),

('YI', 'yi-craft-today', 'YI · TODAY', '把老手艺穿在身上',
 '蜡染方巾、银丝耳饰、绣片外套——乌东的手艺正在被重新裁剪成日常的样子。',
 '/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg',
 '手艺没变，变的只是它出现的地方。',
 JSON_ARRAY(
   '非遗工坊每周三、周六开班。两小时里，你可以从熔一块银开始，敲一枚刻着自己名字的银片书签；也可以拿蜡刀在一块棉布上点出第一朵铜鼓纹。',
   '年轻的设计师把苗绣的龙纹挪到西装翻领上，把银匠的锤纹做成耳夹。手艺没变，变的只是它出现的地方。',
   '离开乌东的时候带一件手工的东西回去，比带一张照片更长久——它会跟着你一起变旧。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '挑一件带走', 'to', '/goods')),
 3, 'PUBLISHED', '2026-08-04 09:00:00');

-- ---------------- 食 SHI ----------------
INSERT INTO `wudong_common_story`
  (`module`, `slug`, `eyebrow`, `title`, `summary`, `cover`, `quote`, `paragraphs`, `links`, `sort`, `status`, `published_at`)
VALUES
('SHI', 'shi-long-table', 'SHI · BANQUET', '三十六米长桌，从寨头摆到寨尾',
 '长桌宴是乌东待客的最高礼节。酸汤鱼、烟熏腊肉、五彩糯米饭沿木楼一字排开，谁来都能坐下。',
 '/images/003_miao-long-table-banquet-with-many-dishes-w_4be11336.jpg',
 '宁可剩，不能不够。',
 JSON_ARRAY(
   '三十六米长桌沿木楼一字排开，从鼓楼坪这头摆到那头。开席前有穿盛装的姑娘捧牛角杯唱敬酒歌——递到面前时手别碰杯，碰了就要喝完。',
   '酸汤鱼用高山泉水和毛辣果发酵整整三日，汤色红亮，第一口先喝汤。糯米饭用手捏成团，蘸一点干辣椒面更香。',
   '长桌宴没有固定座位，来的都是客，坐下就是一家。散席时桌上的菜多半还剩着——苗家人待客的规矩是宁可剩，不能不够。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '预订长桌宴餐位', 'to', '/food')),
 0, 'PUBLISHED', '2026-08-05 09:00:00'),

('SHI', 'shi-sour-soup', 'SHI · SOUR', '酸汤三日',
 '贵州人吃酸不用醋。毛辣果在山泉水里发酵三天，酸味才从果肉里慢慢醒过来。',
 '/images/055_red-sour-soup-paste-in-vacuum-package-with_458ffbc5.jpg',
 '贵州人吃酸，从来不用醋。',
 JSON_ARRAY(
   '毛辣果是山里的小番茄，个头只有拇指大。洗净入坛，加高山泉水和一点点老坛引子，封口静置三日——第一天的酸是尖的，第三天才变得柔和回甘。',
   '红酸汤煮稻田鲤，鱼是田埂上现抓的。汤滚三滚才下筷子，鱼肉刚离骨就起锅，久煮会散。',
   '寨子里的老人说，乌东人吃酸是为了解暑气、去湿气。一碗酸汤下肚，走了一天山路的腿就轻了。'
 ),
 JSON_ARRAY(
   JSON_OBJECT('label', '找一家坐下', 'to', '/food'),
   JSON_OBJECT('label', '高山特产直发', 'to', '/food?tab=specialty')
 ),
 1, 'PUBLISHED', '2026-08-06 09:00:00'),

('SHI', 'shi-firepit', 'SHI · HEARTH', '火塘不灭',
 '苗家的火塘一年四季不熄。灶上挂腊肉，灰里埋着糍粑，客人来了先添一把柴。',
 '/images/043_cozy-indoor-fire-pit-dining-room-rustic-wo_dc72ca13.jpg',
 '客人来了，先添一把柴。',
 JSON_ARRAY(
   '苗家木楼正中是火塘，全年不灭。柴火上方横一根竹竿，腊肉和香肠挂上去，柏枝混橘皮的烟慢熏四十五天，肉色透明发亮。',
   '火塘灰里常埋着几个糍粑。有客来，主人用火钳夹出来拍掉灰，蘸黄豆面递过来，配一碗热油茶。',
   '乌东几个民宿把火塘留着，晚上围坐讲古歌。听不懂苗语也没关系——旋律是从很深的地方升上来的。'
 ),
 JSON_ARRAY(
   JSON_OBJECT('label', '有火塘的院子', 'to', '/stay'),
   JSON_OBJECT('label', '餐厅与特产', 'to', '/food')
 ),
 2, 'PUBLISHED', '2026-08-07 09:00:00'),

('SHI', 'shi-tea-rice-wine', 'SHI · PANTRY', '茶、米酒与糍粑',
 '后山茶园海拔一千三百米，一年只采一季。米酒用糯米自酿，糍粑得两个人轮流捶上半小时。',
 '/images/054_rice-wine-in-ceramic-jars-with-red-paper-s_2e71d2b6.jpg',
 '第一杯茶，最后一杯酒。',
 JSON_ARRAY(
   '雷山银球茶采独芽一叶，手工揉成球状。冲泡时银球徐徐舒展，汤色嫩绿，栗香带甜——这是乌东人待客的第一杯。',
   '糯米蒸熟拌酒曲，入缸封一个月出酒。苗家敬客用牛角杯，杯口浅，其实喝不了多少，图的是那个阵仗。',
   '糍粑要两个人配合：一个抡木槌，一个趁槌起时翻面，捶到看不见米粒为止。这是苗族年节前全家一起做的事。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '高山特产直发', 'to', '/food?tab=specialty')),
 3, 'PUBLISHED', '2026-08-08 09:00:00');

-- ---------------- 住 ZHU ----------------
INSERT INTO `wudong_common_story`
  (`module`, `slug`, `eyebrow`, `title`, `summary`, `cover`, `quote`, `paragraphs`, `links`, `sort`, `status`, `published_at`)
VALUES
('ZHU', 'zhu-stilt-house', 'ZHU · STILT HOUSE', '吊脚楼的道理',
 '苗寨房子不长在平地上。杉木立柱、半悬于坡，下面关牲口堆柴，上面住人。',
 '/images/058_wooden-stilt-house-guesthouse-on-hillside-_34dbacb7.jpg',
 '木楼之间的缝隙，是烧出来的经验。',
 JSON_ARRAY(
   '乌东的房子多是穿斗式木构，杉木立柱，不用一颗钉子。坡陡，就把前半边架空、后半边靠岩，一根根柱子把屋子撑在半山——这就是吊脚楼。',
   '底层放农具、堆柴火，二层正中是火塘和堂屋，三层住人。堂屋外挑出一圈「美人靠」，白天晒谷子，晚上坐着看对门山。',
   '老木楼最怕火。所以寨子里没有哪两家是紧贴着的，木楼之间留着几十公分的缝——那是几百年烧出来的经验。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '住进吊脚楼', 'to', '/stay')),
 0, 'PUBLISHED', '2026-08-09 09:00:00'),

('ZHU', 'zhu-cloud-sea', 'ZHU · CLOUD SEA', '推开窗就是云海',
 '乌东在半山腰，雨后清晨云从谷底一寸寸漫上来。管家阿姐会敲门喊你上露台。',
 '/images/002_green-rice-terraces-and-morning-mist-over-_73264c88.jpg',
 '云先没过梯田，再漫到窗棂。',
 JSON_ARRAY(
   '乌东的云海多在雨后第二天清晨。云从谷底往上涨，先没过梯田，再漫到三楼的窗棂。太阳出来的那十分钟，全寨子的人都站在屋顶上安静地看。',
   '观景台旁的老木楼改成了八间客房，每间都朝着梯田。管家阿姐会在五点轻轻敲三下门，端来热糯米饭和酸汤粉。',
   '也有旅人专程来看雾。雾比云海更慢，一整天都散不掉，木楼像泡在牛奶里，只听得见远处的鸡叫。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '看云海的房间', 'to', '/stay')),
 1, 'PUBLISHED', '2026-08-10 09:00:00'),

('ZHU', 'zhu-courtyard', 'ZHU · COURTYARD', '住在银匠家的院子里',
 '银匠巷 6 号是位老银匠家三代人的宅子。堂屋陈列着旧银器，楼下就是打银的炉子。',
 '/images/064_traditional-courtyard-inn-with-silver-craf_034de4e7.jpg',
 '做坏了也是作品，银记得每一次锤击。',
 JSON_ARRAY(
   '宅子临着银匠巷，进门先过堂屋。八仙桌上摆着三代人的银器：祖父的錾花项圈、父亲的茶叶罐、还有几件没来得及刻款的新作。',
   '住客可以预约楼下工坊的打银体验。老师傅手把手教你拉丝，两个小时做出一枚歪歪扭扭的银片书签，他会认真签上字——「第七个学徒」。',
   '夜里巷子很静，偶尔传来一两声锤响。那是师傅在赶第二天的活，敲到十点就收工。'
 ),
 JSON_ARRAY(
   JSON_OBJECT('label', '银匠主题住宿', 'to', '/stay'),
   JSON_OBJECT('label', '先看银器', 'to', '/goods')
 ),
 2, 'PUBLISHED', '2026-08-11 09:00:00'),

('ZHU', 'zhu-meirenkao', 'ZHU · TERRACE', '美人靠上的下午',
 '吊脚楼挑出的那圈栏杆叫美人靠，白天晒谷子，晚上坐着看对门山。',
 '/images/067_rural-courtyard-homestay-next-to-green-ric_4140dcb7.jpg',
 '坐一下午，看云影一格格移过梯田。',
 JSON_ARRAY(
   '吊脚楼二层外沿挑出一圈带靠背的栏杆，苗家人叫它美人靠。农忙时上面摊着新收的稻谷，农闲时是一家人吃饭歇脚的地方。',
   '靠上去的角度是按人体改过的，腰背刚好有依托。坐一下午，看对面山坡上的云影一格格移过去，梯田从亮绿变成墨绿。',
   '乌东几家庭院民宿保留着原样的美人靠，房间里不装电视。老板娘说，来这里的人需要的不是更多节目。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '挑一间院子', 'to', '/stay')),
 3, 'PUBLISHED', '2026-08-12 09:00:00');

-- ---------------- 行 XING ----------------
INSERT INTO `wudong_common_story`
  (`module`, `slug`, `eyebrow`, `title`, `summary`, `cover`, `quote`, `paragraphs`, `links`, `sort`, `status`, `published_at`)
VALUES
('XING', 'xing-entry-ritual', 'XING · ENTRY', '入寨先过芦笙场',
 '进乌东要先在芦笙场受一场迎宾礼。鼓藏头家的门为客人开，梯田步道从寨中穿过。',
 '/images/073_miao-village-panorama-wooden-houses-terrac_73fc9c31.jpg',
 '进了芦笙场，才算到了乌东。',
 JSON_ARRAY(
   '芦笙场在寨子正中，铺着青石板。节庆时这里是迎宾的地方，四支芦笙同时吹起来，穿盛装的姑娘在场上绕圈，客人在圈外被请进去，就算入了寨。',
   '鼓藏头是寨里管祭祀的长者。他的家就在芦笙场上方，堂屋梁上挂着鼓藏节的旧物。游人上门，主人一般会递一杯茶。',
   '从芦笙场往西是梯田步道，三百来级石阶，走完大约四十分钟。沿途能看见晒谷场、老井和几株护寨树。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '看景区与门票', 'to', '/trip')),
 0, 'PUBLISHED', '2026-08-13 09:00:00'),

('XING', 'xing-lusheng-festival', 'XING · FESTIVAL', '芦笙一响，全寨放假',
 '苗年是乌东最隆重的节。芦笙大赛、斗牛观礼、篝火夜歌，连着热闹三天。',
 '/images/108_lusheng-instrument-miao-festival-performan_4998ae57.jpg',
 '芦笙一响，全寨子就放假了。',
 JSON_ARRAY(
   '苗年在每年十一月中旬，前后共三天。头一天迎苗年：入寨仪式、盛装巡游、长桌宴。全寨人换上绣花衣，银饰从脖子戴到手腕。',
   '第二天最热闹。芦笙场上有大赛，各寨的芦笙队轮番上场，比音准也比衣裳；下午在斗牛场观礼，牛角相碰时围观的人一起喊。',
   '夜里在广场点篝火，唱古歌、跳踩歌堂，一直闹到后半夜。第三天是鼓藏节俗体验与非遗市集，热闹完，就准备送客了。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '苗年三日路线', 'to', '/trip')),
 1, 'PUBLISHED', '2026-08-14 09:00:00'),

('XING', 'xing-leigongshan', 'XING · HIKING', '雷公山的八公里',
 '苗岭主峰海拔 2178 米。秃杉林像绿色的教堂，山脊上风把云吹成一匹一匹的白布。',
 '/images/074_mountain-forest-park-misty-peaks-boardwalk_3b70feb8.jpg',
 '你们脚底下踩的都是药材书。',
 JSON_ARRAY(
   '雷公山距乌东十二公里，主峰海拔 2178 米，夏季平均气温 22℃。从山门进，走小环线约八公里，半天可以走完。',
   '林子里最多的是秃杉。树干笔直，抬头看不到顶，向导老杨认得每一种鸟叫。他说山里有一千七百多种种子植物，「你们脚底下踩的都是药材书」。',
   '过了观佛台就是山脊草甸，风大，云从脚边过。运气好能遇上佛光——影子落在云上，外圈一道彩环。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '徒步路线与门票', 'to', '/trip')),
 2, 'PUBLISHED', '2026-08-15 09:00:00'),

('XING', 'xing-silver-lane', 'XING · WALK', '银匠巷的半日',
 '半日步行路线：芦笙场、银匠巷、蓝染坊、晒谷场。慢慢走，四个地方，一下午刚好。',
 '/images/075_day-tour-village-walking-path-silversmith-_899aa3fb.jpg',
 '两百米的巷子，一下午走不完。',
 JSON_ARRAY(
   '从寨门进，先在芦笙场停十分钟；往北拐进银匠巷，两百米的巷子里开着七八家铺子，炉火从早烧到晚。',
   '巷子中段是蓝染坊，院子里晾着刚出缸的布，蓝从深到浅排成一排。可以进去看阿榜姐点蜡，也可以坐下自己染一块。',
   '再往西上几级台阶是晒谷场，傍晚有小孩在场上打球。坐在场边的石头上，能看见对面梯田的日落。'
 ),
 JSON_ARRAY(JSON_OBJECT('label', '一日漫游路线', 'to', '/trip')),
 3, 'PUBLISHED', '2026-08-16 09:00:00');
