-- =====================================================================
-- 乌东文旅 · 数据库图片字段改写为阿里云 OSS 地址（增量脚本，可重复执行）
-- 生成时间：2026/9/11 17:35:11
-- 目标：https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/<文件名>
-- 覆盖：用户头像、Banner、推文封面、评价晒图、购物车/订单快照封面、
--       商品/餐厅/民宿/门票/路线/社区配图（含 JSON 数组与 artisan.avatar）
-- 来源：scripts/oss/migrate-images-to-oss.mjs --sql（由 image-map.ts 与本地图片推导，勿手改）
-- 前置：先用同脚本上传图片（--only=upload）；本脚本对老值幂等，重跑无副作用
-- 注意：未命中 image-map.ts 的外链（若干种子用户头像）不在此文件中，需补图后重新生成
-- 执行：mysql -h127.0.0.1 -P13306 -uroot -p < scripts/sql/wudong_images_to_oss.sql
-- =====================================================================

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE `wudong`.`wudong_common_banner` SET `image` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/001_close-up-of-miao-silver-headdress-jewelry-_b7835ee5.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_common_banner` SET `image` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/002_green-rice-terraces-and-morning-mist-over-_73264c88.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_common_banner` SET `image` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/003_miao-long-table-banquet-with-many-dishes-w_4be11336.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_common_cart_item` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_common_cart_item` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/055_red-sour-soup-paste-in-vacuum-package-with_458ffbc5.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_common_cart_item` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/051_green-tea-pearls-in-ceramic-jar-with-tea-c_b5337b54.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_common_order` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/058_wooden-stilt-house-guesthouse-on-hillside-_34dbacb7.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_common_order` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/075_day-tour-village-walking-path-silversmith-_899aa3fb.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_common_order` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_common_order` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/028_miao-long-table-banquet-red-lanterns-woode_51d465df.jpg' WHERE `id` = 4;
UPDATE `wudong`.`wudong_common_order` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/073_miao-village-panorama-wooden-houses-terrac_73fc9c31.jpg' WHERE `id` = 5;
UPDATE `wudong`.`wudong_common_order` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg' WHERE `id` = 6;
UPDATE `wudong`.`wudong_common_order_item` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_common_order_item` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/014_chinese-woman-avatar-illustration-minimal-_5d29a078.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/027_chinese-man-avatar-illustration-minimal-gl_478338fc.jpg' WHERE `id` = 7;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/042_chinese-woman-avatar-illustration-minimal_f738a687.jpg' WHERE `id` = 10;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/042_chinese-woman-avatar-illustration-minimal_f738a687.jpg' WHERE `id` = 12;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/063_chinese-man-avatar-illustration-minimal-ca_fb03d20e.jpg' WHERE `id` = 14;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/042_chinese-woman-avatar-illustration-minimal_f738a687.jpg' WHERE `id` = 15;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/014_chinese-woman-avatar-illustration-minimal-_5d29a078.jpg' WHERE `id` = 16;
UPDATE `wudong`.`wudong_common_review` SET `user_avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/072_chinese-man-avatar-illustration-minimal-sc_9387371a.jpg' WHERE `id` = 17;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/010_indigo-blue-batik-square-scarf-folded-crac_7c8bb2d7.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/015_colorful-miao-embroidery-dragon-wall-hangi_48870d33.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg' WHERE `id` = 4;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/003_miao-long-table-banquet-with-many-dishes-w_4be11336.jpg' WHERE `id` = 5;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/055_red-sour-soup-paste-in-vacuum-package-with_458ffbc5.jpg' WHERE `id` = 6;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/043_cozy-indoor-fire-pit-dining-room-rustic-wo_dc72ca13.jpg' WHERE `id` = 7;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/054_rice-wine-in-ceramic-jars-with-red-paper-s_2e71d2b6.jpg' WHERE `id` = 8;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/058_wooden-stilt-house-guesthouse-on-hillside-_34dbacb7.jpg' WHERE `id` = 9;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/002_green-rice-terraces-and-morning-mist-over-_73264c88.jpg' WHERE `id` = 10;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/064_traditional-courtyard-inn-with-silver-craf_034de4e7.jpg' WHERE `id` = 11;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/067_rural-courtyard-homestay-next-to-green-ric_4140dcb7.jpg' WHERE `id` = 12;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/073_miao-village-panorama-wooden-houses-terrac_73fc9c31.jpg' WHERE `id` = 13;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/108_lusheng-instrument-miao-festival-performan_4998ae57.jpg' WHERE `id` = 14;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/074_mountain-forest-park-misty-peaks-boardwalk_3b70feb8.jpg' WHERE `id` = 15;
UPDATE `wudong`.`wudong_common_story` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/075_day-tour-village-walking-path-silversmith-_899aa3fb.jpg' WHERE `id` = 16;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/063_chinese-man-avatar-illustration-minimal-ca_fb03d20e.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/042_chinese-woman-avatar-illustration-minimal_f738a687.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/072_chinese-man-avatar-illustration-minimal-sc_9387371a.jpg' WHERE `id` = 4;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/014_chinese-woman-avatar-illustration-minimal-_5d29a078.jpg' WHERE `id` = 5;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/027_chinese-man-avatar-illustration-minimal-gl_478338fc.jpg' WHERE `id` = 6;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/042_chinese-woman-avatar-illustration-minimal_f738a687.jpg' WHERE `id` = 14;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/042_chinese-woman-avatar-illustration-minimal_f738a687.jpg' WHERE `id` = 16;
UPDATE `wudong`.`wudong_common_user` SET `avatar` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/014_chinese-woman-avatar-illustration-minimal-_5d29a078.jpg' WHERE `id` = 18;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/004_handcrafted-miao-silver-filigree-bracelet-_bc373861.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20silversmith%20hands%20crafting%20silver%20jewelry%20with%20small%20hammer&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20bracelet%20detail%20butterfly%20pattern%20macro%20photography&image_size=square"]' AS JSON) WHERE `id` = 1;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/010_indigo-blue-batik-square-scarf-folded-crac_7c8bb2d7.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/010_indigo-blue-batik-square-scarf-folded-crac_7c8bb2d7.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20dye%20vat%20with%20fabric%20being%20dipped%2C%20workshop%20scene&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=batik%20wax%20drawing%20with%20copper%20knife%20on%20white%20cloth&image_size=square"]' AS JSON) WHERE `id` = 2;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/015_colorful-miao-embroidery-dragon-wall-hangi_48870d33.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/015_colorful-miao-embroidery-dragon-wall-hangi_48870d33.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20embroidery%20close-up%20silk%20thread%20work%20vibrant%20colors&image_size=square"]' AS JSON) WHERE `id` = 3;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20festival%20costume%20with%20silver%20ornaments%20full%20display&image_size=square"]' AS JSON) WHERE `id` = 4;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/021_delicate-silver-butterfly-earrings-on-line_4ac55c25.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/021_delicate-silver-butterfly-earrings-on-line_4ac55c25.jpg"]' AS JSON) WHERE `id` = 5;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/023_indigo-batik-table-runner-with-bronze-drum_24a1e634.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/023_indigo-batik-table-runner-with-bronze-drum_24a1e634.jpg"]' AS JSON) WHERE `id` = 6;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/024_set-of-six-geometric-embroidered-coasters-_7ba163b9.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/024_set-of-six-geometric-embroidered-coasters-_7ba163b9.jpg"]' AS JSON) WHERE `id` = 7;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/026_parent-and-child-making-silver-ring-at-cra_36caf7fc.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/026_parent-and-child-making-silver-ring-at-cra_36caf7fc.jpg"]' AS JSON) WHERE `id` = 8;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/051_green-tea-pearls-in-ceramic-jar-with-tea-c_b5337b54.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/051_green-tea-pearls-in-ceramic-jar-with-tea-c_b5337b54.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tea%20plantation%20on%20misty%20mountain%20terraces&image_size=square"]' AS JSON) WHERE `id` = 9;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/053_smoked-cured-pork-hanging-with-hemp-rope-r_9dcfe7d0.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/053_smoked-cured-pork-hanging-with-hemp-rope-r_9dcfe7d0.jpg"]' AS JSON) WHERE `id` = 10;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/054_rice-wine-in-ceramic-jars-with-red-paper-s_2e71d2b6.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/054_rice-wine-in-ceramic-jars-with-red-paper-s_2e71d2b6.jpg"]' AS JSON) WHERE `id` = 11;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/055_red-sour-soup-paste-in-vacuum-package-with_458ffbc5.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/055_red-sour-soup-paste-in-vacuum-package-with_458ffbc5.jpg"]' AS JSON) WHERE `id` = 12;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/056_round-sticky-rice-cakes-stacked-with-woode_63e322f2.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/056_round-sticky-rice-cakes-stacked-with-woode_63e322f2.jpg"]' AS JSON) WHERE `id` = 13;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/057_honey-jar-with-honeycomb-and-wooden-dipper_e315498d.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/057_honey-jar-with-honeycomb-and-wooden-dipper_e315498d.jpg"]' AS JSON) WHERE `id` = 14;
UPDATE `wudong`.`wudong_m2_restaurant` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/028_miao-long-table-banquet-red-lanterns-woode_51d465df.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/028_miao-long-table-banquet-red-lanterns-woode_51d465df.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Guizhou%20sour%20soup%20fish%20hotpot%20red%20broth%20steam&image_size=landscape_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glutinous%20rice%20wine%20bowls%20on%20wooden%20table&image_size=landscape_4_3"]' AS JSON) WHERE `id` = 1;
UPDATE `wudong`.`wudong_m2_restaurant` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/038_farmhouse-restaurant-terrace-overlooking-r_01afd89a.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/038_farmhouse-restaurant-terrace-overlooking-r_01afd89a.jpg"]' AS JSON) WHERE `id` = 2;
UPDATE `wudong`.`wudong_m2_restaurant` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/043_cozy-indoor-fire-pit-dining-room-rustic-wo_dc72ca13.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/043_cozy-indoor-fire-pit-dining-room-rustic-wo_dc72ca13.jpg"]' AS JSON) WHERE `id` = 3;
UPDATE `wudong`.`wudong_m2_restaurant` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/047_elegant-tea-house-restaurant-interior-wood_e9d19ef6.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/047_elegant-tea-house-restaurant-interior-wood_e9d19ef6.jpg"]' AS JSON) WHERE `id` = 4;
UPDATE `wudong`.`wudong_m3_homestay` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/058_wooden-stilt-house-guesthouse-on-hillside-_34dbacb7.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/058_wooden-stilt-house-guesthouse-on-hillside-_34dbacb7.jpg","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20wooden%20guesthouse%20room%20with%20indigo%20textiles%20warm%20lamp&image_size=landscape_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guesthouse%20balcony%20overlooking%20mountain%20valley%20morning&image_size=landscape_4_3"]' AS JSON) WHERE `id` = 1;
UPDATE `wudong`.`wudong_m3_homestay` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/064_traditional-courtyard-inn-with-silver-craf_034de4e7.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/064_traditional-courtyard-inn-with-silver-craf_034de4e7.jpg"]' AS JSON) WHERE `id` = 2;
UPDATE `wudong`.`wudong_m3_homestay` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/067_rural-courtyard-homestay-next-to-green-ric_4140dcb7.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/067_rural-courtyard-homestay-next-to-green-ric_4140dcb7.jpg"]' AS JSON) WHERE `id` = 3;
UPDATE `wudong`.`wudong_m3_homestay` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/070_modern-minimalist-wooden-architecture-cant_a862fa3e.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/070_modern-minimalist-wooden-architecture-cant_a862fa3e.jpg"]' AS JSON) WHERE `id` = 4;
UPDATE `wudong`.`wudong_m4_route` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/075_day-tour-village-walking-path-silversmith-_899aa3fb.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_m4_route` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/076_two-day-hiking-trail-mountain-village-sunr_85cab07c.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_m4_route` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m4-route3-cover.jpg' WHERE `id` = 3;
UPDATE `wudong`.`wudong_m4_route` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m4-route4-cover.jpg' WHERE `id` = 4;
UPDATE `wudong`.`wudong_m4_scenic` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/073_miao-village-panorama-wooden-houses-terrac_73fc9c31.jpg' WHERE `id` = 1;
UPDATE `wudong`.`wudong_m4_scenic` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/074_mountain-forest-park-misty-peaks-boardwalk_3b70feb8.jpg' WHERE `id` = 2;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/109_sea-of-clouds-mountain-sunrise_c1b39d04.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/110_guesthouse-balcony-mountain-morning_37453f6c.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/111_hot-tea-mountain-view-terrace_895e6329.jpg"]' AS JSON) WHERE `id` = 1;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/112_silversmith-crafting-silver-workshop_748d05e3.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/113_silver-jewelry-tools-on-workbench_983d6a15.jpg"]' AS JSON) WHERE `id` = 2;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/114_long-outdoor-table-banquet-feast_a067861e.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/115_spicy-red-fish-hotpot-bowl_9e423264.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/116_ethnic-drinking-horn-toast_7fbe77ec.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/117_colorful-rice-bowl-bibimbap_b32d3f89.jpg"]' AS JSON) WHERE `id` = 3;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/118_rice-terraces-sunset-aerial_9e654761.jpg"]' AS JSON) WHERE `id` = 4;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/119_father-and-child-craft-time_96e1be99.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/120_child-handcraft-workshop_849aa802.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/121_traditional-chinese-village-street_e5458950.jpg"]' AS JSON) WHERE `id` = 5;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/122_hands-dyeing-fabric-indigo-vat_1f1a7c79.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/123_indigo-batik-cloth-drying_ca86daa1.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/124_batik-wax-pattern-craft-hands_2a0b1c2d.jpg"]' AS JSON) WHERE `id` = 6;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/125_indoor-fire-pit-night-glow_921de887.jpg"]' AS JSON) WHERE `id` = 7;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/126_misty-forest-hiking-trail_641f9d68.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/127_hikers-ridge-above-clouds_ba67f7d5.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/128_waterfall-green-forest-river_df2a3152.jpg"]' AS JSON) WHERE `id` = 8;
UPDATE `wudong`.`wudong_m5_post` SET `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/129_sunlit-old-village-alley_81afe34a.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/130_elderly-woman-cooking-kitchen_c8132614.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/131_dried-foods-market-stall_b7719195.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/132_milky-way-wooden-cottage-night_bf6e5a41.jpg"]' AS JSON) WHERE `id` = 9;

