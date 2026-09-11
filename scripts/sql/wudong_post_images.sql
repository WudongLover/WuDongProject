-- =====================================================================
-- 乌东文旅 社区帖子配图本地化（增量脚本）
-- 来源：app/wu_dong_vue/src/mock/data.ts 的 posts + mock/image-map.ts 映射
-- 生成：2026-09-11，由一次性脚本按 mock 数据生成，勿手改；
--       mock 配图变动后请重新生成（映射维护见 image-map.ts）。
-- 前置：先执行 wudong_schema.sql 与 wudong_seed.sql（帖子 id 1~9）。
-- 幂等：按主键覆写 images，可重复执行；重跑 wudong_seed.sql 后需再执行本脚本。
-- 链接：/images/** 为 C 端 public/images 静态资源路径（Vite 同源），共 24 张。
-- =====================================================================
USE `wudong`;
SET NAMES utf8mb4;

UPDATE `wudong_m5_post` SET `images` = '["/images/109_sea-of-clouds-mountain-sunrise_c1b39d04.jpg","/images/110_guesthouse-balcony-mountain-morning_37453f6c.jpg","/images/111_hot-tea-mountain-view-terrace_895e6329.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 1;
UPDATE `wudong_m5_post` SET `images` = '["/images/112_silversmith-crafting-silver-workshop_748d05e3.jpg","/images/113_silver-jewelry-tools-on-workbench_983d6a15.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 2;
UPDATE `wudong_m5_post` SET `images` = '["/images/114_long-outdoor-table-banquet-feast_a067861e.jpg","/images/115_spicy-red-fish-hotpot-bowl_9e423264.jpg","/images/116_ethnic-drinking-horn-toast_7fbe77ec.jpg","/images/117_colorful-rice-bowl-bibimbap_b32d3f89.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 3;
UPDATE `wudong_m5_post` SET `images` = '["/images/118_rice-terraces-sunset-aerial_9e654761.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 4;
UPDATE `wudong_m5_post` SET `images` = '["/images/119_father-and-child-craft-time_96e1be99.jpg","/images/120_child-handcraft-workshop_849aa802.jpg","/images/121_traditional-chinese-village-street_e5458950.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 5;
UPDATE `wudong_m5_post` SET `images` = '["/images/122_hands-dyeing-fabric-indigo-vat_1f1a7c79.jpg","/images/123_indigo-batik-cloth-drying_ca86daa1.jpg","/images/124_batik-wax-pattern-craft-hands_2a0b1c2d.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 6;
UPDATE `wudong_m5_post` SET `images` = '["/images/125_indoor-fire-pit-night-glow_921de887.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 7;
UPDATE `wudong_m5_post` SET `images` = '["/images/126_misty-forest-hiking-trail_641f9d68.jpg","/images/127_hikers-ridge-above-clouds_ba67f7d5.jpg","/images/128_waterfall-green-forest-river_df2a3152.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 8;
UPDATE `wudong_m5_post` SET `images` = '["/images/129_sunlit-old-village-alley_81afe34a.jpg","/images/130_elderly-woman-cooking-kitchen_c8132614.jpg","/images/131_dried-foods-market-stall_b7719195.jpg","/images/132_milky-way-wooden-cottage-night_bf6e5a41.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 9;
