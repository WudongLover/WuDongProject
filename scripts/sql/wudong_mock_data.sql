USE `wudong`;
SET NAMES utf8mb4;

INSERT INTO `wudong_common_banner` (`id`,`title`,`subtitle`,`image`,`link`,`sort`,`enabled`) VALUES
(1, '银饰锻造之声', '百年炉火不熄，乌东银匠村', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close-up+of+Miao+silver+headdress+jewelry+craftsmanship+dark+moody+lighting&image_size=landscape_16_9', '/goods', 1, 1),
(2, '梯田云海之间', '住进吊脚楼，推开窗就是苗岭晨雾', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green+rice+terraces+and+morning+mist+over+mountain+village+aerial+view&image_size=landscape_16_9', '/stay', 2, 1),
(3, '长桌宴上百家菜', '酸汤鱼、糯米酒与芦笙歌', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+long+table+banquet+with+many+dishes+warm+lantern+light+festival&image_size=landscape_16_9', '/food', 3, 1);

INSERT INTO `wudong_common_announcement` (`id`,`content`,`sort`,`enabled`) VALUES
(1, '「苗年节」11 月中旬启幕，路线套餐早鸟立减 100 元', 1, 1),
(2, '新用户注册即领 30 元文旅礼包', 2, 1),
(3, '乌东非遗工坊体验课每周三、周六开班', 3, 1);

INSERT INTO `wudong_common_search_keyword` (`id`,`keyword`,`heat`,`enabled`) VALUES
(1, '银饰', 1000, 1),
(2, '长桌宴', 800, 1),
(3, '云海民宿', 750, 1),
(4, '苗年节', 600, 1),
(5, '蓝染体验', 500, 1),
(6, '酸汤鱼', 450, 1);

INSERT INTO `wudong_common_user` (`id`,`phone`,`password_hash`,`name`,`avatar`,`bio`,`status`) VALUES
(1, '13800001234', '', '山间旅人', 'avatar_u0', '想去有云的地方', 'ENABLED'),
(2, '13800001111', '', '追云者', 'avatar_u1', '在山里找到安静', 'ENABLED'),
(3, '13800002222', '', '麦子', 'avatar_u2', '带孩子看世界', 'ENABLED'),
(4, '13800003333', '', '旅人手记', 'avatar_u3', '慢慢走，欣赏啊', 'ENABLED'),
(5, '13800004444', '', '南方有雨', 'avatar_u4', '胶片与蓝染', 'ENABLED'),
(6, '13800005555', '', '带娃去看山', 'avatar_u5', '亲子徒步中', 'ENABLED');

INSERT INTO `wudong_common_merchant` (`id`,`name`,`logo`,`contact_phone`,`intro`,`status`) VALUES
(1, '乌东银铺 · 杨光银', '', '13800000001', '杨光银银饰工坊', 'ENABLED'),
(2, '乌东特产合作社', '', '13800000002', '乌东村合作社统一生产', 'ENABLED'),
(3, '乌东服饰工坊', '', '13800000003', '百鸟衣改良礼服', 'ENABLED'),
(4, '乌东旅行社', '', '13800000004', '路线套餐服务', 'ENABLED'),
(5, '云雾长桌宴', '', '13800000005', '长桌宴餐饮', 'ENABLED'),
(6, '梯田人家', '', '13800000006', '稻田景观农家菜', 'ENABLED'),
(7, '阿婆火塘', '', '13800000007', '火塘烤肉夜话', 'ENABLED'),
(8, '锦鸡轩茶餐', '', '13800000008', '新中式茶点', 'ENABLED'),
(9, '枕云山舍', '', '13800000009', '观云海民宿', 'ENABLED'),
(10, '银匠世家客栈', '', '13800000010', '银匠主题客栈', 'ENABLED'),
(11, '稻田畔的院子', '', '13800000011', '亲子友好民宿', 'ENABLED'),
(12, '雾里 · 悬廊民宿', '', '13800000012', '设计感悬空茶廊', 'ENABLED'),
(13, '乌东苗寨景区', '', '13800000013', '景区管理', 'ENABLED'),
(14, '雷公山国家森林公园', '', '13800000014', '森林公园管理', 'ENABLED');

INSERT INTO `wudong_common_address` (`id`,`user_id`,`name`,`phone`,`region`,`detail`,`is_default`) VALUES
(1, 1, '刘一', '138****1234', '广东省 广州市 天河区', '珠江新城华夏路 26 号 1201', 1),
(2, 1, '刘一', '138****1234', '贵州省 黔东南州 雷山县', '乌东村三组 24 号（假期收货）', 0);

INSERT INTO `wudong_m1_category` (`id`,`module`,`name`,`sort`) VALUES
(1, 'GOODS', '银饰', 1),
(2, 'GOODS', '蜡染', 2),
(3, 'GOODS', '刺绣', 3),
(4, 'GOODS', '苗族服饰', 4),
(5, 'SPECIALTY', '茶叶', 1),
(6, 'SPECIALTY', '腊肉', 2),
(7, 'SPECIALTY', '米酒', 3),
(8, 'SPECIALTY', '酸食', 4),
(9, 'SPECIALTY', '其他', 5);

INSERT INTO `wudong_m1_product` (`id`,`module`,`category_id`,`merchant_id`,`title`,`subtitle`,`price`,`market_price`,`sales`,`rating`,`stock`,`cover`,`images`,`detail`,`craft`,`artisan`,`origin`,`shelf_life`,`status`) VALUES
(1, 'GOODS', 1, 1, '手工苗银花丝手镯', '拉丝掐花 · 蝶恋花项圈纹', 868.00, 1080, 231, 4.9, 12, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted+Miao+silver+filigree+bracelet+on+dark+indigo+linen&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted+Miao+silver+filigree+bracelet+on+dark+indigo+linen&image_size=square_hd", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted+Miao+silver+filigree+bracelet+on+dark+indigo+linen&image_size=square", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted+Miao+silver+filigree+bracelet+on+dark+indigo+linen&image_size=square"]', '足银 999，手工锻制，附传承人亲签证书与防氧化收纳袋。圈口可凭手围定制，工期 7-10 天。佩戴建议：避免与硫磺皂接触，沐浴时取下；定期用擦银布护理可保持雪亮光泽。', '花丝工艺需将银条拉成发丝般的细丝，再掐、填、攒、焊成型。一只手镯需经三十余道工序、七天锤炼，蝶恋花纹样取自苗族古歌中的蝴蝶妈妈。', '{\"name\":\"杨光银\",\"title\":\"州级银饰锻造技艺传承人\"}', NULL, NULL, 'ON_SHELF'),
(2, 'GOODS', 2, 2, '靛蓝植物染方巾', '板蓝根蓝染 · 冰裂纹', 128.00, 168, 512, 4.8, 40, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo+blue+batik+square+scarf+folded+crackle+texture+pattern&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo+blue+batik+square+scarf+folded+crackle+texture+pattern&image_size=square_hd", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo+blue+batik+square+scarf+folded+crackle+texture+pattern&image_size=square", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo+blue+batik+square+scarf+folded+crackle+texture+pattern&image_size=square"]', '纯棉加厚纱巾，植物染无固色剂，初期会有轻微浮色属正常现象。冷水单独手洗，阴干。', '以板蓝根发酵建蓝靛缸，布入缸七浸七晾，氧化转蓝。蜡刀点画的铜鼓纹在脱蜡后留下永不重复的冰裂纹。', '{\"name\":\"阿榜\",\"title\":\"蜡染合作社带头人\"}', NULL, NULL, 'ON_SHELF'),
(3, 'GOODS', 3, 3, '破线绣双龙捧寿壁挂', '八股丝破线 · 平绣堆绣结合', 1680.00, NULL, 46, 5.0, 3, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful+Miao+embroidery+dragon+wall+hanging+textile+art&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful+Miao+embroidery+dragon+wall+hanging+textile+art&image_size=square_hd", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful+Miao+embroidery+dragon+wall+hanging+textile+art&image_size=square"]', '含实木框与挂件，附收藏证书。画面为纯手工绣制，交付周期约 30 天。', '破线绣将一根丝线破成八至十六股，绣面如缎似瓷。双龙捧寿为清水江流域苗绣经典题材，一幅需绣娘伏案四个月。', '{\"name\":\"潘玉珍\",\"title\":\"省级苗绣代表性传承人\"}', NULL, NULL, 'ON_SHELF'),
(4, 'GOODS', 4, 3, '百鸟衣改良礼服', '非遗元素 × 现代剪裁', 2680.00, 3280, 89, 4.7, 6, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+fashion+dress+with+Miao+embroidery+elements+on+mannequin&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+fashion+dress+with+Miao+embroidery+elements+on+mannequin&image_size=square_hd", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+fashion+dress+with+Miao+embroidery+elements+on+mannequin&image_size=square"]', '以丹寨百鸟衣纹样为灵感，真丝欧根纱手工缀绣鸟纹，裙摆内衬足银丝滚边。礼服可租赁体验（详情咨询客服）。', NULL, NULL, NULL, NULL, 'ON_SHELF'),
(5, 'GOODS', 1, 1, '苗银蝴蝶妈妈耳坠', '轻量日常款 · 3.2g/只', 328.00, NULL, 677, 4.9, 25, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicate+silver+butterfly+earrings+on+linen+cloth&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicate+silver+butterfly+earrings+on+linen+cloth&image_size=square_hd"]', '925 银镀铑防氧化，附礼品盒。', '蝴蝶妈妈是苗族创世神话中万物之母。耳坠仅 3.2 克，日常佩戴无负担。', NULL, NULL, NULL, 'ON_SHELF'),
(6, 'GOODS', 2, 2, '铜鼓纹蜡染桌旗', '手工点蜡 · 2.2m 长幅', 388.00, NULL, 124, 4.8, 15, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo+batik+table+runner+with+bronze+drum+pattern+on+wooden+table&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo+batik+table+runner+with+bronze+drum+pattern+on+wooden+table&image_size=square_hd"]', '棉麻混纺，桌面陈设或茶席皆宜。', '铜鼓纹是苗族迁徙史诗的图腾记忆，中心太阳纹象征祖先故土。', NULL, NULL, NULL, 'ON_SHELF'),
(7, 'GOODS', 3, 3, '数纱绣杯垫六件套', '几何挑花 · 入门收藏', 98.00, NULL, 923, 4.6, 60, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=set+of+six+geometric+embroidered+coasters+colorful&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=set+of+six+geometric+embroidered+coasters+colorful&image_size=square_hd"]', '数纱绣按布纹经纬数纱挑绣，纹样为各地苗寨支系图谱，六片各不相同。', NULL, NULL, NULL, NULL, 'ON_SHELF'),
(8, 'GOODS', 1, 1, '银饰体验课 · 亲子半日', '亲手打一枚银戒指（乌东本地）', 268.00, NULL, 342, 4.9, 10, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parent+and+child+making+silver+ring+at+crafting+workshop&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parent+and+child+making+silver+ring+at+crafting+workshop&image_size=square_hd"]', '每场限 6 组家庭，请提前 2 天预约。到店体验，不发货。', '杨师傅手把手教学：熔银、锻打、退火、抛光，成品戒指带走。含全套工具与围裙。', NULL, NULL, NULL, 'ON_SHELF'),
(9, 'SPECIALTY', 5, 2, '雷山银球茶 · 明前特级', '高山云雾茶 · 100g 罐装', 158.00, 198, 1204, 4.9, 80, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green+tea+pearls+in+ceramic+jar+with+tea+cup&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green+tea+pearls+in+ceramic+jar+with+tea+cup&image_size=square_hd", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green+tea+pearls+in+ceramic+jar+with+tea+cup&image_size=square"]', '独芽一叶，手工揉制成球状。冲泡时银球徐徐舒展，汤色嫩绿透亮，栗香带甜。曾获轻工部优秀新产品奖。', NULL, NULL, '乌东村后山茶园 · 海拔 1300m', '18 个月（避光密封）', 'ON_SHELF'),
(10, 'SPECIALTY', 6, 2, '柴火烟熏腊肉', '柏枝熏 45 天 · 500g 袋装', 88.00, NULL, 866, 4.8, 45, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smoked+cured+pork+hanging+with+hemp+rope+rustic&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smoked+cured+pork+hanging+with+hemp+rope+rustic&image_size=square_hd"]', '岁末宰杀，柏枝混橘皮冷熏 45 天。切片蒸食或炒蒜苗，肥肉透明不腻。', NULL, NULL, '乌东村二组 · 农户自养黑毛猪', '6 个月（冷冻）', 'ON_SHELF'),
(11, 'SPECIALTY', 7, 2, '苗家糯米酒', '陶坛 1.5L · 12 度微醺', 68.00, NULL, 543, 4.7, 60, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice+wine+in+ceramic+jars+with+red+paper+seal&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice+wine+in+ceramic+jars+with+red+paper+seal&image_size=square_hd"]', '高山糯米配山泉水，古法酒曲发酵。入口绵甜，后劲温柔。', NULL, NULL, '乌东村三组 · 吴家酒坊', '12 个月', 'ON_SHELF'),
(12, 'SPECIALTY', 8, 2, '红酸汤底料', '毛辣果发酵 · 400g × 2 袋', 45.00, NULL, 1532, 4.8, 100, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red+sour+soup+paste+in+vacuum+package+with+tomatoes&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red+sour+soup+paste+in+vacuum+package+with+tomatoes&image_size=square_hd"]', '野生小番茄（毛辣果）自然发酵 30 天，不添加番茄酱。在家 10 分钟复刻凯里酸汤鱼。', NULL, NULL, '乌东村合作社统一生产', '9 个月', 'ON_SHELF'),
(13, 'SPECIALTY', 8, 2, '手打糍粑', '纯糯米 · 8 个装真空', 38.00, NULL, 721, 4.6, 50, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round+sticky+rice+cakes+stacked+with+wooden+mold&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round+sticky+rice+cakes+stacked+with+wooden+mold&image_size=square_hd"]', '木槌轮流捶打一小时成型。煎软后蘸黄豆面或炭火烤胀，是苗寨孩子最深的年味记忆。', NULL, NULL, '乌东村 · 节庆作坊', '30 天（冷冻 3 个月）', 'ON_SHELF'),
(14, 'SPECIALTY', 9, 2, '蜂蜜 · 百花秋蜜', '中华土蜂蜜 · 500g', 128.00, NULL, 389, 4.9, 30, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=honey+jar+with+honeycomb+and+wooden+dipper&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=honey+jar+with+honeycomb+and+wooden+dipper&image_size=square_hd"]', '中华蜂采集秋冬季百花，一年只割一次。结晶细腻，冲水微酸回甘。', NULL, NULL, '乌东村后山蜂场 · 一年一取', '24 个月', 'ON_SHELF');

INSERT INTO `wudong_m1_sku` (`id`,`product_id`,`name`,`price`,`stock`) VALUES
(1, 1, '中号 · 圈口 58mm', 868.00, 8),
(2, 1, '大号 · 圈口 62mm', 928.00, 4),
(3, 2, '53cm 方巾', 128.00, 30),
(4, 2, '90cm 大方巾', 228.00, 10),
(5, 3, '60 × 90cm 含木框', 1680.00, 3),
(6, 4, 'S (155/80A)', 2680.00, 2),
(7, 4, 'M (160/84A)', 2680.00, 3),
(8, 4, 'L (165/88A)', 2680.00, 1),
(9, 5, '单对装', 328.00, 25),
(10, 6, '33 × 220cm', 388.00, 15),
(11, 7, '六件套礼盒', 98.00, 60),
(12, 8, '1 大 1 小（周三场）', 268.00, 5),
(13, 8, '1 大 1 小（周六场）', 298.00, 5),
(14, 9, '100g 罐装', 158.00, 60),
(15, 9, '100g × 2 礼盒', 298.00, 20),
(16, 10, '五花肉 500g', 88.00, 30),
(17, 10, '猪脚 750g', 108.00, 15),
(18, 11, '原味 1.5L', 68.00, 40),
(19, 11, '杨梅味 1.5L', 78.00, 20),
(20, 12, '400g × 2 袋', 45.00, 100),
(21, 13, '8 个装', 38.00, 50),
(22, 14, '500g 玻璃瓶', 128.00, 30);

INSERT INTO `wudong_m2_restaurant` (`id`,`merchant_id`,`name`,`cover`,`images`,`rating`,`price_per_capita`,`address`,`hours`,`capacity`,`tags`,`intro`,`status`) VALUES
(1, 5, '云雾长桌宴', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+long+table+banquet+red+lanterns+wooden+stilt+house+interior&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+long+table+banquet+red+lanterns+wooden+stilt+house+interior&image_size=landscape_16_9", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+long+table+banquet+red+lanterns+wooden+stilt+house+interior&image_size=landscape_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+long+table+banquet+red+lanterns+wooden+stilt+house+interior&image_size=landscape_4_3"]', 4.8, 88.00, '乌东村鼓楼坪东侧 · 1 号木楼', '11:00 - 14:00 / 17:00 - 21:00', 120, '["长桌宴", "酸汤鱼", "芦笙敬酒歌"]', '三十六米长桌沿木楼一字排开，酸汤鱼用高山泉水与毛辣果发酵整整三日。', 'ENABLED'),
(2, 6, '梯田人家', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farmhouse+restaurant+terrace+overlooking+rice+paddies&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farmhouse+restaurant+terrace+overlooking+rice+paddies&image_size=landscape_16_9"]', 4.7, 56.00, '乌东村西梯田步道口', '10:30 - 20:30', 60, '["稻田景观位", "农家菜"]', '老板是村里的种粮大户，稻田鸭、田埂鱼都是自家田里现抓。', 'ENABLED'),
(3, 7, '阿婆火塘', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy+indoor+fire+pit+dining+room+rustic+wooden+benches&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy+indoor+fire+pit+dining+room+rustic+wooden+benches&image_size=landscape_16_9"]', 4.9, 45.00, '乌东村四组巷内', '16:00 - 23:00', 30, '["火塘烤肉", "夜话"]', '天黑后推开阿婆家的门，火塘上挂着正在滴油的腊肉。', 'ENABLED'),
(4, 8, '锦鸡轩茶餐', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant+tea+house+restaurant+interior+wooden+lattice+windows&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant+tea+house+restaurant+interior+wooden+lattice+windows&image_size=landscape_16_9"]', 4.6, 66.00, '乌东村游客中心二层', '09:00 - 18:00', 40, '["新中式", "茶点"]', '老宅改造成的清雅茶空间，雷山银球茶入馔。', 'ENABLED');

INSERT INTO `wudong_m2_dish` (`id`,`restaurant_id`,`name`,`price`,`img`,`is_signature`,`sort`) VALUES
(1, 1, '凯里红酸汤鱼（稻田鲤）', 128.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sour+soup+fish+hotpot&image_size=square', 1, 1),
(2, 1, '柴火烟熏腊肉', 58.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smoked+cured+pork+slices+plate&image_size=square', 1, 2),
(3, 1, '糯米五彩饭', 28.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=five+color+glutinous+rice&image_size=square', 0, 3),
(4, 1, '凉拌折耳根', 18.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cold+dish+houttuynia+root+salad&image_size=square', 0, 4),
(5, 1, '自酿杨梅汤', 16.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bayberry+drink+glass+red&image_size=square', 0, 5),
(6, 2, '田埂稻花鱼', 88.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice+field+fish+dish&image_size=square', 1, 1),
(7, 2, '柴火土鸡汤', 78.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chicken+soup+clay+pot&image_size=square', 1, 2),
(8, 2, '清炒时蔬', 22.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir+fried+vegetables+plate&image_size=square', 0, 3),
(9, 3, '火塘烤五花', 48.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grilled+pork+belly+over+fire&image_size=square', 1, 1),
(10, 3, '烤糍粑蘸黄豆面', 15.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grilled+sticky+rice+cake&image_size=square', 0, 2),
(11, 3, '陶罐米酒（一壶）', 38.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice+wine+ceramic+pot&image_size=square', 1, 3),
(12, 4, '银球茶香鸡', 68.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tea+flavored+chicken+dish+elegant&image_size=square', 1, 1),
(13, 4, '茶汤嫩豆腐', 32.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tofu+in+green+tea+broth&image_size=square', 0, 2),
(14, 4, '苗家九宫格点心', 58.00, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nine+grid+dessert+dim+sum&image_size=square', 1, 3);

INSERT INTO `wudong_m2_time_slot` (`id`,`restaurant_id`,`name`,`capacity`,`sort`) VALUES
(1, 1, '午餐 11:30 - 13:30', 40, 1),
(2, 1, '晚餐 17:30 - 19:30', 40, 2),
(3, 1, '晚宴 19:30 - 21:30', 20, 3),
(4, 2, '午餐 11:00 - 13:00', 20, 1),
(5, 2, '晚餐 17:30 - 19:30', 20, 2),
(6, 3, '夜场 17:00 - 19:00', 15, 1),
(7, 3, '夜场 19:00 - 21:00', 15, 2),
(8, 4, '午市 11:30 - 13:30', 20, 1),
(9, 4, '下午茶 14:00 - 16:30', 20, 2);

INSERT INTO `wudong_m3_homestay` (`id`,`merchant_id`,`name`,`cover`,`images`,`rating`,`score`,`tags`,`facilities`,`address`,`intro`,`notice`,`status`) VALUES
(1, 9, '枕云山舍', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden+stilt+house+guesthouse+on+hillside+with+sea+of+clouds+view&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden+stilt+house+guesthouse+on+hillside+with+sea+of+clouds+view&image_size=landscape_16_9"]', 4.9, '{"hygiene":4.9,"location":4.8,"service":4.9}', '["吊脚楼", "观云海", "含早"]', '["WiFi", "空调", "独立卫浴", "观景露台", "苗族特色早餐", "停车场"]', '乌东村东头半山（观景台旁 50m）', '老木楼改造的八间客房，每间都朝向梯田。清晨云海漫过窗棂。', '入住 14:00 后 · 离店 12:00 前 · 不接待宠物 · 押金 100 元', 'ENABLED'),
(2, 10, '银匠世家客栈', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional+courtyard+inn+with+silver+craft+decorations&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional+courtyard+inn+with+silver+craft+decorations&image_size=landscape_16_9"]', 4.8, '{"hygiene":4.8,"location":4.9,"service":4.7}', '["银匠主题", "步行街心"]', '["WiFi", "空调", "独立卫浴", "银饰体验", "茶室"]', '乌东村银匠巷 6 号', '老银匠家的宅子改的客栈，堂屋陈列着三代人的银器。', '入住 14:00 后 · 离店 12:00 前 · 含茶艺体验', 'ENABLED'),
(3, 11, '稻田畔的院子', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural+courtyard+homestay+next+to+green+rice+field&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural+courtyard+homestay+next+to+green+rice+field&image_size=landscape_16_9"]', 4.7, '{"hygiene":4.7,"location":4.6,"service":4.8}', '["亲子友好", "火塘夜话"]', '["WiFi", "空调", "独立卫浴", "儿童托管", "火塘"]', '乌东村西梯田旁', '院子外就是稻田，夏夜能听到蛙声一片。', '入住 15:00 后 · 离店 11:30 前 · 可加购晚餐', 'ENABLED'),
(4, 12, '雾里 · 悬廊民宿', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+minimalist+wooden+architecture+cantilever+terrace+forest&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+minimalist+wooden+architecture+cantilever+terrace+forest&image_size=landscape_16_9"]', 4.9, '{"hygiene":5.0,"location":4.7,"service":4.9}', '["设计感", "悬空茶廊", "spa"]', '["WiFi", "空调", "独立卫浴", "落地窗", "茶廊", "spa"]', '乌东村北 · 松林垭口', '请了黔东南本土设计团队，把一条悬空茶廊架在松林之上。', '入住 15:00 后 · 离店 12:00 前 · 成人优先 · 全屋禁烟', 'ENABLED');

INSERT INTO `wudong_m3_room_type` (`id`,`homestay_id`,`name`,`bed`,`area`,`max_guests`,`price`,`stock`,`cover`,`facilities`) VALUES
(1, 1, '苗族木屋大床房', '1.8m 大床', 26, 2, 488.00, 3, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy+wooden+bedroom+indigo+fabric+headboard&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴", "观景窗"]'),
(2, 1, '云海亲子房', '1.5m + 1.2m 双床', 32, 3, 628.00, 2, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family+room+wooden+house+two+beds+warm&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴", "露台"]'),
(3, 2, '花丝主题大床房', '1.8m 大床', 24, 2, 428.00, 4, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant+chinese+style+bedroom+silver+details&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴"]'),
(4, 2, '梯田景观双床房', '1.2m 双床', 28, 2, 468.00, 3, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=twin+bedroom+wooden+interior+valley+view&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴", "观景窗"]'),
(5, 3, '稻香家庭套房', '1.8m + 1.2m', 38, 4, 728.00, 2, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family+suite+bedroom+wooden+cozy&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴", "小客厅"]'),
(6, 3, '蛙声标间', '1.35m 双床', 22, 2, 368.00, 5, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple+clean+twin+bedroom+bright&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴"]'),
(7, 4, '松雾全景大床房', '2m 大床', 35, 2, 888.00, 2, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=panoramic+window+bedroom+forest+view+minimalist&image_size=landscape_4_3', '["WiFi", "空调", "独立卫浴", "落地窗", "浴缸"]');

INSERT INTO `wudong_m4_scenic` (`id`,`name`,`cover`,`open_time`,`address`,`intro`,`rating`,`status`) VALUES
(1, '乌东苗寨景区', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+village+panorama+wooden+houses+terraces+valley&image_size=landscape_16_9', '08:30 - 18:00', '雷山县乌东村', '中国传统村落、苗族银饰之乡。芦笙场、鼓藏头家、梯田步道与百年银匠铺散落寨中。', 4.8, 'ENABLED'),
(2, '雷公山国家森林公园', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain+forest+park+misty+peaks+boardwalk&image_size=landscape_16_9', '08:00 - 17:30', '雷山县境 · 距乌东 12km', '苗岭主峰，海拔 2178m。原始秃杉林与云海佛光，避暑季平均气温 22℃。', 4.7, 'ENABLED');

INSERT INTO `wudong_m4_ticket` (`id`,`scenic_id`,`name`,`price`,`stock`,`note`) VALUES
(1, 1, '成人票', 60.00, 200, '含芦笙场迎宾仪式'),
(2, 1, '学生/儿童票', 30.00, 100, '凭学生证，1.2m 以下免票'),
(3, 1, '家庭套票（2大1小）', 138.00, 50, '含非遗工坊体验券 1 张'),
(4, 2, '成人票（含观光车）', 90.00, 300, '观光车通票'),
(5, 2, '成人票', 70.00, 300, '不含观光车');

INSERT INTO `wudong_m4_route` (`id`,`merchant_id`,`title`,`cover`,`days`,`theme`,`price`,`sales`,`rating`,`departure`,`includes`,`notice`,`status`) VALUES
(1, 4, '苗寨漫游记 · 一日精华', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=day+tour+village+walking+path+silversmith+workshop&image_size=landscape_16_9', 1, '文化体验', 298.00, 412, 4.8, '凯里南站集合', '["景区门票", "长桌宴午餐", "银饰体验课", "讲解服务", "旅游保险"]', '["最少提前 1 天预订", "6 人成团，未成团全额退"]', 'ON_SHELF'),
(2, 4, '苗岭深处 · 两日深度', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=two+day+hiking+trail+mountain+village+sunrise&image_size=landscape_16_9', 2, '户外徒步', 798.00, 268, 4.9, '贵阳/凯里均可集合', '["门票", "一晚民宿", "三正一早", "徒步向导", "保险"]', '["最少提前 1 天预订", "徒步约 8km/天"]', 'ON_SHELF'),
(3, 4, '小摄影师的苗寨 · 亲子研学', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children+photography+workshop+village+kids+playing&image_size=landscape_16_9', 2, '亲子研学', 1280.00, 156, 4.9, '凯里南站集合', '["门票", "一晚亲子房", "全程跟拍", "摄影课", "非遗手作材料", "保险"]', '["适合 5-12 岁儿童家庭", "每期限 6 组家庭"]', 'ON_SHELF'),
(4, 4, '苗年节庆 · 三日狂欢', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=festival+celebration+lusheng+dance+colorful+costumes+night&image_size=landscape_16_9', 3, '节庆限定', 1880.00, 89, 5.0, '凯里南站集合', '["门票", "两晚民宿", "节庆观礼席", "长桌宴 ×2", "盛装体验半日", "保险"]', '["仅苗年期间（11 月中旬）开班", "名额紧张，建议提前 2 周预订"]', 'ON_SHELF');

INSERT INTO `wudong_m4_route_day` (`id`,`route_id`,`day`,`title`,`description`,`meals`,`stay`) VALUES
(1, 1, 1, '乌东一日精华', '上午：芦笙场迎宾 → 鼓藏头家做客 → 梯田步道；下午：银饰锻造体验 → 蓝染坊参观；傍晚：观景台日落 → 火塘油茶话别', '长桌宴午餐', '—'),
(2, 2, 1, '雷公山小环线', '秃杉林 → 观佛台 → 山脊草甸，全程 8km', '午/晚', '枕云山舍或同级'),
(3, 2, 2, '乌东慢寨', '云海晨观 → 蓝染体验 → 长桌宴后返程', '早/午', '—'),
(4, 3, 1, '发现苗寨的色彩', '取景构图课 → 银匠巷扫街 → 晒谷场黄昏', '午/晚', '稻田畔的院子'),
(5, 3, 2, '给妈妈拍张照', '晨雾梯田 → 蓝染手作 → 作品打印装框', '早/午', '—'),
(6, 4, 1, '迎苗年', '入寨仪式 → 盛装巡游 → 长桌宴', '午/晚', '寨内民宿'),
(7, 4, 2, '芦笙盛会', '芦笙场大赛 → 斗牛观礼 → 篝火夜歌', '早/午/晚', '寨内民宿'),
(8, 4, 3, '古歌与告别', '鼓藏节俗体验 → 非遗市集 → 返程', '早/午', '—');

INSERT INTO `wudong_m5_post` (`id`,`user_id`,`title`,`content`,`images`,`topic`,`place`,`likes`,`collects`,`views`,`status`,`published_at`) VALUES
(1, 2, '凌晨五点，云海漫进了我的窗', '管家阿姐五点轻轻敲了三下门，我裹着毯子爬上露台，山谷里的云正一寸寸往上漫。太阳出来的那十分钟，全寨子的人都在屋顶上安静地看着。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#云海时刻', '枕云山舍', 1286, 342, 8921, 'PASSED', '2026-08-28 00:00:00'),
(2, 4, '在银匠巷学了一晚上掐丝', '老爷子手把手教我拉丝，银条在他手里像面条一样听话，在我手里就是一根倔驴。两个小时只做出一枚歪歪扭扭的银片书签。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#非遗体验', '银匠世家客栈', 866, 210, 5320, 'PASSED', '2026-08-21 00:00:00'),
(3, 3, '长桌宴生存指南：先别吃鱼', '划重点：开席前会有敬酒歌，牛角杯递过来时手千万别碰杯（碰了就要喝完）！酸汤鱼要等汤滚三滚再下筷子。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#美食攻略', '云雾长桌宴', 2311, 1890, 15230, 'PASSED', '2026-08-15 00:00:00'),
(4, 5, '梯田日落，把整面墙都染成了金色', '从稻田人家露台看下去，稻浪一层推着一层往山脚下跑。老板说再过半个月就开镰了。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#梯田日落', '梯田人家', 977, 156, 6102, 'PASSED', '2026-08-10 00:00:00'),
(5, 6, '孩子亲手打的银戒指，他说是全世界最贵的', '亲子银饰课两个小时，儿子从熔银开始全程自己上手。戒指刻歪了一个字，他非要戴着不摘。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#亲子出行', '非遗工坊', 1532, 678, 9880, 'PASSED', '2026-08-05 00:00:00'),
(6, 5, '蓝染手记：一块布的七次深呼吸', '布在靛缸里进出七次，从黄绿到黛蓝。冰裂纹出现的瞬间全屋的人都哇了一声。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#非遗体验', '蓝染坊', 1244, 533, 7751, 'PASSED', '2026-07-30 00:00:00'),
(7, 4, '火塘夜话：阿婆讲了三个小时的古歌', '火塘上烤着糍粑，阿婆的苗语古歌混着米酒气。临走她塞给我两个烤糍粑。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#火塘夜话', '阿婆火塘', 845, 190, 4321, 'PASSED', '2026-07-22 00:00:00'),
(8, 2, '徒步雷公山：8 公里掉进云里三次', '秃杉林像巨大的绿色教堂，山脊上风把云吹成一匹一匹的白布。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#户外徒步', '雷公山', 1089, 655, 8120, 'PASSED', '2026-07-15 00:00:00'),
(9, 3, '一个人的乌东，被全寨子投喂的四天', '本想找个地方安静写稿，结果隔壁阿婆天天喊我吃饭。乌东的答案是：一个人来，绝不让你一个人走。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3", "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village+scene&image_size=portrait_4_3"]', '#独行日记', '乌东村', 3120, 2890, 24150, 'PASSED', '2026-07-08 00:00:00');

INSERT INTO `wudong_m5_comment` (`id`,`post_id`,`user_id`,`parent_id`,`reply_to_user_id`,`content`,`status`,`published_at`) VALUES
(1, 1, 5, NULL, NULL, '这张构图绝了，求机位！', 'PASSED', '2026-08-28 00:00:00'),
(2, 1, 3, NULL, NULL, '已经订了下个月的房间！', 'PASSED', '2026-08-29 00:00:00'),
(3, 1, 2, 1, 5, '枕云山舍三楼露台，记得带广角～', 'PASSED', '2026-08-28 00:00:00'),
(4, 2, 3, NULL, NULL, '书签上的锤纹好好看', 'PASSED', '2026-08-22 00:00:00'),
(5, 3, 2, NULL, NULL, '牛角杯不碰杯这个真的救大命了，谢谢！', 'PASSED', '2026-08-15 00:00:00'),
(6, 3, 5, NULL, NULL, '收藏了，下周就去实践', 'PASSED', '2026-08-16 00:00:00'),
(7, 5, 3, NULL, NULL, '已经开始规划带娃二刷了', 'PASSED', '2026-08-06 00:00:00'),
(8, 9, 4, NULL, NULL, '「绝不让你一个人走」，破防了', 'PASSED', '2026-07-09 00:00:00');

INSERT INTO `wudong_m5_post_like` (`post_id`,`user_id`) VALUES
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(2, 2),
(2, 3),
(2, 6),
(3, 2),
(3, 5),
(3, 6),
(4, 2),
(4, 3),
(5, 2),
(5, 3),
(5, 5),
(6, 2),
(6, 3),
(6, 4),
(7, 2),
(7, 5),
(8, 3),
(8, 4),
(8, 5),
(9, 2),
(9, 5),
(9, 6);

INSERT INTO `wudong_common_cart_item` (`id`,`user_id`,`product_id`,`sku_id`,`merchant_id`,`qty`,`checked`,`title`,`cover`,`sku_name`,`price`,`stock`,`shop_name`) VALUES
(1, 1, 1, 1, 1, 1, 1, '手工苗银花丝手镯', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted+Miao+silver+filigree+bracelet+on+dark+indigo+linen&image_size=square_hd', '中号 · 圈口 58mm', 868.00, 12, '乌东银铺 · 杨光银'),
(2, 1, 12, 20, 2, 2, 1, '红酸汤底料', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red+sour+soup+paste+in+vacuum+package+with+tomatoes&image_size=square_hd', '400g × 2 袋', 45.00, 100, '乌东特产合作社'),
(3, 1, 9, 15, 2, 1, 0, '雷山银球茶 · 明前特级', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green+tea+pearls+in+ceramic+jar+with+tea+cup&image_size=square_hd', '100g × 2 礼盒', 298.00, 20, '乌东特产合作社');

INSERT INTO `wudong_common_order` (`id`,`order_no`,`user_id`,`merchant_id`,`type`,`status`,`title`,`cover`,`summary`,`amount`,`qty`,`shop_name`,`created_at`) VALUES
(1, 'WD2609010001', 1, 9, 'LODGING', 'CONFIRMED', '枕云山舍 · 苗族木屋大床房', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden+stilt+house+guesthouse+on+hillside+with+sea+of+clouds+view&image_size=landscape_16_9', '09-29 入住 · 09-30 离店 · 2 晚', 976.00, 1, '枕云山舍', '2026-09-01 00:00:00'),
(2, 'WD2609020007', 1, 4, 'ROUTE', 'PAID', '苗寨漫游记 · 一日精华', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=day+tour+village+walking+path+silversmith+workshop&image_size=landscape_16_9', '10-02 出发 · 2 大 1 小', 814.00, 3, '乌东旅行社', '2026-09-02 00:00:00'),
(3, 'WD2609050012', 1, 1, 'GOODS', 'IN_PROGRESS', '手工苗银花丝手镯', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted+Miao+silver+filigree+bracelet+on+dark+indigo+linen&image_size=landscape_16_9', '中号 · 圈口 58mm × 1 · 已发货（顺丰）', 868.00, 1, '乌东银铺 · 杨光银', '2026-09-05 00:00:00'),
(4, 'WD2609060021', 1, 5, 'MEAL', 'UNPAID', '云雾长桌宴 · 餐位预订', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+long+table+banquet+red+lanterns+wooden+stilt+house+interior&image_size=landscape_16_9', '09-10 晚餐 17:30 场 · 4 人', 352.00, 4, '云雾长桌宴', '2026-09-06 00:00:00'),
(5, 'WD2608180033', 1, 13, 'TICKET', 'COMPLETED', '乌东苗寨景区 · 家庭套票', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao+village+panorama+wooden+houses+terraces+valley&image_size=landscape_16_9', '08-18 入园 · 2 大 1 小 · 已核销', 138.00, 3, '乌东苗寨景区', '2026-08-18 00:00:00'),
(6, 'WD2607220044', 1, 3, 'GOODS', 'REFUNDED', '百鸟衣改良礼服', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+fashion+dress+with+Miao+embroidery+elements+on+mannequin&image_size=landscape_16_9', '尺码不合 · 已全额退款', 2680.00, 1, '乌东服饰工坊', '2026-07-22 00:00:00');

INSERT INTO `wudong_common_message` (`id`,`user_id`,`type`,`title`,`content`,`is_read`,`related_type`,`related_id`,`created_at`) VALUES
(1, 1, 'ORDER', '订单已确认', '您预订的枕云山舍 · 苗族木屋大床房已获商家确认。', 0, 'ORDER', 'WD2609010001', '2026-09-01 10:24:00'),
(2, 1, 'ORDER', '包裹已发出', '您购买的手工苗银花丝手镯已由顺丰揽收。', 0, 'ORDER', 'WD2609050012', '2026-09-05 18:40:00'),
(3, 1, 'INTERACT', '收到新的点赞', '追云者赞了你的游记《一个人的乌东》。', 0, 'POST', '9', '2026-09-06 09:12:00'),
(4, 1, 'SYSTEM', '苗年节早鸟优惠开启', '苗年节庆 · 三日狂欢路线现已开放预订，前 50 名立减 100 元。', 1, NULL, NULL, '2026-09-06 08:00:00');

INSERT INTO `wudong_common_favorite` (`user_id`,`target_type`,`target_id`) VALUES
(1, 'GOODS', 1),
(1, 'HOMESTAY', 1),
(1, 'RESTAURANT', 1),
(1, 'ROUTE', 1),
(1, 'POST', 1),
(1, 'POST', 3);

INSERT INTO `wudong_common_recommend` (`id`,`position`,`target_type`,`target_id`,`sort`,`enabled`) VALUES
(1, 'HOME_GOODS', 'GOODS', 1, 1, 1),
(2, 'HOME_GOODS', 'GOODS', 2, 2, 1),
(3, 'HOME_GOODS', 'GOODS', 3, 3, 1),
(4, 'HOME_RESTAURANT', 'RESTAURANT', 1, 1, 1),
(5, 'HOME_RESTAURANT', 'RESTAURANT', 2, 2, 1),
(6, 'HOME_HOMESTAY', 'HOMESTAY', 1, 1, 1),
(7, 'HOME_HOMESTAY', 'HOMESTAY', 4, 2, 1),
(8, 'HOME_ROUTE', 'ROUTE', 1, 1, 1),
(9, 'HOME_POST', 'POST', 1, 1, 1),
(10, 'HOME_POST', 'POST', 9, 2, 1);