COMMIT;

-- ---------------- 执行后校验：下列 remain 应全为 0 ----------------
SELECT 'cool.wudong_common_order.cover' AS field, COUNT(*) AS remain FROM `cool`.`wudong_common_order` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'cool.wudong_m3_homestay.cover' AS field, COUNT(*) AS remain FROM `cool`.`wudong_m3_homestay` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'cool.wudong_m3_homestay.images' AS field, COUNT(*) AS remain FROM `cool`.`wudong_m3_homestay` WHERE (CAST(`images` AS CHAR) LIKE '%"/images/%' OR CAST(`images` AS CHAR) LIKE '%trae-api-cn%')
UNION ALL
SELECT 'cool.wudong_m3_room_type.cover' AS field, COUNT(*) AS remain FROM `cool`.`wudong_m3_room_type` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'cool.wudong_m4_route.cover' AS field, COUNT(*) AS remain FROM `cool`.`wudong_m4_route` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'cool.wudong_m4_scenic.cover' AS field, COUNT(*) AS remain FROM `cool`.`wudong_m4_scenic` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_banner.image' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_banner` WHERE (`image` LIKE '%/images/%' AND `image` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `image` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_cart_item.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_cart_item` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_order.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_order` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_order_item.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_order_item` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_review.user_avatar' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_review` WHERE (`user_avatar` LIKE '%/images/%' AND `user_avatar` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `user_avatar` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_review.images' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_review` WHERE (CAST(`images` AS CHAR) LIKE '%"/images/%' OR CAST(`images` AS CHAR) LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_story.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_story` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_common_user.avatar' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_common_user` WHERE (`avatar` LIKE '%/images/%' AND `avatar` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `avatar` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m1_product.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m1_product` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m1_product.images' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m1_product` WHERE (CAST(`images` AS CHAR) LIKE '%"/images/%' OR CAST(`images` AS CHAR) LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m1_product.artisan' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m1_product` WHERE (CAST(`artisan` AS CHAR) LIKE '%"/images/%' OR CAST(`artisan` AS CHAR) LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m2_dish.img' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m2_dish` WHERE (`img` LIKE '%/images/%' AND `img` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `img` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m2_restaurant.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m2_restaurant` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m2_restaurant.images' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m2_restaurant` WHERE (CAST(`images` AS CHAR) LIKE '%"/images/%' OR CAST(`images` AS CHAR) LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m3_homestay.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m3_homestay` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m3_homestay.images' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m3_homestay` WHERE (CAST(`images` AS CHAR) LIKE '%"/images/%' OR CAST(`images` AS CHAR) LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m3_room_type.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m3_room_type` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m4_route.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m4_route` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m4_scenic.cover' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m4_scenic` WHERE (`cover` LIKE '%/images/%' AND `cover` NOT LIKE 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/%' OR `cover` LIKE '%trae-api-cn%')
UNION ALL
SELECT 'wudong.wudong_m5_post.images' AS field, COUNT(*) AS remain FROM `wudong`.`wudong_m5_post` WHERE (CAST(`images` AS CHAR) LIKE '%"/images/%' OR CAST(`images` AS CHAR) LIKE '%trae-api-cn%');
