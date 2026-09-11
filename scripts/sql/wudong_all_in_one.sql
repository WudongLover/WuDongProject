-- =====================================================================
-- 乌东文旅"衣食住行"综合服务平台 全量数据库脚本（合并版）
-- 合并自：wudong_schema.sql + m6_agent_schema.sql + wudong_seed.sql
--         + wudong_seed_story.sql + wudong_post_images.sql
-- 执行顺序：DDL 建表 → 种子数据 INSERT → 帖子配图 UPDATE
-- 数据库：wudong（utf8mb4 / utf8mb4_general_ci / InnoDB）
-- 生成时间：2026-09-11
-- =====================================================================

-- =====================================================================
-- 乌东文旅"衣食住行"综合服务平台 数据库表结构 DDL（V1.0 敲定稿）
-- 依据：app/wu_dong_vue 前端类型（src/types.ts）与 API 面（src/mock/server.ts）
--       《docx/技术开发规范.md》：MySQL 8 / 库名 wudong / TypeORM / 模块化单体
-- 模块归属：common(公共) m1(衣) m2(食) m3(住) m4(行) m5(社区)
-- =====================================================================
-- 通用约定：
--   1. 引擎 InnoDB，字符集 utf8mb4 / utf8mb4_general_ci
--   2. 主键 id BIGINT UNSIGNED AUTO_INCREMENT（雪花 ID 可后置替换）
--   3. 金额 DECIMAL(10,2)（接口层转字符串）；评分 DECIMAL(2,1)，0.0~5.0
--   4. 枚举一律 VARCHAR(32)，取值与前端 types.ts 字符串字面量保持一致（见列注释）
--   5. 业务表统一带 created_at / updated_at / deleted_at（TypeORM 逻辑删除）
--   6. JSON 列用于纯展示型集合（图片数组/标签/设施等），不参与检索
--   7. 管理后台账号/权限复用 Cool Admin base_sys_* 表，此处不重复设计
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `wudong` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `wudong`;

SET NAMES utf8mb4;

-- =====================================================================
-- 一、wudong_common 公共模块（第 6 组）：用户/商家/收藏/购物车/订单/支付/
--     消息/文件/审核/搜索/首页运营/评价
-- =====================================================================

-- 1.1 C 端用户（对应 UserProfile / login / register）
CREATE TABLE `wudong_common_user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone`         VARCHAR(11)     NOT NULL COMMENT '手机号，登录凭证',
  `password_hash` VARCHAR(100)    NOT NULL DEFAULT '' COMMENT 'bcrypt 哈希，验证码注册用户可为空串',
  `name`          VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '昵称',
  `avatar`        VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '头像 URL',
  `bio`           VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '个人简介',
  `status`        VARCHAR(16)     NOT NULL DEFAULT 'ENABLED' COMMENT 'ENABLED 启用 / DISABLED 禁用(禁言)',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB COMMENT='C端用户';

-- 1.2 刷新令牌（规范 7.4：只存哈希，刷新轮换）
CREATE TABLE `wudong_common_refresh_token` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `jti`        VARCHAR(64)     NOT NULL COMMENT '刷新令牌唯一标识',
  `token_hash` VARCHAR(128)    NOT NULL COMMENT '令牌哈希（sha256）',
  `expires_at` DATETIME        NOT NULL,
  `revoked_at` DATETIME        NULL DEFAULT NULL COMMENT '撤销时间（轮换/登出）',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_jti` (`jti`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB COMMENT='刷新令牌（验证码存 Redis，不建表）';

-- 1.3 收货地址（对应 Address）
CREATE TABLE `wudong_common_address` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `name`       VARCHAR(64)     NOT NULL COMMENT '收货人',
  `phone`      VARCHAR(11)     NOT NULL,
  `region`     VARCHAR(128)    NOT NULL COMMENT '省市区',
  `detail`     VARCHAR(255)    NOT NULL COMMENT '详细地址',
  `is_default` TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB COMMENT='收货地址';

-- 1.4 商家（订单/商品归属 shop 的实体化；Cart.shop、Order.shop）
CREATE TABLE `wudong_common_merchant` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(128)    NOT NULL COMMENT '店铺名（如：乌东银匠工坊）',
  `logo`          VARCHAR(500)    NOT NULL DEFAULT '',
  `contact_phone` VARCHAR(11)     NOT NULL DEFAULT '',
  `intro`         VARCHAR(500)    NOT NULL DEFAULT '',
  `admin_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '绑定的 Cool Admin 商家账号',
  `status`        VARCHAR(16)     NOT NULL DEFAULT 'ENABLED' COMMENT 'ENABLED / DISABLED',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_admin_user` (`admin_user_id`)
) ENGINE=InnoDB COMMENT='商家店铺';

-- 1.5 商家入驻申请（规范 8.2 merchant/apply）
CREATE TABLE `wudong_common_merchant_apply` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL,
  `name`          VARCHAR(128)    NOT NULL COMMENT '申请店铺名',
  `contact_phone` VARCHAR(11)     NOT NULL,
  `license_file_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '营业执照文件',
  `status`        VARCHAR(16)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / APPROVED / REJECTED',
  `reason`        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '驳回原因',
  `merchant_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '通过后生成的店铺',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB COMMENT='商家入驻申请';

-- 1.6 收藏（多态：非遗商品/特产/民宿/餐厅/路线/游记，对应 getFavorites）
CREATE TABLE `wudong_common_favorite` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `target_type` VARCHAR(16) NOT NULL COMMENT 'GOODS / SPECIALTY / RESTAURANT / HOMESTAY / ROUTE / POST',
  `target_id`   BIGINT UNSIGNED NOT NULL COMMENT '目标表主键',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
  KEY `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB COMMENT='收藏（toggleFavorite）';

-- 1.7 购物车（仅实物：m1 商品 + m2 特产；对应 CartItem / addToCart 合并逻辑）
CREATE TABLE `wudong_common_cart_item` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `product_id`  BIGINT UNSIGNED NOT NULL COMMENT 'm1_product.id',
  `sku_id`      BIGINT UNSIGNED NOT NULL COMMENT 'm1_sku.id，无 SKU 时为 0',
  `merchant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `qty`         INT UNSIGNED    NOT NULL DEFAULT 1,
  `checked`     TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '结算勾选',
  -- 下单校验用的快照（加购时点）
  `title`       VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '商品标题快照',
  `cover`       VARCHAR(500)    NOT NULL DEFAULT '',
  `sku_name`    VARCHAR(128)    NOT NULL DEFAULT '' COMMENT 'SKU 名快照（Cart.sku）',
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT 'SKU 单价快照',
  `stock`       INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '加购时库存快照（checkCart 校验以实时库存为准）',
  `shop_name`   VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '店铺名快照（Cart.shop）',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sku` (`user_id`, `sku_id`) COMMENT '同商品同 SKU 合并数量',
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB COMMENT='购物车';

-- 1.8 结算单（规范 8.2 checkouts：购物车结算按商家/模块拆单，一对多订单）
CREATE TABLE `wudong_common_checkout` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `checkout_no`  VARCHAR(32)     NOT NULL COMMENT '结算单号',
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `total_amount` DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `status`       VARCHAR(16)     NOT NULL DEFAULT 'CREATED' COMMENT 'CREATED / ORDERED / CANCELLED',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_checkout_no` (`checkout_no`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB COMMENT='结算单（一次结算拆多个订单）';

-- 1.9 订单（对应 Order：orderNo/type/status/title/cover/summary/amount/qty/shop）
CREATE TABLE `wudong_common_order` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`       VARCHAR(32)     NOT NULL COMMENT '业务单号 WDyymmddNNNN',
  `checkout_id`    BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '来自购物车结算时有值',
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `merchant_id`    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `type`           VARCHAR(16)     NOT NULL COMMENT 'GOODS / SPECIALTY / MEAL / LODGING / TICKET / ROUTE',
  `status`         VARCHAR(16)     NOT NULL DEFAULT 'UNPAID' COMMENT 'UNPAID / PAID / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / REFUNDED',
  -- 展示快照（前端 Order 列表直读，避免多表 join）
  `title`          VARCHAR(255)    NOT NULL,
  `cover`          VARCHAR(500)    NOT NULL DEFAULT '',
  `summary`        VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '规格/房型/场次/日期摘要',
  `amount`         DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '实付金额',
  `qty`            INT UNSIGNED    NOT NULL DEFAULT 1,
  `shop_name`      VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '店铺名快照（Order.shop）',
  `expire_at`      DATETIME        NULL DEFAULT NULL COMMENT '支付截止，超时任务自动取消',
  `paid_at`        DATETIME        NULL DEFAULT NULL,
  `completed_at`   DATETIME        NULL DEFAULT NULL,
  `cancelled_at`   DATETIME        NULL DEFAULT NULL,
  `cancel_reason`  VARCHAR(255)    NOT NULL DEFAULT '',
  `refund_reason`  VARCHAR(255)    NOT NULL DEFAULT '',
  `refund_amount`  DECIMAL(10,2)   NULL DEFAULT NULL,
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`     DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_status` (`user_id`, `status`),
  KEY `idx_user_type` (`user_id`, `type`),
  KEY `idx_merchant` (`merchant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB COMMENT='订单主表（各模块扩展信息在 wudong_mX_order_ext）';

-- 1.10 订单明细（购物车多商品拆单后逐项记录）
CREATE TABLE `wudong_common_order_item` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`    BIGINT UNSIGNED NOT NULL,
  `target_type` VARCHAR(16)     NOT NULL COMMENT 'GOODS / SPECIALTY（明细仅实物类）',
  `target_id`   BIGINT UNSIGNED NOT NULL COMMENT 'm1_product.id',
  `sku_id`      BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `title`       VARCHAR(255)    NOT NULL,
  `cover`       VARCHAR(500)    NOT NULL DEFAULT '',
  `sku_name`    VARCHAR(128)    NOT NULL DEFAULT '',
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `qty`         INT UNSIGNED    NOT NULL DEFAULT 1,
  `amount`      DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB COMMENT='订单明细';

-- 1.11 支付单（规范 8.2 pay：mock 支付凭证）
CREATE TABLE `wudong_common_payment` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pay_no`         VARCHAR(32)     NOT NULL,
  `order_no`       VARCHAR(32)     NOT NULL,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `amount`         DECIMAL(10,2)   NOT NULL COMMENT '支付金额（回调时强校验）',
  `status`         VARCHAR(16)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / SUCCESS / FAILED / REFUNDED',
  `provider`       VARCHAR(16)     NOT NULL DEFAULT 'mock' COMMENT 'mock / wechat',
  `credential`     VARCHAR(500)    NOT NULL DEFAULT '' COMMENT 'mock 支付凭证',
  `callback_payload` JSON          NULL COMMENT '回调原文（幂等校验）',
  `paid_at`        DATETIME        NULL DEFAULT NULL,
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pay_no` (`pay_no`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB COMMENT='支付单';

-- 1.12 订单事件（规范 8.3：事务内落库 + 异步投递，消费者按 event 幂等）
CREATE TABLE `wudong_common_order_event` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`      VARCHAR(32)     NOT NULL,
  `event_type`    VARCHAR(32)     NOT NULL COMMENT 'ORDER_CREATED / ORDER_PAID / ORDER_CANCELLED / REFUND_APPROVED',
  `target_module` VARCHAR(8)      NOT NULL COMMENT 'm1 / m2 / m3 / m4（消费方模块）',
  `status`        VARCHAR(16)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / SUCCESS / DEAD(死信)',
  `retry_count`   INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '1/5/30 分钟递增重试，超 5 次入死信',
  `next_retry_at` DATETIME        NULL DEFAULT NULL,
  `payload`       JSON            NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status_retry` (`status`, `next_retry_at`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB COMMENT='订单领域事件投递表';

-- 1.13 评价（多态：商品/餐厅/民宿；对应 Review：rating/content/date/reply/images）
CREATE TABLE `wudong_common_review` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `user_name`    VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '用户昵称快照（Review.user）',
  `user_avatar`  VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '头像快照（Review.avatar）',
  `target_type`  VARCHAR(16)     NOT NULL COMMENT 'GOODS / SPECIALTY / RESTAURANT / HOMESTAY / ROUTE',
  `target_id`    BIGINT UNSIGNED NOT NULL,
  `order_no`     VARCHAR(32)     NOT NULL DEFAULT '' COMMENT '关联订单（已完单才可评）',
  `rating`       DECIMAL(2,1)    NOT NULL DEFAULT 5.0,
  `content`      VARCHAR(1000)   NOT NULL,
  `images`       JSON            NULL COMMENT '晒图 URL 数组',
  `reply`        VARCHAR(1000)   NULL DEFAULT NULL COMMENT '商家回复（Review.reply）',
  `reply_at`     DATETIME        NULL DEFAULT NULL,
  `status`       VARCHAR(16)     NOT NULL DEFAULT 'PASSED' COMMENT 'PENDING / PASSED / REJECTED（先发后审可切 PENDING）',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_target` (`order_no`, `target_type`, `target_id`) COMMENT '一单一目标一条评价',
  KEY `idx_target` (`target_type`, `target_id`, `status`)
) ENGINE=InnoDB COMMENT='评价';

-- 1.14 站内消息（对应 Message：type/title/content/read）
CREATE TABLE `wudong_common_message` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `type`       VARCHAR(16)     NOT NULL COMMENT 'SYSTEM / ORDER / INTERACT',
  `title`      VARCHAR(128)    NOT NULL,
  `content`    VARCHAR(1000)   NOT NULL,
  `is_read`    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Message.read',
  `related_type` VARCHAR(16)   NULL DEFAULT NULL COMMENT 'ORDER / POST / ... 跳转目标类型',
  `related_id` VARCHAR(64)     NULL DEFAULT NULL COMMENT '跳转目标标识（如 order_no）',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB COMMENT='站内消息';

-- 1.15 文件（规范 8.2 upload：状态机与审核状态）
CREATE TABLE `wudong_common_file` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `bucket`       VARCHAR(64)     NOT NULL DEFAULT 'wudong',
  `object_key`   VARCHAR(255)    NOT NULL COMMENT 'MinIO 对象键（随机命名）',
  `url`          VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '访问 URL（私有桶为签名 URL）',
  `thumb_url`    VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '缩略图（异步生成）',
  `mime`         VARCHAR(64)     NOT NULL DEFAULT '',
  `size`         BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `status`       VARCHAR(16)     NOT NULL DEFAULT 'INITIATED' COMMENT 'INITIATED / UPLOADED / PROCESSING / READY / REJECTED / DELETED',
  `audit_status` VARCHAR(16)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / PASSED / REJECTED',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB COMMENT='上传文件（MinIO 元数据）';

-- 1.16 敏感词（规范 9 AuditProvider 本地 DFA 词库）
CREATE TABLE `wudong_common_sensitive_word` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `word`       VARCHAR(64)     NOT NULL,
  `level`      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1 拦截 / 2 替换',
  `enabled`    TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB COMMENT='敏感词库';

-- 1.17 热搜词（对应 hotKeywords）
CREATE TABLE `wudong_common_search_keyword` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `keyword`    VARCHAR(64)     NOT NULL,
  `heat`       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '搜索次数（运营可调权重）',
  `enabled`    TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_keyword` (`keyword`)
) ENGINE=InnoDB COMMENT='热搜词';

-- 1.18 首页 Banner（对应 Banner）
CREATE TABLE `wudong_common_banner` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(64)     NOT NULL,
  `subtitle`   VARCHAR(128)    NOT NULL DEFAULT '',
  `image`      VARCHAR(500)    NOT NULL,
  `link`       VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '前端路由（/goods 等）',
  `sort`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `enabled`    TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='首页轮播';

-- 1.19 公告（对应 announcements: string[]）
CREATE TABLE `wudong_common_announcement` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content`    VARCHAR(255)    NOT NULL,
  `sort`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `enabled`    TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='首页公告';

-- 1.20 首页推荐位（对应 recommends: goods/restaurants/homestays/routes/posts）
CREATE TABLE `wudong_common_recommend` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `position`    VARCHAR(32)     NOT NULL COMMENT 'HOME_GOODS / HOME_RESTAURANT / HOME_HOMESTAY / HOME_ROUTE / HOME_POST',
  `target_type` VARCHAR(16)     NOT NULL,
  `target_id`   BIGINT UNSIGNED NOT NULL,
  `sort`        INT UNSIGNED    NOT NULL DEFAULT 0,
  `enabled`     TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_position_target` (`position`, `target_type`, `target_id`)
) ENGINE=InnoDB COMMENT='首页推荐位';

-- 1.21 文化推文（管理端编写的图文内容，对应前端 CultureStory；首页/列表页/文化详情页展示）
CREATE TABLE `wudong_common_story` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module`       VARCHAR(8)      NOT NULL COMMENT '所属模块：YI 衣 / SHI 食 / ZHU 住 / XING 行',
  `slug`         VARCHAR(64)     NOT NULL COMMENT '路由 id，全站唯一（如 yi-silver-hammer，前缀 yi-/shi-/zhu-/xing-）',
  `eyebrow`      VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '英文小标（如 YI · SILVER）',
  `title`        VARCHAR(128)    NOT NULL COMMENT '标题',
  `summary`      VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '导语（卡片正文与详情页共用，30-50 字）',
  `cover`        VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '封面图 URL',
  `quote`        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '一句话引文（详情页知识锚点）',
  `paragraphs`   JSON            NULL COMMENT '正文段落数组（纯文本，2-4 段）',
  `links`        JSON            NULL COMMENT '尾部导流 [{label,to}]，to 为站内路由',
  `sort`         INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '模块内展示顺序，小者在前',
  `status`       VARCHAR(16)     NOT NULL DEFAULT 'PUBLISHED' COMMENT 'DRAFT 草稿 / PUBLISHED 已发布 / OFFLINE 下线',
  `published_at` DATETIME        NULL DEFAULT NULL COMMENT '发布时间',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`),
  KEY `idx_module_status_sort` (`module`, `status`, `sort`)
) ENGINE=InnoDB COMMENT='文化推文（管理端编写）';

-- =====================================================================
-- 二、wudong_m1 衣（第 1 组）：非遗商品 + 特产
--     决策：前端 Product 用 module=GOODS|SPECIALTY 统一建模、列表/搜索/
--     购物车/收藏全链路合并处理，故商品表收敛为一张（m2 特产经 m1 接口读写）
-- =====================================================================

-- 2.1 商品类目（goodsCategories：银饰/蜡染/刺绣/苗族服饰；特产类目）
CREATE TABLE `wudong_m1_category` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module`     VARCHAR(16)     NOT NULL COMMENT 'GOODS / SPECIALTY',
  `name`       VARCHAR(64)     NOT NULL,
  `sort`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_module_name` (`module`, `name`)
) ENGINE=InnoDB COMMENT='商品类目';

-- 2.2 商品（对应 Product 全量字段）
CREATE TABLE `wudong_m1_product` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module`       VARCHAR(16)     NOT NULL COMMENT 'GOODS 衣 / SPECIALTY 食特产',
  `category_id`  BIGINT UNSIGNED NOT NULL,
  `merchant_id`  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `title`        VARCHAR(128)    NOT NULL,
  `subtitle`     VARCHAR(255)    NOT NULL DEFAULT '',
  `price`        DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '售价（展示取 SKU 最低价同步）',
  `market_price` DECIMAL(10,2)   NULL DEFAULT NULL COMMENT '划线价（Product.marketPrice）',
  `sales`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '销量（下单后累加）',
  `rating`       DECIMAL(2,1)    NOT NULL DEFAULT 5.0 COMMENT '评分（评价后重算）',
  `stock`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '总库存（ΣSKU，冗余）',
  `cover`        VARCHAR(500)    NOT NULL,
  `images`       JSON            NULL COMMENT '详情轮播图 URL 数组',
  `detail`       TEXT            NULL COMMENT '图文详情（富文本，服务端白名单过滤）',
  `craft`        VARCHAR(2000)   NULL DEFAULT NULL COMMENT '非遗工艺介绍（衣）',
  `artisan`      JSON            NULL COMMENT '匠人 {name,title,avatar,story}（衣）',
  `origin`       VARCHAR(255)    NULL DEFAULT NULL COMMENT '农产品溯源（特产）',
  `shelf_life`   VARCHAR(64)     NULL DEFAULT NULL COMMENT '保质期（特产，Product.shelfLife）',
  `status`       VARCHAR(16)     NOT NULL DEFAULT 'ON_SHELF' COMMENT 'ON_SHELF / OFF_SHELF',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_module_category` (`module`, `category_id`),
  KEY `idx_merchant` (`merchant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB COMMENT='商品（衣/特产统一表）';

-- 2.3 SKU（对应 Sku：name/price/stock；购物车/库存扣减以 SKU 为粒度）
CREATE TABLE `wudong_m1_sku` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(128)    NOT NULL COMMENT '规格名（如 手镯-素面）',
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `stock`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`)
) ENGINE=InnoDB COMMENT='商品SKU';

-- =====================================================================
-- 三、wudong_m2 食（第 2 组）：餐厅 / 菜品 / 预订时段
-- =====================================================================

-- 3.1 餐厅（对应 Restaurant）
CREATE TABLE `wudong_m2_restaurant` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `merchant_id`       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `name`              VARCHAR(128)    NOT NULL,
  `cover`             VARCHAR(500)    NOT NULL,
  `images`            JSON            NULL COMMENT '详情图集',
  `rating`            DECIMAL(2,1)    NOT NULL DEFAULT 5.0,
  `price_per_capita`  DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '人均（Restaurant.pricePerCapita）',
  `address`           VARCHAR(255)    NOT NULL DEFAULT '',
  `hours`             VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '营业时间',
  `capacity`          INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '总容量',
  `tags`              JSON            NULL COMMENT '标签数组',
  `intro`             VARCHAR(2000)   NULL DEFAULT NULL,
  `status`            VARCHAR(16)     NOT NULL DEFAULT 'ENABLED' COMMENT 'ENABLED / DISABLED',
  `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`        DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_merchant` (`merchant_id`)
) ENGINE=InnoDB COMMENT='餐厅';

-- 3.2 菜品（对应 Dish：name/price/img/signature）
CREATE TABLE `wudong_m2_dish` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id` BIGINT UNSIGNED NOT NULL,
  `name`          VARCHAR(128)    NOT NULL,
  `price`         DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `img`           VARCHAR(500)    NOT NULL DEFAULT '',
  `is_signature`  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '招牌菜（Dish.signature）',
  `sort`          INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_restaurant` (`restaurant_id`)
) ENGINE=InnoDB COMMENT='菜品';

-- 3.3 预订时段模板（对应 TimeSlot：name/capacity，如 午市 11:30 / 晚市 17:30）
CREATE TABLE `wudong_m2_time_slot` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id` BIGINT UNSIGNED NOT NULL,
  `name`          VARCHAR(64)     NOT NULL COMMENT '时段名（11:30-13:30 午市）',
  `capacity`      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '每时段容量',
  `sort`          INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_restaurant` (`restaurant_id`)
) ENGINE=InnoDB COMMENT='餐厅预订时段模板';

-- 3.4 时段每日余量（TimeSlot.left 按日期展开；下单预占、取消释放）
CREATE TABLE `wudong_m2_slot_quota` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id` BIGINT UNSIGNED NOT NULL,
  `slot_id`       BIGINT UNSIGNED NOT NULL,
  `date`          DATE            NOT NULL,
  `remaining`     INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '剩余可订（TimeSlot.left）',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slot_date` (`restaurant_id`, `slot_id`, `date`)
) ENGINE=InnoDB COMMENT='时段每日余量';

-- =====================================================================
-- 四、wudong_m3 住（第 3 组）：民宿 / 房型 / 房态日历
-- =====================================================================

-- 4.1 民宿（对应 Homestay；score {hygiene,location,service} 存 JSON）
CREATE TABLE `wudong_m3_homestay` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `merchant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `name`        VARCHAR(128)    NOT NULL,
  `cover`       VARCHAR(500)    NOT NULL,
  `images`      JSON            NULL,
  `rating`      DECIMAL(2,1)    NOT NULL DEFAULT 5.0,
  `score`       JSON            NULL COMMENT '{"hygiene":4.9,"location":4.8,"service":5.0}',
  `tags`        JSON            NULL,
  `facilities`  JSON            NULL COMMENT '设施列表',
  `address`     VARCHAR(255)    NOT NULL DEFAULT '',
  `intro`       VARCHAR(2000)   NULL DEFAULT NULL,
  `notice`      TEXT            NULL COMMENT '入住须知（Homestay.notice）',
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'ENABLED' COMMENT 'ENABLED / DISABLED',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_merchant` (`merchant_id`)
) ENGINE=InnoDB COMMENT='民宿';

-- 4.2 房型（对应 RoomType：bed/area/maxGuests/price/stock/facilities）
CREATE TABLE `wudong_m3_room_type` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `homestay_id` BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(128)    NOT NULL,
  `bed`         VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '床型（1.8m大床）',
  `area`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '面积㎡',
  `max_guests`  INT UNSIGNED    NOT NULL DEFAULT 2,
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '基础价',
  `stock`       INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '总间数（日历库存基于此）',
  `cover`       VARCHAR(500)    NOT NULL DEFAULT '',
  `facilities`  JSON            NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_homestay` (`homestay_id`)
) ENGINE=InnoDB COMMENT='房型';

-- 4.3 房态日历（对应 getRoomCalendar：date/stock/priceDelta，周末调价减库存）
CREATE TABLE `wudong_m3_room_calendar` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_type_id` BIGINT UNSIGNED NOT NULL,
  `date`         DATE            NOT NULL,
  `stock`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '当日剩余可售间数（下单预占/取消释放）',
  `price_delta`  DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '当日加价（周末节假日）',
  `closed`       TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '当日是否停售',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_room_date` (`room_type_id`, `date`)
) ENGINE=InnoDB COMMENT='房态日历';

-- =====================================================================
-- 五、wudong_m4 行（第 4 组）：景点 / 门票 / 路线 / 行程
-- =====================================================================

-- 5.1 景点（对应 Scenic）
CREATE TABLE `wudong_m4_scenic` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(128)    NOT NULL,
  `cover`      VARCHAR(500)    NOT NULL,
  `open_time`  VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '开放时间',
  `address`    VARCHAR(255)    NOT NULL DEFAULT '',
  `intro`      VARCHAR(2000)   NULL DEFAULT NULL,
  `rating`     DECIMAL(2,1)    NOT NULL DEFAULT 5.0,
  `status`     VARCHAR(16)     NOT NULL DEFAULT 'ENABLED',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='景点';

-- 5.2 门票（对应 Ticket：name/price/stock/note）
CREATE TABLE `wudong_m4_ticket` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scenic_id`   BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(128)    NOT NULL COMMENT '票名（成人票/联票）',
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `stock`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `note`        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '购票须知（Ticket.note）',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scenic` (`scenic_id`)
) ENGINE=InnoDB COMMENT='门票';

-- 5.3 路线（对应 TravelRoute）
CREATE TABLE `wudong_m4_route` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `merchant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `title`       VARCHAR(128)    NOT NULL,
  `cover`       VARCHAR(500)    NOT NULL,
  `days`        INT UNSIGNED    NOT NULL DEFAULT 1,
  `theme`       VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '主题（苗寨深度/非遗研学）',
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `sales`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `rating`      DECIMAL(2,1)    NOT NULL DEFAULT 5.0,
  `departure`   VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '出发地',
  `includes`    JSON            NULL COMMENT '费用包含列表',
  `notice`      JSON            NULL COMMENT '须知列表',
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'ON_SHELF' COMMENT 'ON_SHELF / OFF_SHELF',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_theme` (`theme`)
) ENGINE=InnoDB COMMENT='旅行路线';

-- 5.4 路线每日行程（对应 RouteDay：day/title/desc/meals/stay）
CREATE TABLE `wudong_m4_route_day` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id`   BIGINT UNSIGNED NOT NULL,
  `day`        INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '第几天',
  `title`      VARCHAR(128)    NOT NULL,
  `description` TEXT           NULL COMMENT '行程描述（RouteDay.desc）',
  `meals`      VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '用餐（含早/午餐）',
  `stay`       VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '住宿（苗寨民宿）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_route_day` (`route_id`, `day`)
) ENGINE=InnoDB COMMENT='路线行程（随路线逻辑删除）';

-- =====================================================================
-- 六、wudong_m5 社区（第 5 组）：帖子 / 评论 / 点赞
-- =====================================================================

-- 6.1 帖子（对应 Post；author 由 user_id 关联，昵称头像实时读用户表）
CREATE TABLE `wudong_m5_post` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL COMMENT '作者（PostAuthor.id）',
  `title`        VARCHAR(128)    NOT NULL,
  `content`      TEXT            NULL,
  `images`       JSON            NULL COMMENT '配图 URL 数组',
  `topic`        VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '话题（#苗年节）',
  `place`        VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '地点打卡（Post.place）',
  `likes`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '点赞数（冗余计数）',
  `collects`     INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '收藏数（冗余计数，写入 common_favorite）',
  `views`        INT UNSIGNED    NOT NULL DEFAULT 0,
  `status`       VARCHAR(16)     NOT NULL DEFAULT 'PASSED' COMMENT 'PENDING / PASSED / REJECTED（审核不通过通知消息）',
  `published_at` DATETIME        NULL DEFAULT NULL COMMENT '发布时间（Post.date）',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_topic` (`topic`),
  KEY `idx_status_time` (`status`, `published_at`)
) ENGINE=InnoDB COMMENT='社区帖子';

-- 6.2 评论（对应 PostComment；replies 用 parent_id 自关联，扁平存储）
CREATE TABLE `wudong_m5_comment` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`          BIGINT UNSIGNED NOT NULL,
  `user_id`          BIGINT UNSIGNED NOT NULL,
  `parent_id`        BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '父评论 id，回复时必填',
  `reply_to_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '被回复人（楼中楼 @）',
  `content`          VARCHAR(1000)   NOT NULL,
  `status`           VARCHAR(16)     NOT NULL DEFAULT 'PASSED' COMMENT 'PENDING / PASSED / REJECTED',
  `published_at`     DATETIME        NULL DEFAULT NULL COMMENT 'PostComment.date',
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`       DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`, `status`),
  KEY `idx_parent` (`parent_id`)
) ENGINE=InnoDB COMMENT='帖子评论（含楼中楼回复）';

-- 6.3 点赞（togglePostLike：likes 冗余计数 + 本表判重）
CREATE TABLE `wudong_m5_post_like` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`    BIGINT UNSIGNED NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`)
) ENGINE=InnoDB COMMENT='帖子点赞';

-- =====================================================================
-- 七、各模块订单扩展表（规范 8.3：订单中心在同一事务内写入 t_mX_order_ext）
--     主表只存展示快照，预订/履约参数放扩展表；统一 order_id 一对一
-- =====================================================================

-- 7.1 衣/特产订单扩展
CREATE TABLE `wudong_m1_order_ext` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `product_id`     BIGINT UNSIGNED NOT NULL,
  `sku_id`         BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `receiver_name`  VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '收货人快照',
  `receiver_phone` VARCHAR(11)     NOT NULL DEFAULT '',
  `receiver_addr`  VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '收货地址快照（下单时固化）',
  `logistics_no`   VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '发货物流单号',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`)
) ENGINE=InnoDB COMMENT='衣/特产订单扩展';

-- 7.2 食（餐饮预订）订单扩展
CREATE TABLE `wudong_m2_order_ext` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `restaurant_id`  BIGINT UNSIGNED NOT NULL,
  `slot_id`        BIGINT UNSIGNED NOT NULL,
  `dining_date`    DATE            NOT NULL COMMENT '到店日期',
  `dining_time`    VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '时段名快照',
  `guests`         INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '用餐人数',
  `contact_name`   VARCHAR(64)     NOT NULL DEFAULT '',
  `contact_phone`  VARCHAR(11)     NOT NULL DEFAULT '',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_restaurant_date` (`restaurant_id`, `dining_date`)
) ENGINE=InnoDB COMMENT='餐饮订单扩展';

-- 7.3 住（民宿预订）订单扩展
CREATE TABLE `wudong_m3_order_ext` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `homestay_id`    BIGINT UNSIGNED NOT NULL,
  `room_type_id`   BIGINT UNSIGNED NOT NULL,
  `check_in_date`  DATE            NOT NULL,
  `check_out_date` DATE            NOT NULL,
  `nights`         INT UNSIGNED    NOT NULL DEFAULT 1,
  `guests`         INT UNSIGNED    NOT NULL DEFAULT 1,
  `contact_name`   VARCHAR(64)     NOT NULL DEFAULT '',
  `contact_phone`  VARCHAR(11)     NOT NULL DEFAULT '',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_room_dates` (`room_type_id`, `check_in_date`, `check_out_date`)
) ENGINE=InnoDB COMMENT='住宿订单扩展';

-- 7.4 行（门票/路线）订单扩展
CREATE TABLE `wudong_m4_order_ext` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `scenic_id`      BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '门票订单填',
  `ticket_id`      BIGINT UNSIGNED NULL DEFAULT NULL,
  `route_id`       BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '路线订单填',
  `travel_date`    DATE            NOT NULL COMMENT '出游日期',
  `guests`         INT UNSIGNED    NOT NULL DEFAULT 1,
  `contact_name`   VARCHAR(64)     NOT NULL DEFAULT '',
  `contact_phone`  VARCHAR(11)     NOT NULL DEFAULT '',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_travel_date` (`travel_date`)
) ENGINE=InnoDB COMMENT='行订单扩展（TICKET/ROUTE 二选一）';


-- =====================================================================
-- 来源文件：m6_agent_schema.sql
-- =====================================================================


-- ============================================================
-- m6-agent 智能体模块建表 SQL
-- 执行前请确认已切换到 wudong 数据库
-- ============================================================

-- 对话会话表
CREATE TABLE IF NOT EXISTS `wudong_m6_chat_session` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '登录用户 id，未登录为 null',
  `device_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '未登录用户的设备标识',
  `title` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '会话标题（取首条消息前 30 字）',
  `message_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '消息条数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='智能体对话会话表';

-- 对话消息表
CREATE TABLE IF NOT EXISTS `wudong_m6_chat_message` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `session_id` BIGINT UNSIGNED NOT NULL COMMENT '所属会话 id',
  `role` VARCHAR(16) NOT NULL COMMENT '角色：user / assistant / system',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `prompt_tokens` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输入 Token 数',
  `completion_tokens` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输出 Token 数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='智能体对话消息表';


-- =====================================================================
-- 来源文件：wudong_seed.sql
-- =====================================================================


-- =====================================================================
-- 乌东文旅 种子数据（由 app/wu_dong_vue/src/mock 生成，勿手改）
-- 生成：node scripts/sql/gen_seed_sql.mjs（脚本见同目录 gen_seed_sql.mjs）
-- 图片：沿用前端文生图占位 URL，接入 MinIO/OSS 后重新生成即可
-- =====================================================================


SET FOREIGN_KEY_CHECKS = 0;

-- 清空种子相关表（可重复执行）
TRUNCATE TABLE `wudong_common_user`;
TRUNCATE TABLE `wudong_common_address`;
TRUNCATE TABLE `wudong_common_merchant`;
TRUNCATE TABLE `wudong_common_favorite`;
TRUNCATE TABLE `wudong_common_cart_item`;
TRUNCATE TABLE `wudong_common_order`;
TRUNCATE TABLE `wudong_common_order_item`;
TRUNCATE TABLE `wudong_common_payment`;
TRUNCATE TABLE `wudong_common_review`;
TRUNCATE TABLE `wudong_common_message`;
TRUNCATE TABLE `wudong_common_banner`;
TRUNCATE TABLE `wudong_common_announcement`;
TRUNCATE TABLE `wudong_common_recommend`;
TRUNCATE TABLE `wudong_common_search_keyword`;
TRUNCATE TABLE `wudong_m1_category`;
TRUNCATE TABLE `wudong_m1_product`;
TRUNCATE TABLE `wudong_m1_sku`;
TRUNCATE TABLE `wudong_m1_order_ext`;
TRUNCATE TABLE `wudong_m2_restaurant`;
TRUNCATE TABLE `wudong_m2_dish`;
TRUNCATE TABLE `wudong_m2_time_slot`;
TRUNCATE TABLE `wudong_m2_slot_quota`;
TRUNCATE TABLE `wudong_m2_order_ext`;
TRUNCATE TABLE `wudong_m3_homestay`;
TRUNCATE TABLE `wudong_m3_room_type`;
TRUNCATE TABLE `wudong_m3_room_calendar`;
TRUNCATE TABLE `wudong_m3_order_ext`;
TRUNCATE TABLE `wudong_m4_scenic`;
TRUNCATE TABLE `wudong_m4_ticket`;
TRUNCATE TABLE `wudong_m4_route`;
TRUNCATE TABLE `wudong_m4_route_day`;
TRUNCATE TABLE `wudong_m4_order_ext`;
TRUNCATE TABLE `wudong_m5_post`;
TRUNCATE TABLE `wudong_m5_comment`;
TRUNCATE TABLE `wudong_m5_post_like`;

-- ===== 公共：用户 =====
INSERT INTO `wudong_common_user` (`id`, `phone`, `password_hash`, `name`, `avatar`, `bio`, `status`, `created_at`) VALUES
  (1, '13800001234', '', '山间旅人', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20traveler%20avatar%20illustration%20minimal%20backpack&image_size=square', '想去有云的地方', 'ENABLED', '2026-08-01 10:00:00'),
  (2, '13800000002', '', '追云者', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20camera&image_size=square', '在山里找到安静', 'ENABLED', '2026-08-01 10:00:00'),
  (3, '13800000003', '', '麦子', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal&image_size=square', '带孩子看世界', 'ENABLED', '2026-08-01 10:00:00'),
  (4, '13800000004', '', '旅人手记', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20scarf&image_size=square', '慢慢走，欣赏啊', 'ENABLED', '2026-08-01 10:00:00'),
  (5, '13800000005', '', '南方有雨', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20glasses&image_size=square', '胶片与蓝染', 'ENABLED', '2026-08-01 10:00:00'),
  (6, '13800000006', '', '带娃去看山', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20glasses&image_size=square', '亲子徒步中', 'ENABLED', '2026-08-01 10:00:00'),
  (7, '13800000007', '', '山月不知', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20woman%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (8, '13800000008', '', '荔枝', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (9, '13800000009', '', '观山', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20beard&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (10, '13800000010', '', '西柚', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20girl%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (11, '13800000011', '', '茶茶', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20short%20hair&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (12, '13800000012', '', '一路向黔', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20hat&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (13, '13800000013', '', 'Momo', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20ponytail&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (14, '13800000014', '', '稻香', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (15, '13800000015', '', '茶瘾', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (16, '13800000016', '', '微醺旅行家', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (17, '13800000017', '', '厨房杀手', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00'),
  (18, '13800000018', '', '非鱼', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20glasses&image_size=square', '', 'ENABLED', '2026-08-01 10:00:00');


-- ===== 公共：收货地址 =====
INSERT INTO `wudong_common_address` (`id`, `user_id`, `name`, `phone`, `region`, `detail`, `is_default`, `created_at`) VALUES
  (1, 1, '刘一', '13800001234', '广东省 广州市 天河区', '珠江新城华夏路 26 号 1201', 1, '2026-08-01 10:00:00'),
  (2, 1, '刘一', '13800001234', '贵州省 黔东南州 雷山县', '乌东村三组 24 号（假期收货）', 0, '2026-08-01 10:00:00');


-- ===== 公共：商家 =====
INSERT INTO `wudong_common_merchant` (`id`, `name`, `logo`, `contact_phone`, `intro`, `admin_user_id`, `status`, `created_at`) VALUES
  (1, '乌东银铺 · 杨光银', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20Chinese%20Miao%20silversmith%20portrait%2C%20weathered%20kind%20face&image_size=square', '13800000101', '杨光银师傅主理的老银铺，花丝与锻制银器四十余年。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (2, '乌东蓝染合作社', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=middle%20aged%20chinese%20Miao%20woman%20portrait%20smiling%2C%20indigo%20apron&image_size=square', '13800000102', '阿榜带头的蓝染合作社，板蓝根靛缸养了十二年。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (3, '潘玉珍绣坊', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20Miao%20woman%20in%20traditional%20silver%20headdress%20portrait&image_size=square', '13800000103', '省级苗绣代表性传承人潘玉珍主理的绣坊。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (4, '乌东服饰工坊', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20fashion%20dress%20with%20Miao%20embroidery%20elements%20on%20mannequin&image_size=square_hd', '13800000104', '非遗元素与现代剪裁结合的服饰工坊。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (5, '乌东特产合作社', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20tea%20pearls%20in%20ceramic%20jar%20with%20tea%20cup&image_size=square_hd', '13800000105', '乌东村合作社统一出品的山货特产。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (6, '云雾长桌宴', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20long%20table%20banquet%2C%20red%20lanterns%2C%20wooden%20stilt%20house%20interior%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000106', '三十六米长桌宴，高山泉水酸汤鱼。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (7, '梯田人家', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farmhouse%20restaurant%20terrace%20overlooking%20rice%20paddies%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000107', '稻田景观农家菜，露台正对层层梯田。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (8, '阿婆火塘', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20indoor%20fire%20pit%20dining%20room%2C%20rustic%20wooden%20benches%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000108', '火塘烤肉与米酒，只做晚上。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (9, '锦鸡轩茶餐', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20tea%20house%20restaurant%20interior%2C%20wooden%20lattice%20windows%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000109', '雷山银球茶入馔的新中式茶空间。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (10, '枕云山舍', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20stilt%20house%20guesthouse%20on%20hillside%20with%20sea%20of%20clouds%20view%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000110', '老木楼改造的八间观云民宿。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (11, '银匠世家客栈', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20courtyard%20inn%20with%20silver%20craft%20decorations%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000111', '老银匠家的宅子改的客栈。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (12, '稻田畔的院子', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural%20courtyard%20homestay%20next%20to%20green%20rice%20field%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000112', '院子外就是稻田的亲子民宿。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (13, '雾里 · 悬廊民宿', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20wooden%20architecture%20cantilever%20terrace%20forest%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000113', '悬空茶廊架在松林之上的设计民宿。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (14, '乌东旅行社', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=day%20tour%20village%20walking%20path%20silversmith%20workshop%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000114', '乌东村在地旅行社，深耕苗寨线路。', NULL, 'ENABLED', '2026-08-01 10:00:00'),
  (15, '乌东苗寨景区', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20village%20panorama%20wooden%20houses%20terraces%20valley%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '13800000115', '乌东苗寨景区运营方。', NULL, 'ENABLED', '2026-08-01 10:00:00');


-- ===== 公共：收藏（山间旅人） =====
INSERT INTO `wudong_common_favorite` (`id`, `user_id`, `target_type`, `target_id`) VALUES
  (1, 1, 'GOODS', 1),
  (2, 1, 'HOMESTAY', 1),
  (3, 1, 'RESTAURANT', 1),
  (4, 1, 'ROUTE', 1),
  (5, 1, 'POST', 1),
  (6, 1, 'POST', 3);


-- ===== 公共：购物车（山间旅人） =====
INSERT INTO `wudong_common_cart_item` (`id`, `user_id`, `product_id`, `sku_id`, `merchant_id`, `qty`, `checked`, `title`, `cover`, `sku_name`, `price`, `stock`, `shop_name`, `created_at`) VALUES
  (1, 1, 1, 1, 1, 1, 1, '手工苗银花丝手镯', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted%20Miao%20silver%20filigree%20bracelet%20on%20dark%20indigo%20linen&image_size=square_hd', '中号 · 圈口 58mm', 868, 12, '乌东银铺 · 杨光银', '2026-09-07 10:00:00'),
  (2, 1, 12, 20, 5, 2, 1, '红酸汤底料', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20sour%20soup%20paste%20in%20vacuum%20package%20with%20tomatoes&image_size=square_hd', '400g × 2 袋', 45, 100, '乌东特产合作社', '2026-09-07 10:05:00'),
  (3, 1, 9, 15, 5, 1, 0, '雷山银球茶 · 明前特级', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20tea%20pearls%20in%20ceramic%20jar%20with%20tea%20cup&image_size=square_hd', '100g × 2 礼盒', 298, 20, '乌东特产合作社', '2026-09-07 10:10:00');


-- ===== 公共：订单 =====
INSERT INTO `wudong_common_order` (`id`, `order_no`, `checkout_id`, `user_id`, `merchant_id`, `type`, `status`, `title`, `cover`, `summary`, `amount`, `qty`, `shop_name`, `expire_at`, `paid_at`, `completed_at`, `cancelled_at`, `cancel_reason`, `refund_reason`, `refund_amount`, `created_at`) VALUES
  (1, 'WD2609010001', NULL, 1, 10, 'LODGING', 'CONFIRMED', '枕云山舍 · 苗族木屋大床房', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20stilt%20house%20guesthouse%20on%20hillside%20with%20sea%20of%20clouds%20view%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '09-29 入住 · 09-30 离店 · 2 晚', 976, 1, '枕云山舍', NULL, '2026-09-01 09:25:00', NULL, NULL, '', '', NULL, '2026-09-01 09:20:00'),
  (2, 'WD2609020007', NULL, 1, 14, 'ROUTE', 'PAID', '苗寨漫游记 · 一日精华', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=day%20tour%20village%20walking%20path%20silversmith%20workshop%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '10-02 出发 · 2 大 1 小', 814, 3, '乌东旅行社', NULL, '2026-09-02 14:10:00', NULL, NULL, '', '', NULL, '2026-09-02 14:05:00'),
  (3, 'WD2609050012', NULL, 1, 1, 'GOODS', 'IN_PROGRESS', '手工苗银花丝手镯', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted%20Miao%20silver%20filigree%20bracelet%20on%20dark%20indigo%20linen&image_size=square_hd', '中号 · 圈口 58mm × 1 · 已发货（顺丰）', 868, 1, '乌东银铺 · 杨光银', NULL, '2026-09-05 11:35:00', NULL, NULL, '', '', NULL, '2026-09-05 11:30:00'),
  (4, 'WD2609060021', NULL, 1, 6, 'MEAL', 'UNPAID', '云雾长桌宴 · 餐位预订', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20long%20table%20banquet%2C%20red%20lanterns%2C%20wooden%20stilt%20house%20interior%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '09-10 晚餐 17:30 场 · 4 人', 352, 4, '云雾长桌宴', NULL, NULL, NULL, NULL, '', '', NULL, '2026-09-06 20:15:00'),
  (5, 'WD2608180033', NULL, 1, 15, 'TICKET', 'COMPLETED', '乌东苗寨景区 · 家庭套票', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20village%20panorama%20wooden%20houses%20terraces%20valley%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '08-18 入园 · 2 大 1 小 · 已核销', 138, 3, '乌东苗寨景区', NULL, '2026-08-18 09:05:00', '2026-08-18 16:00:00', NULL, '', '', NULL, '2026-08-18 09:00:00'),
  (6, 'WD2607220044', NULL, 1, 4, 'GOODS', 'REFUNDED', '百鸟衣改良礼服', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20fashion%20dress%20with%20Miao%20embroidery%20elements%20on%20mannequin&image_size=square_hd', '尺码不合 · 已全额退款', 2680, 1, '乌东服饰工坊', NULL, '2026-07-22 10:05:00', NULL, NULL, '', '尺码不合，申请全额退款', 2680, '2026-07-22 10:00:00');


-- ===== 公共：订单明细 =====
INSERT INTO `wudong_common_order_item` (`id`, `order_id`, `target_type`, `target_id`, `sku_id`, `title`, `cover`, `sku_name`, `price`, `qty`, `amount`, `created_at`) VALUES
  (1, 3, 'GOODS', 1, 1, '手工苗银花丝手镯', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted%20Miao%20silver%20filigree%20bracelet%20on%20dark%20indigo%20linen&image_size=square_hd', '中号 · 圈口 58mm', 868, 1, 868, '2026-09-05 11:30:00'),
  (2, 6, 'GOODS', 4, 6, '百鸟衣改良礼服', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20fashion%20dress%20with%20Miao%20embroidery%20elements%20on%20mannequin&image_size=square_hd', 'S (155/80A)', 2680, 1, 2680, '2026-07-22 10:00:00');


-- ===== 公共：支付单 =====
INSERT INTO `wudong_common_payment` (`id`, `pay_no`, `order_no`, `user_id`, `amount`, `status`, `provider`, `credential`, `paid_at`, `created_at`) VALUES
  (1, 'PAYWD2609010001', 'WD2609010001', 1, 976, 'SUCCESS', 'mock', 'MOCK-PAY-SUCCESS', '2026-09-01 09:25:00', '2026-09-01 09:20:00'),
  (2, 'PAYWD2609020007', 'WD2609020007', 1, 814, 'SUCCESS', 'mock', 'MOCK-PAY-SUCCESS', '2026-09-02 14:10:00', '2026-09-02 14:05:00'),
  (3, 'PAYWD2609050012', 'WD2609050012', 1, 868, 'SUCCESS', 'mock', 'MOCK-PAY-SUCCESS', '2026-09-05 11:35:00', '2026-09-05 11:30:00'),
  (4, 'PAYWD2609060021', 'WD2609060021', 1, 352, 'PENDING', 'mock', '', NULL, '2026-09-06 20:15:00'),
  (5, 'PAYWD2608180033', 'WD2608180033', 1, 138, 'SUCCESS', 'mock', 'MOCK-PAY-SUCCESS', '2026-08-18 09:05:00', '2026-08-18 09:00:00'),
  (6, 'PAYWD2607220044', 'WD2607220044', 1, 2680, 'REFUNDED', 'mock', 'MOCK-PAY-SUCCESS', '2026-07-22 10:05:00', '2026-07-22 10:00:00');


-- ===== 公共：评价 =====
INSERT INTO `wudong_common_review` (`id`, `user_id`, `user_name`, `user_avatar`, `target_type`, `target_id`, `order_no`, `rating`, `content`, `images`, `reply`, `reply_at`, `status`, `created_at`) VALUES
  (1, 7, '山月不知', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20woman%20avatar%20illustration%20minimal&image_size=square', 'GOODS', 1, 'WD2608219001', 5.0, '花丝细得惊人，灯光下整只镯子像流动的水。给妈妈买的生日礼物，她戴上就不肯摘了。', NULL, '感谢喜爱，杨师傅听闻后连夜又敲了一只同款，哈哈。', '2026-08-22 10:00:00', 'PASSED', '2026-08-21 12:00:00'),
  (2, 8, '荔枝', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal&image_size=square', 'GOODS', 1, 'WD2607309002', 5.0, '比景区里机器货重得多，细节处能看到锤纹，值得。', NULL, NULL, NULL, 'PASSED', '2026-07-30 12:00:00'),
  (3, 5, '南方有雨', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20glasses&image_size=square', 'GOODS', 2, 'WD2608159003', 5.0, '冰裂纹太美了，每一张都不一样。裹在脖子上有一股淡淡的草木香。', NULL, NULL, NULL, 'PASSED', '2026-08-15 12:00:00'),
  (4, 9, '观山', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20beard&image_size=square', 'GOODS', 3, 'WD2606189004', 5.0, '收到时全家人都安静了。丝线的光泽随角度流转，照片根本拍不出十分之一。', NULL, NULL, NULL, 'PASSED', '2026-06-18 12:00:00'),
  (5, 10, '西柚', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20girl%20avatar%20illustration%20minimal&image_size=square', 'GOODS', 5, 'WD2608029005', 5.0, '蝴蝶翅膀是镂空的，转头的时候会微微颤，超灵动。', NULL, NULL, NULL, 'PASSED', '2026-08-02 12:00:00'),
  (6, 11, '茶茶', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20short%20hair&image_size=square', 'GOODS', 7, 'WD2608289006', 5.0, '一百块不到就能收到手工绣片，当伴手礼太合适了。', NULL, NULL, NULL, 'PASSED', '2026-08-28 12:00:00'),
  (7, 6, '带娃去看山', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20glasses&image_size=square', 'GOODS', 8, 'WD2607119007', 5.0, '孩子敲了一下午也不喊累，戒指上刻了他自己的名字。这比任何游乐场都值。', NULL, NULL, NULL, 'PASSED', '2026-07-11 12:00:00'),
  (8, 12, '一路向黔', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20hat&image_size=square', 'RESTAURANT', 1, 'WD2608199008', 5.0, '酸汤喝到第二碗才开始说话——好喝到顾不上。敬酒歌一响全桌起鸡皮疙瘩。', NULL, NULL, NULL, 'PASSED', '2026-08-19 12:00:00'),
  (9, 13, 'Momo', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20ponytail&image_size=square', 'RESTAURANT', 1, 'WD2607259009', 4.0, '长桌宴氛围满分，就是晚餐时段人多，建议提前订位。', NULL, NULL, NULL, 'PASSED', '2026-07-25 12:00:00'),
  (10, 14, '稻香', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal&image_size=square', 'RESTAURANT', 2, 'WD2608059010', 5.0, '坐在露台上吃鱼，脚下就是自己游泳过的稻田，体验太独特了。', NULL, NULL, NULL, 'PASSED', '2026-08-05 12:00:00'),
  (11, 15, '茶瘾', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal&image_size=square', 'SPECIALTY', 9, 'WD2608229011', 5.0, '球茶很有仪式感，第三泡甜感最明显。回购第三次了。', NULL, NULL, NULL, 'PASSED', '2026-08-22 12:00:00'),
  (12, 16, '微醺旅行家', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal&image_size=square', 'SPECIALTY', 11, 'WD2608309012', 5.0, '在长桌宴喝过一次就一直惦记，收到后冰镇再喝，绝了。', NULL, NULL, NULL, 'PASSED', '2026-08-30 12:00:00'),
  (13, 17, '厨房杀手', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal&image_size=square', 'SPECIALTY', 12, 'WD2607149013', 5.0, '照说明煮了一条鲈鱼，全家连汤都喝光了。', NULL, NULL, NULL, 'PASSED', '2026-07-14 12:00:00'),
  (14, 2, '追云者', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20camera&image_size=square', 'HOMESTAY', 1, 'WD2608179014', 5.0, '凌晨五点被管家轻轻敲门叫醒看云海，是我这趟旅行的高光时刻。', NULL, NULL, NULL, 'PASSED', '2026-08-17 12:00:00'),
  (15, 3, '麦子', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal&image_size=square', 'HOMESTAY', 1, 'WD2607299015', 5.0, '木楼隔音比想象中好，床垫是新的，早餐的酸汤粉我吃了两碗。', NULL, NULL, NULL, 'PASSED', '2026-07-29 12:00:00'),
  (16, 18, '非鱼', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20woman%20avatar%20illustration%20minimal%20glasses&image_size=square', 'HOMESTAY', 2, 'WD2608089016', 5.0, '在堂屋跟老爷子学了一晚上掐丝，住民宿还能上一堂非遗课，太值了。', NULL, NULL, NULL, 'PASSED', '2026-08-08 12:00:00'),
  (17, 4, '旅人手记', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20avatar%20illustration%20minimal%20scarf&image_size=square', 'HOMESTAY', 4, 'WD2608259017', 5.0, '在悬廊上喝了两个小时的茶，一片叶子都没舍得错过。服务是「在场但不打扰」的分寸感。', NULL, NULL, NULL, 'PASSED', '2026-08-25 12:00:00');


-- ===== 公共：站内消息 =====
INSERT INTO `wudong_common_message` (`id`, `user_id`, `type`, `title`, `content`, `is_read`, `related_type`, `related_id`, `created_at`) VALUES
  (1, 1, 'ORDER', '订单已确认', '您预订的「枕云山舍 · 苗族木屋大床房」已获商家确认，入住当天出示订单号即可。', 0, 'ORDER', 'WD2609010001', '2026-09-01 10:24:00'),
  (2, 1, 'ORDER', '包裹已发出', '您购买的手工苗银花丝手镯已由顺丰揽收，运单号 SF1388…0091。', 0, 'ORDER', 'WD2609050012', '2026-09-05 18:40:00'),
  (3, 1, 'INTERACT', '收到新的点赞', '「追云者」赞了你的游记《一个人的乌东》。', 0, 'POST', '9', '2026-09-06 09:12:00'),
  (4, 1, 'SYSTEM', '苗年节早鸟优惠开启', '「苗年节庆 · 三日狂欢」路线现已开放预订，前 50 名立减 100 元。', 1, 'ROUTE', '4', '2026-09-06 08:00:00');


-- ===== 公共：Banner / 公告 / 热搜词 / 推荐位 =====
INSERT INTO `wudong_common_banner` (`id`, `title`, `subtitle`, `image`, `link`, `sort`, `enabled`, `created_at`) VALUES
  (1, '银饰锻造之声', '百年炉火不熄，乌东银匠村', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close-up%20of%20Miao%20silver%20headdress%20jewelry%20craftsmanship%2C%20dark%20moody%20lighting%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '/goods', 1, 1, '2026-08-01 10:00:00'),
  (2, '梯田云海之间', '住进吊脚楼，推开窗就是苗岭晨雾', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20rice%20terraces%20and%20morning%20mist%20over%20mountain%20village%20aerial%20view%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '/stay', 2, 1, '2026-08-01 10:00:00'),
  (3, '长桌宴上百家菜', '酸汤鱼、糯米酒与芦笙歌', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20long%20table%20banquet%20with%20many%20dishes%2C%20warm%20lantern%20light%2C%20festival%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '/food', 3, 1, '2026-08-01 10:00:00');


INSERT INTO `wudong_common_announcement` (`id`, `content`, `sort`, `enabled`, `created_at`) VALUES
  (1, '「苗年节」11 月中旬启幕，路线套餐早鸟立减 100 元', 1, 1, '2026-08-01 10:00:00'),
  (2, '新用户注册即领 30 元文旅礼包', 2, 1, '2026-08-01 10:00:00'),
  (3, '乌东非遗工坊体验课每周三、周六开班', 3, 1, '2026-08-01 10:00:00');


INSERT INTO `wudong_common_search_keyword` (`id`, `keyword`, `heat`, `enabled`, `created_at`) VALUES
  (1, '银饰', 9800, 1, '2026-08-01 10:00:00'),
  (2, '长桌宴', 8600, 1, '2026-08-01 10:00:00'),
  (3, '云海民宿', 7400, 1, '2026-08-01 10:00:00'),
  (4, '苗年节', 6200, 1, '2026-08-01 10:00:00'),
  (5, '蓝染体验', 5100, 1, '2026-08-01 10:00:00'),
  (6, '酸汤鱼', 4300, 1, '2026-08-01 10:00:00');


INSERT INTO `wudong_common_recommend` (`id`, `position`, `target_type`, `target_id`, `sort`, `enabled`, `created_at`) VALUES
  (1, 'HOME_GOODS', 'GOODS', 1, 1, 1, '2026-08-01 10:00:00'),
  (2, 'HOME_GOODS', 'GOODS', 2, 2, 1, '2026-08-01 10:00:00'),
  (3, 'HOME_GOODS', 'GOODS', 3, 3, 1, '2026-08-01 10:00:00'),
  (4, 'HOME_GOODS', 'GOODS', 4, 4, 1, '2026-08-01 10:00:00'),
  (5, 'HOME_RESTAURANT', 'RESTAURANT', 1, 1, 1, '2026-08-01 10:00:00'),
  (6, 'HOME_RESTAURANT', 'RESTAURANT', 2, 2, 1, '2026-08-01 10:00:00'),
  (7, 'HOME_RESTAURANT', 'RESTAURANT', 3, 3, 1, '2026-08-01 10:00:00'),
  (8, 'HOME_HOMESTAY', 'HOMESTAY', 1, 1, 1, '2026-08-01 10:00:00'),
  (9, 'HOME_HOMESTAY', 'HOMESTAY', 2, 2, 1, '2026-08-01 10:00:00'),
  (10, 'HOME_HOMESTAY', 'HOMESTAY', 3, 3, 1, '2026-08-01 10:00:00'),
  (11, 'HOME_ROUTE', 'ROUTE', 1, 1, 1, '2026-08-01 10:00:00'),
  (12, 'HOME_ROUTE', 'ROUTE', 2, 2, 1, '2026-08-01 10:00:00'),
  (13, 'HOME_ROUTE', 'ROUTE', 3, 3, 1, '2026-08-01 10:00:00'),
  (14, 'HOME_POST', 'POST', 1, 1, 1, '2026-08-01 10:00:00'),
  (15, 'HOME_POST', 'POST', 2, 2, 1, '2026-08-01 10:00:00'),
  (16, 'HOME_POST', 'POST', 3, 3, 1, '2026-08-01 10:00:00'),
  (17, 'HOME_POST', 'POST', 4, 4, 1, '2026-08-01 10:00:00'),
  (18, 'HOME_POST', 'POST', 5, 5, 1, '2026-08-01 10:00:00'),
  (19, 'HOME_POST', 'POST', 6, 6, 1, '2026-08-01 10:00:00');


-- ===== m1 衣/特产：类目 / 商品 / SKU =====
INSERT INTO `wudong_m1_category` (`id`, `module`, `name`, `sort`, `created_at`) VALUES
  (1, 'GOODS', '银饰', 1, '2026-08-01 10:00:00'),
  (2, 'GOODS', '蜡染', 2, '2026-08-01 10:00:00'),
  (3, 'GOODS', '刺绣', 3, '2026-08-01 10:00:00'),
  (4, 'GOODS', '苗族服饰', 4, '2026-08-01 10:00:00'),
  (5, 'SPECIALTY', '茶叶', 1, '2026-08-01 10:00:00'),
  (6, 'SPECIALTY', '腊肉', 2, '2026-08-01 10:00:00'),
  (7, 'SPECIALTY', '米酒', 3, '2026-08-01 10:00:00'),
  (8, 'SPECIALTY', '酸食', 4, '2026-08-01 10:00:00'),
  (9, 'SPECIALTY', '其他', 5, '2026-08-01 10:00:00');


INSERT INTO `wudong_m1_product` (`id`, `module`, `category_id`, `merchant_id`, `title`, `subtitle`, `price`, `market_price`, `sales`, `rating`, `stock`, `cover`, `images`, `detail`, `craft`, `artisan`, `origin`, `shelf_life`, `status`, `created_at`) VALUES
  (1, 'GOODS', 1, 1, '手工苗银花丝手镯', '拉丝掐花 · 蝶恋花项圈纹', 868, 1080, 231, 4.9, 12, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted%20Miao%20silver%20filigree%20bracelet%20on%20dark%20indigo%20linen&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted%20Miao%20silver%20filigree%20bracelet%20on%20dark%20indigo%20linen&image_size=square_hd","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20silversmith%20hands%20crafting%20silver%20jewelry%20with%20small%20hammer&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20bracelet%20detail%20butterfly%20pattern%20macro%20photography&image_size=square"]', '<p>足银 999，手工锻制，附传承人亲签证书与防氧化收纳袋。圈口可凭手围定制，工期 7-10 天。</p><p>佩戴建议：避免与硫磺皂接触，沐浴时取下；定期用擦银布护理可保持雪亮光泽。</p>', '花丝工艺需将银条拉成发丝般的细丝，再掐、填、攒、焊成型。一只手镯需经三十余道工序、七天锤炼，蝶恋花纹样取自苗族古歌中的「蝴蝶妈妈」。', '{"name":"杨光银","title":"州级银饰锻造技艺传承人","avatar":"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20Chinese%20Miao%20silversmith%20portrait%2C%20weathered%20kind%20face&image_size=square","story":"杨师傅 14 岁随父学艺，守着乌东老银铺的炉火四十余年。他坚持不用模具，每一件银器上的纹样都由手锤一寸寸敲出，「机器压的花太死，银是有呼吸的」。"}', NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (2, 'GOODS', 2, 2, '靛蓝植物染方巾', '板蓝根蓝染 · 冰裂纹', 128, 168, 512, 4.8, 40, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20blue%20batik%20square%20scarf%20folded%2C%20crackle%20texture%20pattern&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20blue%20batik%20square%20scarf%20folded%2C%20crackle%20texture%20pattern&image_size=square_hd","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20dye%20vat%20with%20fabric%20being%20dipped%2C%20workshop%20scene&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=batik%20wax%20drawing%20with%20copper%20knife%20on%20white%20cloth&image_size=square"]', '<p>纯棉加厚纱巾，植物染无固色剂，初期会有轻微浮色属正常现象。冷水单独手洗，阴干。</p>', '以板蓝根发酵建蓝靛缸，布入缸七浸七晾，氧化转蓝。蜡刀点画的铜鼓纹在脱蜡后留下永不重复的冰裂纹——那是蓝与时间合作的签名。', '{"name":"阿榜","title":"蜡染合作社带头人","avatar":"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=middle%20aged%20chinese%20Miao%20woman%20portrait%20smiling%2C%20indigo%20apron&image_size=square","story":"阿榜带着村里二十多位绣娘媳妇经营蓝染坊，染缸养了十二年。她说养缸如养娃，冬天要喂酒，夏天怕跑蓝。"}', NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (3, 'GOODS', 3, 3, '破线绣双龙捧寿壁挂', '八股丝破线 · 平绣堆绣结合', 1680, NULL, 46, 5.0, 3, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20Miao%20embroidery%20dragon%20wall%20hanging%20textile%20art&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20Miao%20embroidery%20dragon%20wall%20hanging%20textile%20art&image_size=square_hd","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20embroidery%20close-up%20silk%20thread%20work%20vibrant%20colors&image_size=square"]', '<p>含实木框与挂件，附收藏证书。画面为纯手工绣制，交付周期约 30 天。</p>', '破线绣将一根丝线破成八至十六股，绣面如缎似瓷。双龙捧寿为清水江流域苗绣经典题材，一幅需绣娘伏案四个月。', '{"name":"潘玉珍","title":"省级苗绣代表性传承人","avatar":"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20Miao%20woman%20in%20traditional%20silver%20headdress%20portrait&image_size=square","story":"潘奶奶七岁学绣，如今一家三代皆以绣为生。她的绣片上从不起稿，「花在心里，线跟花走」。"}', NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (4, 'GOODS', 4, 4, '百鸟衣改良礼服', '非遗元素 × 现代剪裁', 2680, 3280, 89, 4.7, 6, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20fashion%20dress%20with%20Miao%20embroidery%20elements%20on%20mannequin&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20fashion%20dress%20with%20Miao%20embroidery%20elements%20on%20mannequin&image_size=square_hd","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20festival%20costume%20with%20silver%20ornaments%20full%20display&image_size=square"]', '<p>以丹寨百鸟衣纹样为灵感，真丝欧根纱手工缀绣鸟纹，裙摆内衬足银丝滚边。礼服可租赁体验（详情咨询客服）。</p>', NULL, NULL, NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (5, 'GOODS', 1, 1, '苗银蝴蝶妈妈耳坠', '轻量日常款 · 3.2g/只', 328, NULL, 677, 4.9, 25, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicate%20silver%20butterfly%20earrings%20on%20linen%20cloth&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicate%20silver%20butterfly%20earrings%20on%20linen%20cloth&image_size=square_hd"]', '<p>925 银镀铑防氧化，附礼品盒。</p>', '「蝴蝶妈妈」是苗族创世神话中万物之母。耳坠仅 3.2 克，日常佩戴无负担。', NULL, NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (6, 'GOODS', 2, 2, '铜鼓纹蜡染桌旗', '手工点蜡 · 2.2m 长幅', 388, NULL, 124, 4.8, 15, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20batik%20table%20runner%20with%20bronze%20drum%20pattern%20on%20wooden%20table&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20batik%20table%20runner%20with%20bronze%20drum%20pattern%20on%20wooden%20table&image_size=square_hd"]', '<p>棉麻混纺，桌面陈设或茶席皆宜。</p>', '铜鼓纹是苗族「迁徙史诗」的图腾记忆，中心太阳纹象征祖先故土。', NULL, NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (7, 'GOODS', 3, 3, '数纱绣杯垫六件套', '几何挑花 · 入门收藏', 98, NULL, 923, 4.6, 60, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=set%20of%20six%20geometric%20embroidered%20coasters%20colorful&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=set%20of%20six%20geometric%20embroidered%20coasters%20colorful&image_size=square_hd"]', '<p>数纱绣按布纹经纬数纱挑绣，纹样为各地苗寨支系图谱，六片各不相同。</p>', NULL, NULL, NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (8, 'GOODS', 1, 1, '银饰体验课 · 亲子半日', '亲手打一枚银戒指（乌东本地）', 268, NULL, 342, 4.9, 10, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parent%20and%20child%20making%20silver%20ring%20at%20crafting%20workshop&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parent%20and%20child%20making%20silver%20ring%20at%20crafting%20workshop&image_size=square_hd"]', '<p>每场限 6 组家庭，请提前 2 天预约。到店体验，不发货。</p>', '杨师傅手把手教学：熔银、锻打、退火、抛光，成品戒指带走。含全套工具与围裙。', NULL, NULL, NULL, 'ON_SHELF', '2026-08-01 10:00:00'),
  (9, 'SPECIALTY', 5, 5, '雷山银球茶 · 明前特级', '高山云雾茶 · 100g 罐装', 158, 198, 1204, 4.9, 80, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20tea%20pearls%20in%20ceramic%20jar%20with%20tea%20cup&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green%20tea%20pearls%20in%20ceramic%20jar%20with%20tea%20cup&image_size=square_hd","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tea%20plantation%20on%20misty%20mountain%20terraces&image_size=square"]', '<p>独芽一叶，手工揉制成球状。冲泡时银球徐徐舒展，汤色嫩绿透亮，栗香带甜。曾获轻工部优秀新产品奖。</p>', NULL, NULL, '乌东村后山茶园 · 海拔 1300m', '18 个月（避光密封）', 'ON_SHELF', '2026-08-01 10:00:00'),
  (10, 'SPECIALTY', 6, 5, '柴火烟熏腊肉', '柏枝熏 45 天 · 500g 袋装', 88, NULL, 866, 4.8, 45, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smoked%20cured%20pork%20hanging%20with%20hemp%20rope%20rustic&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smoked%20cured%20pork%20hanging%20with%20hemp%20rope%20rustic&image_size=square_hd"]', '<p>岁末宰杀，柏枝混橘皮冷熏 45 天。切片蒸食或炒蒜苗，肥肉透明不腻。</p>', NULL, NULL, '乌东村二组 · 农户自养黑毛猪', '6 个月（冷冻）', 'ON_SHELF', '2026-08-01 10:00:00'),
  (11, 'SPECIALTY', 7, 5, '苗家糯米酒', '陶坛 1.5L · 12 度微醺', 68, NULL, 543, 4.7, 60, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice%20wine%20in%20ceramic%20jars%20with%20red%20paper%20seal&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice%20wine%20in%20ceramic%20jars%20with%20red%20paper%20seal&image_size=square_hd"]', '<p>高山糯米配山泉水，古法酒曲发酵。入口绵甜，后劲温柔——「苗家的酒，喝了不口干」。</p>', NULL, NULL, '乌东村三组 · 吴家酒坊', '12 个月', 'ON_SHELF', '2026-08-01 10:00:00'),
  (12, 'SPECIALTY', 8, 5, '红酸汤底料', '毛辣果发酵 · 400g × 2 袋', 45, NULL, 1532, 4.8, 100, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20sour%20soup%20paste%20in%20vacuum%20package%20with%20tomatoes&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20sour%20soup%20paste%20in%20vacuum%20package%20with%20tomatoes&image_size=square_hd"]', '<p>野生小番茄（毛辣果）自然发酵 30 天，不添加番茄酱。在家 10 分钟复刻凯里酸汤鱼。</p>', NULL, NULL, '乌东村合作社统一生产', '9 个月', 'ON_SHELF', '2026-08-01 10:00:00'),
  (13, 'SPECIALTY', 8, 5, '手打糍粑', '纯糯米 · 8 个装真空', 38, NULL, 721, 4.6, 50, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round%20sticky%20rice%20cakes%20stacked%20with%20wooden%20mold&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round%20sticky%20rice%20cakes%20stacked%20with%20wooden%20mold&image_size=square_hd"]', '<p>木槌轮流捶打一小时成型。煎软后蘸黄豆面或炭火烤胀，是苗寨孩子最深的年味记忆。</p>', NULL, NULL, '乌东村 · 节庆作坊', '30 天（冷冻 3 个月）', 'ON_SHELF', '2026-08-01 10:00:00'),
  (14, 'SPECIALTY', 9, 5, '蜂蜜 · 百花秋蜜', '中华土蜂蜜 · 500g', 128, NULL, 389, 4.9, 30, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=honey%20jar%20with%20honeycomb%20and%20wooden%20dipper&image_size=square_hd', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=honey%20jar%20with%20honeycomb%20and%20wooden%20dipper&image_size=square_hd"]', '<p>中华蜂采集秋冬季百花，一年只割一次。结晶细腻，冲水微酸回甘。</p>', NULL, NULL, '乌东村后山蜂场 · 一年一取', '24 个月', 'ON_SHELF', '2026-08-01 10:00:00');


INSERT INTO `wudong_m1_sku` (`id`, `product_id`, `name`, `price`, `stock`, `created_at`) VALUES
  (1, 1, '中号 · 圈口 58mm', 868, 8, '2026-08-01 10:00:00'),
  (2, 1, '大号 · 圈口 62mm', 928, 4, '2026-08-01 10:00:00'),
  (3, 2, '53cm 方巾', 128, 30, '2026-08-01 10:00:00'),
  (4, 2, '90cm 大方巾', 228, 10, '2026-08-01 10:00:00'),
  (5, 3, '60 × 90cm 含木框', 1680, 3, '2026-08-01 10:00:00'),
  (6, 4, 'S (155/80A)', 2680, 2, '2026-08-01 10:00:00'),
  (7, 4, 'M (160/84A)', 2680, 3, '2026-08-01 10:00:00'),
  (8, 4, 'L (165/88A)', 2680, 1, '2026-08-01 10:00:00'),
  (9, 5, '单对装', 328, 25, '2026-08-01 10:00:00'),
  (10, 6, '33 × 220cm', 388, 15, '2026-08-01 10:00:00'),
  (11, 7, '六件套礼盒', 98, 60, '2026-08-01 10:00:00'),
  (12, 8, '1 大 1 小（周三场）', 268, 5, '2026-08-01 10:00:00'),
  (13, 8, '1 大 1 小（周六场）', 298, 5, '2026-08-01 10:00:00'),
  (14, 9, '100g 罐装', 158, 60, '2026-08-01 10:00:00'),
  (15, 9, '100g × 2 礼盒', 298, 20, '2026-08-01 10:00:00'),
  (16, 10, '五花肉 500g', 88, 30, '2026-08-01 10:00:00'),
  (17, 10, '猪脚 750g', 108, 15, '2026-08-01 10:00:00'),
  (18, 11, '原味 1.5L', 68, 40, '2026-08-01 10:00:00'),
  (19, 11, '杨梅味 1.5L', 78, 20, '2026-08-01 10:00:00'),
  (20, 12, '400g × 2 袋', 45, 100, '2026-08-01 10:00:00'),
  (21, 13, '8 个装', 38, 50, '2026-08-01 10:00:00'),
  (22, 14, '500g 玻璃瓶', 128, 30, '2026-08-01 10:00:00');


-- ===== m1 衣/特产：订单扩展 =====
INSERT INTO `wudong_m1_order_ext` (`id`, `order_id`, `product_id`, `sku_id`, `receiver_name`, `receiver_phone`, `receiver_addr`, `logistics_no`, `created_at`) VALUES
  (1, 3, 1, 1, '刘一', '13800001234', '广东省 广州市 天河区珠江新城华夏路 26 号 1201', 'SF1388000091', '2026-09-05 11:30:00'),
  (2, 6, 4, 6, '刘一', '13800001234', '广东省 广州市 天河区珠江新城华夏路 26 号 1201', '', '2026-07-22 10:00:00');


-- ===== m2 食：餐厅 / 菜品 / 时段 / 每日余量 =====
INSERT INTO `wudong_m2_restaurant` (`id`, `merchant_id`, `name`, `cover`, `images`, `rating`, `price_per_capita`, `address`, `hours`, `capacity`, `tags`, `intro`, `status`, `created_at`) VALUES
  (1, 6, '云雾长桌宴', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20long%20table%20banquet%2C%20red%20lanterns%2C%20wooden%20stilt%20house%20interior%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20long%20table%20banquet%2C%20red%20lanterns%2C%20wooden%20stilt%20house%20interior%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Guizhou%20sour%20soup%20fish%20hotpot%20red%20broth%20steam&image_size=landscape_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glutinous%20rice%20wine%20bowls%20on%20wooden%20table&image_size=landscape_4_3"]', 4.8, 88, '乌东村鼓楼坪东侧 · 1 号木楼', '11:00 - 14:00 / 17:00 - 21:00', 120, '["长桌宴","酸汤鱼","芦笙敬酒歌"]', '三十六米长桌沿木楼一字排开，酸汤鱼用高山泉水与毛辣果发酵整整三日。开席时有穿盛装的姑娘捧牛角杯唱敬酒歌——不留客套，只留杯盏。', 'ENABLED', '2026-08-01 10:00:00'),
  (2, 7, '梯田人家', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farmhouse%20restaurant%20terrace%20overlooking%20rice%20paddies%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farmhouse%20restaurant%20terrace%20overlooking%20rice%20paddies%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9"]', 4.7, 56, '乌东村西梯田步道口', '10:30 - 20:30', 60, '["稻田景观位","农家菜"]', '老板是村里的种粮大户，稻田鸭、田埂鱼都是自家田里现抓。露台正对层层梯田，日落时分整面墙都被染成金色。', 'ENABLED', '2026-08-01 10:00:00'),
  (3, 8, '阿婆火塘', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20indoor%20fire%20pit%20dining%20room%2C%20rustic%20wooden%20benches%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20indoor%20fire%20pit%20dining%20room%2C%20rustic%20wooden%20benches%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9"]', 4.9, 45, '乌东村四组巷内（导航「阿婆火塘」）', '16:00 - 23:00', 30, '["火塘烤肉","夜话"]', '天黑后推开阿婆家的门，火塘上挂着正在滴油的腊肉，管够的米酒和讲不完的苗寨故事。只做晚上，去晚要拼桌。', 'ENABLED', '2026-08-01 10:00:00'),
  (4, 9, '锦鸡轩茶餐', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20tea%20house%20restaurant%20interior%2C%20wooden%20lattice%20windows%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20tea%20house%20restaurant%20interior%2C%20wooden%20lattice%20windows%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9"]', 4.6, 66, '乌东村游客中心二层', '09:00 - 18:00', 40, '["新中式","茶点"]', '老宅改造成的清雅茶空间，雷山银球茶入馔，茶香鸡、茶汤豆腐是招牌。适合逛累了的下午。', 'ENABLED', '2026-08-01 10:00:00');


INSERT INTO `wudong_m2_dish` (`id`, `restaurant_id`, `name`, `price`, `img`, `is_signature`, `sort`, `created_at`) VALUES
  (1, 1, '凯里红酸汤鱼（稻田鲤）', 128, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sour%20soup%20fish%20hotpot&image_size=square', 1, 1, '2026-08-01 10:00:00'),
  (2, 1, '柴火烟熏腊肉', 58, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smoked%20cured%20pork%20slices%20plate&image_size=square', 1, 2, '2026-08-01 10:00:00'),
  (3, 1, '糯米五彩饭', 28, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=five%20color%20glutinous%20rice&image_size=square', 0, 3, '2026-08-01 10:00:00'),
  (4, 1, '凉拌折耳根', 18, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cold%20dish%20houttuynia%20root%20salad&image_size=square', 0, 4, '2026-08-01 10:00:00'),
  (5, 1, '自酿杨梅汤', 16, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bayberry%20drink%20glass%20red&image_size=square', 0, 5, '2026-08-01 10:00:00'),
  (6, 2, '田埂稻花鱼', 88, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice%20field%20fish%20dish&image_size=square', 1, 1, '2026-08-01 10:00:00'),
  (7, 2, '柴火土鸡汤', 78, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chicken%20soup%20clay%20pot&image_size=square', 1, 2, '2026-08-01 10:00:00'),
  (8, 2, '清炒时蔬', 22, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20fried%20vegetables%20plate&image_size=square', 0, 3, '2026-08-01 10:00:00'),
  (9, 3, '火塘烤五花', 48, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grilled%20pork%20belly%20over%20fire&image_size=square', 1, 1, '2026-08-01 10:00:00'),
  (10, 3, '烤糍粑蘸黄豆面', 15, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grilled%20sticky%20rice%20cake&image_size=square', 0, 2, '2026-08-01 10:00:00'),
  (11, 3, '陶罐米酒（一壶）', 38, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice%20wine%20ceramic%20pot&image_size=square', 1, 3, '2026-08-01 10:00:00'),
  (12, 4, '银球茶香鸡', 68, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tea%20flavored%20chicken%20dish%20elegant&image_size=square', 1, 1, '2026-08-01 10:00:00'),
  (13, 4, '茶汤嫩豆腐', 32, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tofu%20in%20green%20tea%20broth&image_size=square', 0, 2, '2026-08-01 10:00:00'),
  (14, 4, '苗家九宫格点心', 58, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nine%20grid%20dessert%20dim%20sum&image_size=square', 1, 3, '2026-08-01 10:00:00');


INSERT INTO `wudong_m2_time_slot` (`id`, `restaurant_id`, `name`, `capacity`, `sort`, `created_at`) VALUES
  (1, 1, '午餐 11:30 - 13:30', 40, 1, '2026-08-01 10:00:00'),
  (2, 1, '晚餐 17:30 - 19:30', 40, 2, '2026-08-01 10:00:00'),
  (3, 1, '晚宴 19:30 - 21:30', 20, 3, '2026-08-01 10:00:00'),
  (4, 2, '午餐 11:00 - 13:00', 20, 1, '2026-08-01 10:00:00'),
  (5, 2, '晚餐 17:30 - 19:30', 20, 2, '2026-08-01 10:00:00'),
  (6, 3, '夜场 17:00 - 19:00', 15, 1, '2026-08-01 10:00:00'),
  (7, 3, '夜场 19:00 - 21:00', 15, 2, '2026-08-01 10:00:00'),
  (8, 4, '午市 11:30 - 13:30', 20, 1, '2026-08-01 10:00:00'),
  (9, 4, '下午茶 14:00 - 16:30', 20, 2, '2026-08-01 10:00:00');


INSERT INTO `wudong_m2_slot_quota` (`id`, `restaurant_id`, `slot_id`, `date`, `remaining`, `created_at`) VALUES
  (1, 1, 1, '2026-09-08', 12, '2026-09-08 00:00:00'),
  (2, 1, 2, '2026-09-08', 4, '2026-09-08 00:00:00'),
  (3, 1, 3, '2026-09-08', 8, '2026-09-08 00:00:00'),
  (4, 2, 4, '2026-09-08', 6, '2026-09-08 00:00:00'),
  (5, 2, 5, '2026-09-08', 14, '2026-09-08 00:00:00'),
  (6, 3, 6, '2026-09-08', 3, '2026-09-08 00:00:00'),
  (7, 3, 7, '2026-09-08', 10, '2026-09-08 00:00:00'),
  (8, 4, 8, '2026-09-08', 16, '2026-09-08 00:00:00'),
  (9, 4, 9, '2026-09-08', 11, '2026-09-08 00:00:00'),
  (10, 1, 1, '2026-09-09', 12, '2026-09-08 00:00:00'),
  (11, 1, 2, '2026-09-09', 4, '2026-09-08 00:00:00'),
  (12, 1, 3, '2026-09-09', 8, '2026-09-08 00:00:00'),
  (13, 2, 4, '2026-09-09', 6, '2026-09-08 00:00:00'),
  (14, 2, 5, '2026-09-09', 14, '2026-09-08 00:00:00'),
  (15, 3, 6, '2026-09-09', 3, '2026-09-08 00:00:00'),
  (16, 3, 7, '2026-09-09', 10, '2026-09-08 00:00:00'),
  (17, 4, 8, '2026-09-09', 16, '2026-09-08 00:00:00'),
  (18, 4, 9, '2026-09-09', 11, '2026-09-08 00:00:00'),
  (19, 1, 1, '2026-09-10', 12, '2026-09-08 00:00:00'),
  (20, 1, 2, '2026-09-10', 4, '2026-09-08 00:00:00'),
  (21, 1, 3, '2026-09-10', 8, '2026-09-08 00:00:00'),
  (22, 2, 4, '2026-09-10', 6, '2026-09-08 00:00:00'),
  (23, 2, 5, '2026-09-10', 14, '2026-09-08 00:00:00'),
  (24, 3, 6, '2026-09-10', 3, '2026-09-08 00:00:00'),
  (25, 3, 7, '2026-09-10', 10, '2026-09-08 00:00:00'),
  (26, 4, 8, '2026-09-10', 16, '2026-09-08 00:00:00'),
  (27, 4, 9, '2026-09-10', 11, '2026-09-08 00:00:00'),
  (28, 1, 1, '2026-09-11', 12, '2026-09-08 00:00:00'),
  (29, 1, 2, '2026-09-11', 4, '2026-09-08 00:00:00'),
  (30, 1, 3, '2026-09-11', 8, '2026-09-08 00:00:00'),
  (31, 2, 4, '2026-09-11', 6, '2026-09-08 00:00:00'),
  (32, 2, 5, '2026-09-11', 14, '2026-09-08 00:00:00'),
  (33, 3, 6, '2026-09-11', 3, '2026-09-08 00:00:00'),
  (34, 3, 7, '2026-09-11', 10, '2026-09-08 00:00:00'),
  (35, 4, 8, '2026-09-11', 16, '2026-09-08 00:00:00'),
  (36, 4, 9, '2026-09-11', 11, '2026-09-08 00:00:00'),
  (37, 1, 1, '2026-09-12', 12, '2026-09-08 00:00:00'),
  (38, 1, 2, '2026-09-12', 4, '2026-09-08 00:00:00'),
  (39, 1, 3, '2026-09-12', 8, '2026-09-08 00:00:00'),
  (40, 2, 4, '2026-09-12', 6, '2026-09-08 00:00:00'),
  (41, 2, 5, '2026-09-12', 14, '2026-09-08 00:00:00'),
  (42, 3, 6, '2026-09-12', 3, '2026-09-08 00:00:00'),
  (43, 3, 7, '2026-09-12', 10, '2026-09-08 00:00:00'),
  (44, 4, 8, '2026-09-12', 16, '2026-09-08 00:00:00'),
  (45, 4, 9, '2026-09-12', 11, '2026-09-08 00:00:00'),
  (46, 1, 1, '2026-09-13', 12, '2026-09-08 00:00:00'),
  (47, 1, 2, '2026-09-13', 4, '2026-09-08 00:00:00'),
  (48, 1, 3, '2026-09-13', 8, '2026-09-08 00:00:00'),
  (49, 2, 4, '2026-09-13', 6, '2026-09-08 00:00:00'),
  (50, 2, 5, '2026-09-13', 14, '2026-09-08 00:00:00'),
  (51, 3, 6, '2026-09-13', 3, '2026-09-08 00:00:00'),
  (52, 3, 7, '2026-09-13', 10, '2026-09-08 00:00:00'),
  (53, 4, 8, '2026-09-13', 16, '2026-09-08 00:00:00'),
  (54, 4, 9, '2026-09-13', 11, '2026-09-08 00:00:00'),
  (55, 1, 1, '2026-09-14', 12, '2026-09-08 00:00:00'),
  (56, 1, 2, '2026-09-14', 4, '2026-09-08 00:00:00'),
  (57, 1, 3, '2026-09-14', 8, '2026-09-08 00:00:00'),
  (58, 2, 4, '2026-09-14', 6, '2026-09-08 00:00:00'),
  (59, 2, 5, '2026-09-14', 14, '2026-09-08 00:00:00'),
  (60, 3, 6, '2026-09-14', 3, '2026-09-08 00:00:00'),
  (61, 3, 7, '2026-09-14', 10, '2026-09-08 00:00:00'),
  (62, 4, 8, '2026-09-14', 16, '2026-09-08 00:00:00'),
  (63, 4, 9, '2026-09-14', 11, '2026-09-08 00:00:00');


-- ===== m2 食：订单扩展 =====
INSERT INTO `wudong_m2_order_ext` (`id`, `order_id`, `restaurant_id`, `slot_id`, `dining_date`, `dining_time`, `guests`, `contact_name`, `contact_phone`, `created_at`) VALUES
  (1, 4, 1, 2, '2026-09-10', '晚餐 17:30 - 19:30', 4, '刘一', '13800001234', '2026-09-06 20:15:00');


-- ===== m3 住：民宿 / 房型 / 房态日历 =====
INSERT INTO `wudong_m3_homestay` (`id`, `merchant_id`, `name`, `cover`, `images`, `rating`, `score`, `tags`, `facilities`, `address`, `intro`, `notice`, `status`, `created_at`) VALUES
  (1, 10, '枕云山舍', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20stilt%20house%20guesthouse%20on%20hillside%20with%20sea%20of%20clouds%20view%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20stilt%20house%20guesthouse%20on%20hillside%20with%20sea%20of%20clouds%20view%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20wooden%20guesthouse%20room%20with%20indigo%20textiles%20warm%20lamp&image_size=landscape_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guesthouse%20balcony%20overlooking%20mountain%20valley%20morning&image_size=landscape_4_3"]', 4.9, '{"hygiene":4.9,"location":4.8,"service":4.9}', '["吊脚楼","观云海","含早"]', '["WiFi","空调","独立卫浴","观景露台","苗族特色早餐","停车场"]', '乌东村东头半山（观景台旁 50m）', '老木楼改造的八间客房，每间都朝向梯田。清晨云海漫过窗棂，管家阿姐会端来热腾腾的糯米饭和酸汤粉。', '入住 14:00 后 · 离店 12:00 前 · 不接待宠物 · 押金 100 元', 'ENABLED', '2026-08-01 10:00:00'),
  (2, 11, '银匠世家客栈', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20courtyard%20inn%20with%20silver%20craft%20decorations%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20courtyard%20inn%20with%20silver%20craft%20decorations%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9"]', 4.8, '{"hygiene":4.8,"location":4.9,"service":4.7}', '["银匠主题","步行街心"]', '["WiFi","空调","独立卫浴","银饰体验","茶室"]', '乌东村银匠巷 6 号', '老银匠家的宅子改的客栈，堂屋陈列着三代人的银器。住客可预约楼下的打银体验，走时带一枚自己敲的银片书签。', '入住 14:00 后 · 离店 12:00 前 · 含茶艺体验', 'ENABLED', '2026-08-01 10:00:00'),
  (3, 12, '稻田畔的院子', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural%20courtyard%20homestay%20next%20to%20green%20rice%20field%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural%20courtyard%20homestay%20next%20to%20green%20rice%20field%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9"]', 4.7, '{"hygiene":4.7,"location":4.6,"service":4.8}', '["亲子友好","火塘夜话"]', '["WiFi","空调","独立卫浴","儿童托管","火塘"]', '乌东村西梯田旁', '院子外就是稻田，夏夜能听到蛙声一片。主人是返乡青年，每晚在火塘边讲苗寨古歌，孩子听得不肯睡。', '入住 15:00 后 · 离店 11:30 前 · 可加购晚餐', 'ENABLED', '2026-08-01 10:00:00'),
  (4, 13, '雾里 · 悬廊民宿', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20wooden%20architecture%20cantilever%20terrace%20forest%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20wooden%20architecture%20cantilever%20terrace%20forest%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9"]', 4.9, '{"hygiene":5,"location":4.7,"service":4.9}', '["设计感","悬空茶廊"," spa"]', '["WiFi","空调","独立卫浴","落地窗","茶廊","spa"]', '乌东村北 · 松林垭口', '请了黔东南本土设计团队，把一条悬空茶廊架在松林之上。适合想要安静和仪式感的旅人，也适合什么都不做。', '入住 15:00 后 · 离店 12:00 前 · 成人优先 · 全屋禁烟', 'ENABLED', '2026-08-01 10:00:00');


INSERT INTO `wudong_m3_room_type` (`id`, `homestay_id`, `name`, `bed`, `area`, `max_guests`, `price`, `stock`, `cover`, `facilities`, `created_at`) VALUES
  (1, 1, '苗族木屋大床房', '1.8m 大床', 26, 2, 488, 3, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20wooden%20bedroom%20indigo%20fabric%20headboard&image_size=landscape_4_3', '["WiFi","空调","独立卫浴","观景窗"]', '2026-08-01 10:00:00'),
  (2, 1, '云海亲子房', '1.5m + 1.2m 双床', 32, 3, 628, 2, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family%20room%20wooden%20house%20two%20beds%20warm&image_size=landscape_4_3', '["WiFi","空调","独立卫浴","露台"]', '2026-08-01 10:00:00'),
  (3, 2, '花丝主题大床房', '1.8m 大床', 24, 2, 428, 4, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20chinese%20style%20bedroom%20silver%20details&image_size=landscape_4_3', '["WiFi","空调","独立卫浴"]', '2026-08-01 10:00:00'),
  (4, 2, '梯田景观双床房', '1.2m 双床', 28, 2, 468, 3, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=twin%20bedroom%20wooden%20interior%20valley%20view&image_size=landscape_4_3', '["WiFi","空调","独立卫浴","观景窗"]', '2026-08-01 10:00:00'),
  (5, 3, '稻香家庭套房', '1.8m + 1.2m', 38, 4, 728, 2, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family%20suite%20bedroom%20wooden%20cozy&image_size=landscape_4_3', '["WiFi","空调","独立卫浴","小客厅"]', '2026-08-01 10:00:00'),
  (6, 3, '蛙声标间', '1.35m 双床', 22, 2, 368, 5, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple%20clean%20twin%20bedroom%20bright&image_size=landscape_4_3', '["WiFi","空调","独立卫浴"]', '2026-08-01 10:00:00'),
  (7, 4, '松雾全景大床房', '2m 大床', 35, 2, 888, 2, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=panoramic%20window%20bedroom%20forest%20view%20minimalist&image_size=landscape_4_3', '["WiFi","空调","独立卫浴","落地窗","浴缸"]', '2026-08-01 10:00:00');


INSERT INTO `wudong_m3_room_calendar` (`id`, `room_type_id`, `date`, `stock`, `price_delta`, `closed`, `created_at`) VALUES
  (1, 1, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (2, 1, '2026-09-09', 3, 0, 0, '2026-09-08 00:00:00'),
  (3, 1, '2026-09-10', 3, 0, 0, '2026-09-08 00:00:00'),
  (4, 1, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (5, 1, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (6, 1, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (7, 1, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (8, 1, '2026-09-15', 3, 0, 0, '2026-09-08 00:00:00'),
  (9, 1, '2026-09-16', 3, 0, 0, '2026-09-08 00:00:00'),
  (10, 1, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (11, 1, '2026-09-18', 3, 0, 0, '2026-09-08 00:00:00'),
  (12, 1, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (13, 1, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (14, 1, '2026-09-21', 3, 0, 0, '2026-09-08 00:00:00'),
  (15, 1, '2026-09-22', 3, 0, 0, '2026-09-08 00:00:00'),
  (16, 1, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (17, 1, '2026-09-24', 3, 0, 0, '2026-09-08 00:00:00'),
  (18, 1, '2026-09-25', 3, 0, 0, '2026-09-08 00:00:00'),
  (19, 1, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (20, 1, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (21, 1, '2026-09-28', 3, 0, 0, '2026-09-08 00:00:00'),
  (22, 1, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (23, 1, '2026-09-30', 3, 0, 0, '2026-09-08 00:00:00'),
  (24, 1, '2026-10-01', 3, 0, 0, '2026-09-08 00:00:00'),
  (25, 1, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (26, 1, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (27, 1, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (28, 1, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (29, 1, '2026-10-06', 3, 0, 0, '2026-09-08 00:00:00'),
  (30, 1, '2026-10-07', 3, 0, 0, '2026-09-08 00:00:00'),
  (31, 2, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (32, 2, '2026-09-09', 2, 0, 0, '2026-09-08 00:00:00'),
  (33, 2, '2026-09-10', 2, 0, 0, '2026-09-08 00:00:00'),
  (34, 2, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (35, 2, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (36, 2, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (37, 2, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (38, 2, '2026-09-15', 2, 0, 0, '2026-09-08 00:00:00'),
  (39, 2, '2026-09-16', 2, 0, 0, '2026-09-08 00:00:00'),
  (40, 2, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (41, 2, '2026-09-18', 2, 0, 0, '2026-09-08 00:00:00'),
  (42, 2, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (43, 2, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (44, 2, '2026-09-21', 2, 0, 0, '2026-09-08 00:00:00'),
  (45, 2, '2026-09-22', 2, 0, 0, '2026-09-08 00:00:00'),
  (46, 2, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (47, 2, '2026-09-24', 2, 0, 0, '2026-09-08 00:00:00'),
  (48, 2, '2026-09-25', 2, 0, 0, '2026-09-08 00:00:00'),
  (49, 2, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (50, 2, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (51, 2, '2026-09-28', 2, 0, 0, '2026-09-08 00:00:00'),
  (52, 2, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (53, 2, '2026-09-30', 2, 0, 0, '2026-09-08 00:00:00'),
  (54, 2, '2026-10-01', 2, 0, 0, '2026-09-08 00:00:00'),
  (55, 2, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (56, 2, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (57, 2, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (58, 2, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (59, 2, '2026-10-06', 2, 0, 0, '2026-09-08 00:00:00'),
  (60, 2, '2026-10-07', 2, 0, 0, '2026-09-08 00:00:00'),
  (61, 3, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (62, 3, '2026-09-09', 3, 0, 0, '2026-09-08 00:00:00'),
  (63, 3, '2026-09-10', 4, 0, 0, '2026-09-08 00:00:00'),
  (64, 3, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (65, 3, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (66, 3, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (67, 3, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (68, 3, '2026-09-15', 3, 0, 0, '2026-09-08 00:00:00'),
  (69, 3, '2026-09-16', 4, 0, 0, '2026-09-08 00:00:00'),
  (70, 3, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (71, 3, '2026-09-18', 3, 0, 0, '2026-09-08 00:00:00'),
  (72, 3, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (73, 3, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (74, 3, '2026-09-21', 3, 0, 0, '2026-09-08 00:00:00'),
  (75, 3, '2026-09-22', 4, 0, 0, '2026-09-08 00:00:00'),
  (76, 3, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (77, 3, '2026-09-24', 3, 0, 0, '2026-09-08 00:00:00'),
  (78, 3, '2026-09-25', 4, 0, 0, '2026-09-08 00:00:00'),
  (79, 3, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (80, 3, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (81, 3, '2026-09-28', 4, 0, 0, '2026-09-08 00:00:00'),
  (82, 3, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (83, 3, '2026-09-30', 3, 0, 0, '2026-09-08 00:00:00'),
  (84, 3, '2026-10-01', 4, 0, 0, '2026-09-08 00:00:00'),
  (85, 3, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (86, 3, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (87, 3, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (88, 3, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (89, 3, '2026-10-06', 3, 0, 0, '2026-09-08 00:00:00'),
  (90, 3, '2026-10-07', 4, 0, 0, '2026-09-08 00:00:00'),
  (91, 4, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (92, 4, '2026-09-09', 3, 0, 0, '2026-09-08 00:00:00'),
  (93, 4, '2026-09-10', 3, 0, 0, '2026-09-08 00:00:00'),
  (94, 4, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (95, 4, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (96, 4, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (97, 4, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (98, 4, '2026-09-15', 3, 0, 0, '2026-09-08 00:00:00'),
  (99, 4, '2026-09-16', 3, 0, 0, '2026-09-08 00:00:00'),
  (100, 4, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (101, 4, '2026-09-18', 3, 0, 0, '2026-09-08 00:00:00'),
  (102, 4, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (103, 4, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (104, 4, '2026-09-21', 3, 0, 0, '2026-09-08 00:00:00'),
  (105, 4, '2026-09-22', 3, 0, 0, '2026-09-08 00:00:00'),
  (106, 4, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (107, 4, '2026-09-24', 3, 0, 0, '2026-09-08 00:00:00'),
  (108, 4, '2026-09-25', 3, 0, 0, '2026-09-08 00:00:00'),
  (109, 4, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (110, 4, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (111, 4, '2026-09-28', 3, 0, 0, '2026-09-08 00:00:00'),
  (112, 4, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (113, 4, '2026-09-30', 3, 0, 0, '2026-09-08 00:00:00'),
  (114, 4, '2026-10-01', 3, 0, 0, '2026-09-08 00:00:00'),
  (115, 4, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (116, 4, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (117, 4, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (118, 4, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (119, 4, '2026-10-06', 3, 0, 0, '2026-09-08 00:00:00'),
  (120, 4, '2026-10-07', 3, 0, 0, '2026-09-08 00:00:00'),
  (121, 5, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (122, 5, '2026-09-09', 2, 0, 0, '2026-09-08 00:00:00'),
  (123, 5, '2026-09-10', 2, 0, 0, '2026-09-08 00:00:00'),
  (124, 5, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (125, 5, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (126, 5, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (127, 5, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (128, 5, '2026-09-15', 2, 0, 0, '2026-09-08 00:00:00'),
  (129, 5, '2026-09-16', 2, 0, 0, '2026-09-08 00:00:00'),
  (130, 5, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (131, 5, '2026-09-18', 2, 0, 0, '2026-09-08 00:00:00'),
  (132, 5, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (133, 5, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (134, 5, '2026-09-21', 2, 0, 0, '2026-09-08 00:00:00'),
  (135, 5, '2026-09-22', 2, 0, 0, '2026-09-08 00:00:00'),
  (136, 5, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (137, 5, '2026-09-24', 2, 0, 0, '2026-09-08 00:00:00'),
  (138, 5, '2026-09-25', 2, 0, 0, '2026-09-08 00:00:00'),
  (139, 5, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (140, 5, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (141, 5, '2026-09-28', 2, 0, 0, '2026-09-08 00:00:00'),
  (142, 5, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (143, 5, '2026-09-30', 2, 0, 0, '2026-09-08 00:00:00'),
  (144, 5, '2026-10-01', 2, 0, 0, '2026-09-08 00:00:00'),
  (145, 5, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (146, 5, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (147, 5, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (148, 5, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (149, 5, '2026-10-06', 2, 0, 0, '2026-09-08 00:00:00'),
  (150, 5, '2026-10-07', 2, 0, 0, '2026-09-08 00:00:00'),
  (151, 6, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (152, 6, '2026-09-09', 3, 0, 0, '2026-09-08 00:00:00'),
  (153, 6, '2026-09-10', 4, 0, 0, '2026-09-08 00:00:00'),
  (154, 6, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (155, 6, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (156, 6, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (157, 6, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (158, 6, '2026-09-15', 3, 0, 0, '2026-09-08 00:00:00'),
  (159, 6, '2026-09-16', 4, 0, 0, '2026-09-08 00:00:00'),
  (160, 6, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (161, 6, '2026-09-18', 3, 0, 0, '2026-09-08 00:00:00'),
  (162, 6, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (163, 6, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (164, 6, '2026-09-21', 3, 0, 0, '2026-09-08 00:00:00'),
  (165, 6, '2026-09-22', 4, 0, 0, '2026-09-08 00:00:00'),
  (166, 6, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (167, 6, '2026-09-24', 3, 0, 0, '2026-09-08 00:00:00'),
  (168, 6, '2026-09-25', 4, 0, 0, '2026-09-08 00:00:00'),
  (169, 6, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (170, 6, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (171, 6, '2026-09-28', 4, 0, 0, '2026-09-08 00:00:00'),
  (172, 6, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (173, 6, '2026-09-30', 3, 0, 0, '2026-09-08 00:00:00'),
  (174, 6, '2026-10-01', 4, 0, 0, '2026-09-08 00:00:00'),
  (175, 6, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (176, 6, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (177, 6, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (178, 6, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (179, 6, '2026-10-06', 3, 0, 0, '2026-09-08 00:00:00'),
  (180, 6, '2026-10-07', 4, 0, 0, '2026-09-08 00:00:00'),
  (181, 7, '2026-09-08', 2, 0, 0, '2026-09-08 00:00:00'),
  (182, 7, '2026-09-09', 2, 0, 0, '2026-09-08 00:00:00'),
  (183, 7, '2026-09-10', 2, 0, 0, '2026-09-08 00:00:00'),
  (184, 7, '2026-09-11', 2, 0, 0, '2026-09-08 00:00:00'),
  (185, 7, '2026-09-12', 1, 60, 0, '2026-09-08 00:00:00'),
  (186, 7, '2026-09-13', 1, 60, 0, '2026-09-08 00:00:00'),
  (187, 7, '2026-09-14', 2, 0, 0, '2026-09-08 00:00:00'),
  (188, 7, '2026-09-15', 2, 0, 0, '2026-09-08 00:00:00'),
  (189, 7, '2026-09-16', 2, 0, 0, '2026-09-08 00:00:00'),
  (190, 7, '2026-09-17', 2, 0, 0, '2026-09-08 00:00:00'),
  (191, 7, '2026-09-18', 2, 0, 0, '2026-09-08 00:00:00'),
  (192, 7, '2026-09-19', 1, 60, 0, '2026-09-08 00:00:00'),
  (193, 7, '2026-09-20', 1, 60, 0, '2026-09-08 00:00:00'),
  (194, 7, '2026-09-21', 2, 0, 0, '2026-09-08 00:00:00'),
  (195, 7, '2026-09-22', 2, 0, 0, '2026-09-08 00:00:00'),
  (196, 7, '2026-09-23', 2, 0, 0, '2026-09-08 00:00:00'),
  (197, 7, '2026-09-24', 2, 0, 0, '2026-09-08 00:00:00'),
  (198, 7, '2026-09-25', 2, 0, 0, '2026-09-08 00:00:00'),
  (199, 7, '2026-09-26', 1, 60, 0, '2026-09-08 00:00:00'),
  (200, 7, '2026-09-27', 1, 60, 0, '2026-09-08 00:00:00'),
  (201, 7, '2026-09-28', 2, 0, 0, '2026-09-08 00:00:00'),
  (202, 7, '2026-09-29', 2, 0, 0, '2026-09-08 00:00:00'),
  (203, 7, '2026-09-30', 2, 0, 0, '2026-09-08 00:00:00'),
  (204, 7, '2026-10-01', 2, 0, 0, '2026-09-08 00:00:00'),
  (205, 7, '2026-10-02', 2, 0, 0, '2026-09-08 00:00:00'),
  (206, 7, '2026-10-03', 1, 60, 0, '2026-09-08 00:00:00'),
  (207, 7, '2026-10-04', 1, 60, 0, '2026-09-08 00:00:00'),
  (208, 7, '2026-10-05', 2, 0, 0, '2026-09-08 00:00:00'),
  (209, 7, '2026-10-06', 2, 0, 0, '2026-09-08 00:00:00'),
  (210, 7, '2026-10-07', 2, 0, 0, '2026-09-08 00:00:00');


-- ===== m3 住：订单扩展 =====
INSERT INTO `wudong_m3_order_ext` (`id`, `order_id`, `homestay_id`, `room_type_id`, `check_in_date`, `check_out_date`, `nights`, `guests`, `contact_name`, `contact_phone`, `created_at`) VALUES
  (1, 1, 1, 1, '2026-09-29', '2026-09-30', 2, 2, '刘一', '13800001234', '2026-09-01 09:20:00');


-- ===== m4 行：景点 / 门票 / 路线 / 行程 =====
INSERT INTO `wudong_m4_scenic` (`id`, `name`, `cover`, `open_time`, `address`, `intro`, `rating`, `status`, `created_at`) VALUES
  (1, '乌东苗寨景区', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Miao%20village%20panorama%20wooden%20houses%20terraces%20valley%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '08:30 - 18:00', '雷山县乌东村', '中国传统村落、苗族银饰之乡。芦笙场、鼓藏头家、梯田步道与百年银匠铺散落寨中，慢下来才看得见。', 4.8, 'ENABLED', '2026-08-01 10:00:00'),
  (2, '雷公山国家森林公园', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20forest%20park%20misty%20peaks%20boardwalk%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', '08:00 - 17:30', '雷山县境 · 距乌东 12km', '苗岭主峰，海拔 2178m。原始秃杉林与云海佛光，避暑季平均气温 22℃。', 4.7, 'ENABLED', '2026-08-01 10:00:00');


INSERT INTO `wudong_m4_ticket` (`id`, `scenic_id`, `name`, `price`, `stock`, `note`, `created_at`) VALUES
  (1, 1, '成人票', 60, 200, '含芦笙场迎宾仪式', '2026-08-01 10:00:00'),
  (2, 1, '学生/儿童票', 30, 100, '凭学生证，1.2m 以下免票', '2026-08-01 10:00:00'),
  (3, 1, '家庭套票（2大1小）', 138, 50, '含非遗工坊体验券 1 张', '2026-08-01 10:00:00'),
  (4, 2, '成人票（含观光车）', 90, 300, '观光车通票', '2026-08-01 10:00:00'),
  (5, 2, '成人票', 70, 300, '不含观光车', '2026-08-01 10:00:00');


INSERT INTO `wudong_m4_route` (`id`, `merchant_id`, `title`, `cover`, `days`, `theme`, `price`, `sales`, `rating`, `departure`, `includes`, `notice`, `status`, `created_at`) VALUES
  (1, 14, '苗寨漫游记 · 一日精华', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=day%20tour%20village%20walking%20path%20silversmith%20workshop%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', 1, '文化体验', 298, 412, 4.8, '凯里南站集合', '["景区门票","长桌宴午餐","银饰体验课","讲解服务","旅游保险"]', '["最少提前 1 天预订","6 人成团，未成团全额退","穿着建议舒适的步行鞋"]', 'ON_SHELF', '2026-08-01 10:00:00'),
  (2, 14, '苗岭深处 · 两日深度', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=two%20day%20hiking%20trail%20mountain%20village%20sunrise%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', 2, '户外徒步', 798, 268, 4.9, '贵阳/凯里均可集合', '["门票","一晚民宿","三正一早","徒步向导","保险"]', '["最少提前 1 天预订","徒步约 8km/天","雷雨天气调整为寨内动线"]', 'ON_SHELF', '2026-08-01 10:00:00'),
  (3, 14, '小摄影师的苗寨 · 亲子研学', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20photography%20workshop%20village%20kids%20playing%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', 2, '亲子研学', 1280, 156, 4.9, '凯里南站集合', '["门票","一晚亲子房","全程跟拍","摄影课","非遗手作材料","保险"]', '["适合 5-12 岁儿童家庭","每期限 6 组家庭"]', 'ON_SHELF', '2026-08-01 10:00:00'),
  (4, 14, '苗年节庆 · 三日狂欢', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=festival%20celebration%20lusheng%20dance%20colorful%20costumes%20night%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=landscape_16_9', 3, '节庆限定', 1880, 89, 5.0, '凯里南站集合', '["门票","两晚民宿","节庆观礼席","长桌宴 ×2","盛装体验半日","保险"]', '["仅苗年期间（11 月中旬）开班","名额紧张，建议提前 2 周预订"]', 'ON_SHELF', '2026-08-01 10:00:00');


INSERT INTO `wudong_m4_route_day` (`id`, `route_id`, `day`, `title`, `description`, `meals`, `stay`) VALUES
  (1, 1, 1, '入寨仪式 → 匠人工坊 → 火塘告别', '上午 · 入寨仪式：芦笙场迎宾 → 鼓藏头家做客 → 梯田步道\n下午 · 匠人工坊：银饰锻造体验（可带走作品）→ 蓝染坊参观\n傍晚 · 火塘告别：观景台日落 → 火塘油茶话别', '长桌宴午餐', '—'),
  (2, 2, 1, '雷公山小环线', '秃杉林 → 观佛台 → 山脊草甸，全程 8km', '午/晚', '枕云山舍或同级'),
  (3, 2, 2, '乌东慢寨', '云海晨观 → 蓝染体验 → 长桌宴后返程', '早/午', '—'),
  (4, 3, 1, '发现苗寨的色彩', '取景构图课 → 银匠巷扫街 → 晒谷场黄昏', '午/晚', '稻田畔的院子'),
  (5, 3, 2, '给妈妈拍张照', '晨雾梯田 → 蓝染手作 → 作品打印装框', '早/午', '—'),
  (6, 4, 1, '迎苗年', '入寨仪式 → 盛装巡游 → 长桌宴', '午/晚', '寨内民宿'),
  (7, 4, 2, '芦笙盛会', '芦笙场大赛 → 斗牛观礼 → 篝火夜歌', '早/午/晚', '寨内民宿'),
  (8, 4, 3, '古歌与告别', '鼓藏节俗体验 → 非遗市集 → 返程', '早/午', '—');


-- ===== m4 行：订单扩展 =====
INSERT INTO `wudong_m4_order_ext` (`id`, `order_id`, `scenic_id`, `ticket_id`, `route_id`, `travel_date`, `guests`, `contact_name`, `contact_phone`, `created_at`) VALUES
  (1, 2, NULL, NULL, 1, '2026-10-02', 3, '刘一', '13800001234', '2026-09-02 14:05:00'),
  (2, 5, 1, 3, NULL, '2026-08-18', 3, '刘一', '13800001234', '2026-08-18 09:00:00');


-- ===== m5 社区：帖子 / 评论 =====
INSERT INTO `wudong_m5_post` (`id`, `user_id`, `title`, `content`, `images`, `topic`, `place`, `likes`, `collects`, `views`, `status`, `published_at`, `created_at`) VALUES
  (1, 2, '凌晨五点，云海漫进了我的窗', '管家阿姐五点轻轻敲了三下门，我裹着毯子爬上露台，山谷里的云正一寸寸往上漫。太阳出来的那十分钟，全寨子的人都在屋顶上安静地看着。这一刻突然懂了为什么苗家人把家安在云里。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sea%20of%20clouds%20over%20mountain%20village%20at%20dawn%20golden%20light%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guesthouse%20balcony%20morning%20view%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cup%20of%20hot%20tea%20on%20wooden%20railing%20mountain%20view&image_size=portrait_4_3"]', '#云海时刻', '枕云山舍', 1286, 342, 8921, 'PASSED', '2026-08-28 10:00:00', '2026-07-01 10:00:00'),
  (2, 4, '在银匠巷学了一晚上掐丝', '老爷子手把手教我拉丝，银条在他手里像面条一样听话，在我手里就是一根倔驴。两个小时只做出一枚歪歪扭扭的银片书签，老爷子却认真给我签了字：「第七个学徒。」值了。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silversmith%20teaching%20young%20man%20crafting%20silver%2C%20warm%20workshop&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20wire%20crafting%20tools%20on%20workbench&image_size=portrait_4_3"]', '#非遗体验', '银匠世家客栈', 866, 210, 5320, 'PASSED', '2026-08-21 10:00:00', '2026-07-01 10:00:00'),
  (3, 3, '长桌宴生存指南：先别吃鱼', '划重点：开席前会有敬酒歌，牛角杯递过来时手千万别碰杯（碰了就要喝完）！酸汤鱼要等汤滚三滚再下筷子，第一口先喝汤。糯米饭用手捏，蘸干辣椒面更香。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=long%20table%20banquet%20toast%20celebration%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sour%20soup%20fish%20boiling%20pot&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice%20wine%20toast%20with%20horn%20cup&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glutinous%20rice%20with%20colorful%20toppings&image_size=portrait_4_3"]', '#美食攻略', '云雾长桌宴', 2311, 1890, 15230, 'PASSED', '2026-08-15 10:00:00', '2026-07-01 10:00:00'),
  (4, 5, '梯田日落，把整面墙都染成了金色', '从稻田人家露台看下去，稻浪一层推着一层往山脚下跑。老板说再过半个月就开镰了，米香会飘满整个寨子。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rice%20terraces%20golden%20sunset%20light%20layers%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3"]', '#梯田日落', '梯田人家', 977, 156, 6102, 'PASSED', '2026-08-10 10:00:00', '2026-07-01 10:00:00'),
  (5, 6, '孩子亲手打的银戒指，他说是全世界最贵的', '亲子银饰课两个小时，儿子从熔银开始全程自己上手（当然老师傅全程护着）。戒指刻歪了一个字，他非要戴着不摘，说「这是我打出来的，是全世界最贵的戒指」。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=father%20and%20son%20crafting%20silver%20ring%20workshop&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=child%20hands%20holding%20silver%20ring%20proud&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village%20street%20wooden%20houses%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3"]', '#亲子出行', '非遗工坊', 1532, 678, 9880, 'PASSED', '2026-08-05 10:00:00', '2026-07-01 10:00:00'),
  (6, 5, '蓝染手记：一块布的七次深呼吸', '布在靛缸里进出七次，从黄绿到黛蓝。阿榜姐说布要「醒」，染完要在风里晾足时辰。冰裂纹出现的瞬间全屋的人都「哇」了一声——像看见时间在布上裂开一朵花。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indigo%20dye%20vat%20hands%20dipping%20fabric&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=batik%20fabric%20drying%20on%20bamboo%20pole%20wind&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=crackle%20pattern%20indigo%20cloth%20macro&image_size=portrait_4_3"]', '#非遗体验', '蓝染坊', 1244, 533, 7751, 'PASSED', '2026-07-30 10:00:00', '2026-07-01 10:00:00'),
  (7, 4, '火塘夜话：阿婆讲了三个小时的古歌', '火塘上烤着糍粑，阿婆的苗语古歌混着米酒气。歌词听不懂，但旋律像从很深的地方升上来。临走她塞给我两个烤糍粑：「路上吃。」', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indoor%20fire%20pit%20night%20storytelling%20warm%20glow%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3"]', '#火塘夜话', '阿婆火塘', 845, 190, 4321, 'PASSED', '2026-07-22 10:00:00', '2026-07-01 10:00:00'),
  (8, 2, '徒步雷公山：8 公里掉进云里三次', '秃杉林像巨大的绿色教堂，山脊上风把云吹成一匹一匹的白布。向导老杨认得每一种鸟叫，他说雷公山有 1700 多种种子植物，「你们脚底下踩的都是药材书」。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hiking%20trail%20through%20ancient%20forest%20mist%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20ridge%20grassland%20clouds%20hikers%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=waterfall%20in%20green%20mountains&image_size=portrait_4_3"]', '#户外徒步', '雷公山', 1089, 655, 8120, 'PASSED', '2026-07-15 10:00:00', '2026-07-01 10:00:00'),
  (9, 3, '一个人的乌东，被全寨子投喂的四天', '本想找个地方安静写稿，结果隔壁阿婆天天喊我吃饭，银匠杨叔请我去他家喝油茶，客栈管家临走给我装了一袋子自家晒的笋干。乌东的答案是：一个人来，绝不让你一个人走。', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village%20lane%20wooden%20houses%20sunlight%20shadow%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grandmother%20cooking%20in%20traditional%20kitchen&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dried%20bamboo%20shoots%20in%20basket%20gift&image_size=portrait_4_3","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=village%20night%20starry%20sky%20wooden%20house%2C%20Wudong%20Miao%20village%20in%20Guizhou%20China%2C%20wooden%20stilt%20houses%2C%20indigo%20dyed%20textiles%2C%20documentary%20travel%20photography%2C%20natural%20light&image_size=portrait_4_3"]', '#独行日记', '乌东村', 3120, 2890, 24150, 'PASSED', '2026-07-08 10:00:00', '2026-07-01 10:00:00');


INSERT INTO `wudong_m5_comment` (`id`, `post_id`, `user_id`, `parent_id`, `reply_to_user_id`, `content`, `status`, `published_at`) VALUES
  (1, 1, 5, NULL, NULL, '这张构图绝了，求机位！', 'PASSED', '2026-08-28 12:00:00'),
  (2, 1, 2, 1, 5, '枕云山舍三楼露台，记得带广角～', 'PASSED', '2026-08-28 12:30:00'),
  (3, 1, 11, NULL, NULL, '已经订了下个月的房间！', 'PASSED', '2026-08-29 09:00:00'),
  (4, 2, 13, NULL, NULL, '书签上的锤纹好好看', 'PASSED', '2026-08-22 09:00:00'),
  (5, 3, 12, NULL, NULL, '牛角杯不碰杯这个真的救大命了，谢谢！', 'PASSED', '2026-08-15 13:00:00'),
  (6, 3, 16, NULL, NULL, '收藏了，下周就去实践', 'PASSED', '2026-08-16 10:00:00'),
  (7, 5, 3, NULL, NULL, '已经开始规划带娃二刷了', 'PASSED', '2026-08-06 10:00:00'),
  (8, 9, 4, NULL, NULL, '「绝不让你一个人走」，破防了', 'PASSED', '2026-07-09 10:00:00');


SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- 来源文件：wudong_seed_story.sql
-- =====================================================================


-- =====================================================================
-- 文化推文模拟数据（wudong_common_story）
-- 来源：app/wu_dong_vue/src/mock/culture.ts 的 16 条 CultureStory
-- cover 已解析为前端 image-map.ts 命中的本地路径（public/images 下），
-- 接口替换 mock 后 <img :src> 可直接使用。
-- 可重复执行：先按 slug 清理再插入。
-- =====================================================================

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

-- ---------------------------------------------------------------------
-- 推文正文扩写：每篇正文补充背景、体验与实用细节，整体约 500 字。
-- 使用 JSON_SET 追加至第三段，保持原有段落结构与前端接口兼容。
-- ---------------------------------------------------------------------
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 到炉边看银之前，师傅会先让客人洗手、戴上护目镜，并讲清炭火温度和锤子的落点。真正动手时，锤面不能只落在一个位置，要随着银片的厚薄不断换角度；声音清脆，说明火候正好，声音发闷就要重新退火。学徒最先练的是把废银敲成均匀的薄片，反复几百次才能开始拉丝。每件作品都会留下轻微不同的锤痕，正是这些差异让它有了人的温度。买回家后若出现氧化，只需用软布顺着纹理擦拭，不要用力刮掉表面的细纹。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'yi-silver-hammer';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 染坊里最忙的是换缸和晾晒的日子，院墙上挂满不同深浅的布，远看像一面会呼吸的蓝色风景。阿榜姐会把每块布的下缸次数、日期和天气写在竹牌上，方便判断颜色是否稳定。阴天时氧化速度慢，她会延长晾晒时间；太阳太烈，又要先收进廊下，避免颜色被晒花。体验者可以从小方巾开始，先用蜡刀画简单线条，再亲手完成一次浸染。回家清洗时用冷水和中性洗剂，前几次单独洗涤，颜色会在岁月里由亮蓝慢慢沉成柔和的黛色。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'yi-batik-seven';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 绣娘通常在清晨做家务后开始落针，午后光线最好的时候绣复杂的眼睛和鳞片，晚上则整理线团、检查背面走线。她们不用尺子，却能让两边的翅膀保持近乎对称，靠的是多年形成的手感和记忆。不同支系的苗绣在配色上各有偏好：有的爱用朱红和明黄，有的偏爱靛蓝与银白，纹样还会记录婚嫁、迁徙和祝福。参观时可以请绣娘讲一讲图案的来处，也可以试着完成一小段锁边。针脚不必完美，重要的是理解一块布如何承载一个家庭的故事。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'yi-embroidery-mother';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 工坊里的课程不追求把游客变成工匠，而是让人理解一件东西为何值得等待。银片书签会刻上当天的日期，蜡染方巾则可以选择自己喜欢的铜鼓、鸟和水波纹。老师傅会把失败的样品留下，告诉你边缘开裂、焊点发黑分别是什么原因。年轻设计师参与后，传统纹样有了更多轻便的载体，但他们仍会先征得绣娘和银匠同意，确认图案没有被误读。带走作品时，工坊会附上作者姓名、工序说明和保养方法。多年以后再看到它，你仍能想起那天炉火的温度与手上沾到的靛蓝。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'yi-craft-today';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 长桌宴的准备从清晨就开始，掌勺人先去溪边挑水，再根据到客人数调整锅灶。鱼要现杀现煮，腊肉切得薄厚适中，糯米饭则分成几种颜色，摆在桌上像一条彩带。敬酒歌并不是表演环节，歌词里有祝福远道而来的客人、感谢山水和提醒大家彼此照应的意思。不会喝酒也可以提前告诉主人，用茶水或米汤代替，重要的是回应歌声。吃到一半若想添菜，只要把空碗放在桌边，邻座的人自然会帮你传过去。散席后别急着离开，和主人道谢、说一句吃得很开心，是乌东人最看重的礼数。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'shi-long-table';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 毛辣果入坛前要挑掉碰伤的果子，否则整坛汤会变浑。老人凭气味判断发酵进度，打开坛盖时先闻到清亮的果酸，再是谷物和香草的回甘。每家酸汤都有自己的老坛引子，坛壁上留下多年的菌群，因此同样的配方在不同人家会呈现不同风味。煮鱼时先把酸汤烧透，再放入姜、木姜子和新鲜辣椒，鱼肉才不会有腥味。第一次来可以从清淡版本开始，喜欢酸辣再请老板加料。瓶装酸汤带回家后要冷藏，开封后尽快食用，配面条、豆腐或蔬菜都很合适。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'shi-sour-soup';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 火塘边的位置也有讲究，长辈坐在靠墙处，客人坐在火光正面的矮凳上，添柴时要从侧面放入，不能把火拨得太散。腊肉滴下的油落在炭火上，烟气会改变肉的香味，所以主人会不时调整竹竿高度。糍粑烤到表皮鼓起时最适合入口，蘸黄豆面或蜂蜜都可以。夜话通常从天气开始，慢慢聊到谁家的孩子、今年的收成和山里的传说。若想拍照，先征得主人同意，避免直对炉火使用闪光灯。离开前把自己坐过的柴灰轻轻拢好，留下一句晚安，才算完整地结束一晚火塘时光。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'shi-firepit';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 采茶要赶在露水未干时进行，嫩芽太湿会影响揉捻，太晚又容易失去清香。茶球在杯中慢慢展开时，可以先闻香再入口，前两泡清甜，第三泡会出现淡淡的栗香。米酒发酵期间每天要观察酒曲的状态，温度高时缩短时间，天气凉则延长，成酒后还要过滤两次。糍粑捶打看似简单，其实需要两个人配合节奏，木槌落下时另一人必须迅速翻面。游客若参加体验，建议穿方便活动的衣服并提前预约。茶、酒和糍粑都可以少量试吃，真正的味道往往来自一家人围坐时的聊天与笑声。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'shi-tea-rice-wine';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 吊脚楼的每根柱子都经过挑选，向阳面和背阴面的木材用途不同，先在屋檐下阴干数年，再由木匠按榫卯编号组装。下层架空不仅能防潮，也让山风穿过，牲口和柴火不容易受湿。雨季走楼梯时要踩在木板中间，避免边缘打滑；夜里听见木头轻响，是温度变化造成的正常伸缩。参观老宅请先询问主人，不要触摸供桌和祖先牌位。住进改造后的吊脚楼，可以留意窗框、梁柱和栏杆上的手工痕迹，那些不规则的接缝正是木楼适应山势的证据。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'zhu-stilt-house';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 看云海需要一点耐心，前一晚下过雨、清晨风又不大时最容易遇到。管家敲门后，记得带外套和一双防滑鞋，露台木板会有水汽。云层翻过山脊的速度很慢，十分钟里景色可能变化三次：先是梯田被遮住，再是屋顶露出，最后阳光把雾边照成金色。若当天没有云海，也不必失望，雾中的木楼、鸡鸣和屋檐滴水是另一种安静体验。民宿会准备热茶和简单早餐，观景结束后可以沿石阶走到老井，听主人讲以前挑水上山的路线。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'zhu-cloud-sea';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 老银匠家接待住客有固定的作息，上午炉火最旺，适合看锻打；午后光线柔和，适合听老人讲家族故事。堂屋里的旧银器并非装饰品，每一件都对应一次婚礼、一次远行或一位已经离世的亲人，拍摄时应避免移动位置。体验课程会根据年龄和手力调整工具，孩子可以先做压纹，大人再尝试拉丝和焊接。作品完成后师傅会用小锉刀修边，确保没有毛刺。夜里若听见锤声，不必敲门打扰，第二天早餐时再请他介绍昨晚赶制的物件，往往能看到刚刚出炉的温热银片。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'zhu-courtyard';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 美人靠的靠背高度和倾角因人家而异，有的适合坐着绣花，有的更适合半躺着看山。农忙时这里是晒谷场的一部分，谷粒铺开后要每隔一小时翻动，防止受潮；收起谷子后，孩子们会在栏杆边写作业，老人则在傍晚择菜聊天。入住时可以向主人借一只小竹垫，坐久了更舒服。山里日落比城市早，五点左右就会有凉风，带件薄外套很有必要。没有电视并不意味着无聊，听雨、看云、数屋檐下的灯亮起来，往往比安排满满的行程更能让人记住乌东。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'zhu-meirenkao';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 芦笙场迎宾前，主人会先确认客人的来处和人数，再决定敬茶、拦门酒或芦笙曲目的次序。游客不熟悉礼节时，跟着领队微笑、点头即可，不必勉强饮酒。鼓藏头家保存的旧物每年都会重新整理，某些节庆用品只在特定日子展示，普通参观时看到的是复制品或照片。沿梯田步道行走时不要踩进田埂里的秧苗，遇到劳作的村民可先问候再拍照。三百级石阶看似不长，雨后青苔会让路面变滑，建议穿抓地力好的鞋，并把饮水放在随手可取的位置。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'xing-entry-ritual';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 苗年期间各寨芦笙队会提前排练，曲调既有迎宾也有送别，领队抬手的方向决定队形变化。观赛时不要站到队伍行进线上，尤其是孩子要由大人牵好。斗牛观礼强调安全和距离，牛角相碰后不要追着牛群拍摄。篝火夜歌则更适合参与，学不会完整舞步也可以跟着节拍走两圈。节庆市集里常见新绣片、银饰、米酒和腊味，购买时可以询问制作人和保存方式。苗年日期每年略有变化，计划出行前先查看寨里的公告，住宿和返程车票最好提前预留余量。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'xing-lusheng-festival';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 徒步前可在山门领取路线图，沿途有几处木亭和水源点，但手机信号并不连续。秃杉林下温度比村里低，夏天也建议带一件长袖；冬季遇到霜冻，木栈道会结滑冰层，要放慢脚步。向导辨认鸟鸣时会停下来示范，游客不要大声播放音乐，以免惊扰林中的动物。山脊草甸风力变化快，拍照时不要靠近悬崖边缘，也不要采摘不认识的植物。佛光出现需要特定角度和湿度，没遇上也很正常，真正值得的是在林间走完八公里后，听见自己的呼吸重新变得平稳。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'xing-leigongshan';
UPDATE `wudong_common_story` SET `paragraphs` = JSON_SET(`paragraphs`, '$[2]', CONCAT(JSON_UNQUOTE(JSON_EXTRACT(`paragraphs`, '$[2]')), ' 这条路线适合把脚步放慢，银匠巷的每家铺子都有不同的敲击声，清脆的、低沉的，像一段没有谱子的音乐。进店前先看门口是否挂着体验牌，正在赶工时不要伸手触碰半成品。蓝染坊通常会准备围裙，靛泥沾到衣服后要及时用清水冲洗。晒谷场是村民的生活空间，遇到晾晒的粮食请绕行，不要为了取景踩进谷堆。傍晚从西坡返回时，石阶会变暗，建议提前打开手机手电。半日走完后，可以在芦笙场附近喝一碗米酒甜汤，把看到的纹样、听到的故事记在小本子上，下一次再来时会发现巷子里又多了新的作品。')), `updated_at` = CURRENT_TIMESTAMP WHERE `slug` = 'xing-silver-lane';


-- =====================================================================
-- 来源文件：wudong_post_images.sql
-- =====================================================================


-- =====================================================================
-- 乌东文旅 社区帖子配图本地化（增量脚本）
-- 来源：app/wu_dong_vue/src/mock/data.ts 的 posts + mock/image-map.ts 映射
-- 生成：2026-09-11，由一次性脚本按 mock 数据生成，勿手改；
--       mock 配图变动后请重新生成（映射维护见 image-map.ts）。
-- 前置：先执行 wudong_schema.sql 与 wudong_seed.sql（帖子 id 1~9）。
-- 幂等：按主键覆写 images，可重复执行；重跑 wudong_seed.sql 后需再执行本脚本。
-- 链接：/images/** 为 C 端 public/images 静态资源路径（Vite 同源），共 24 张。
-- =====================================================================


UPDATE `wudong_m5_post` SET `images` = '["/images/109_sea-of-clouds-mountain-sunrise_c1b39d04.jpg","/images/110_guesthouse-balcony-mountain-morning_37453f6c.jpg","/images/111_hot-tea-mountain-view-terrace_895e6329.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 1;
UPDATE `wudong_m5_post` SET `images` = '["/images/112_silversmith-crafting-silver-workshop_748d05e3.jpg","/images/113_silver-jewelry-tools-on-workbench_983d6a15.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 2;
UPDATE `wudong_m5_post` SET `images` = '["/images/114_long-outdoor-table-banquet-feast_a067861e.jpg","/images/115_spicy-red-fish-hotpot-bowl_9e423264.jpg","/images/116_ethnic-drinking-horn-toast_7fbe77ec.jpg","/images/117_colorful-rice-bowl-bibimbap_b32d3f89.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 3;
UPDATE `wudong_m5_post` SET `images` = '["/images/118_rice-terraces-sunset-aerial_9e654761.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 4;
UPDATE `wudong_m5_post` SET `images` = '["/images/119_father-and-child-craft-time_96e1be99.jpg","/images/120_child-handcraft-workshop_849aa802.jpg","/images/121_traditional-chinese-village-street_e5458950.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 5;
UPDATE `wudong_m5_post` SET `images` = '["/images/122_hands-dyeing-fabric-indigo-vat_1f1a7c79.jpg","/images/123_indigo-batik-cloth-drying_ca86daa1.jpg","/images/124_batik-wax-pattern-craft-hands_2a0b1c2d.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 6;
UPDATE `wudong_m5_post` SET `images` = '["/images/125_indoor-fire-pit-night-glow_921de887.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 7;
UPDATE `wudong_m5_post` SET `images` = '["/images/126_misty-forest-hiking-trail_641f9d68.jpg","/images/127_hikers-ridge-above-clouds_ba67f7d5.jpg","/images/128_waterfall-green-forest-river_df2a3152.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 8;
UPDATE `wudong_m5_post` SET `images` = '["/images/129_sunlit-old-village-alley_81afe34a.jpg","/images/130_elderly-woman-cooking-kitchen_c8132614.jpg","/images/131_dried-foods-market-stall_b7719195.jpg","/images/132_milky-way-wooden-cottage-night_bf6e5a41.jpg"]', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 9;


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


-- ===== m1 衣模块本地图片同步（exp/local-images） =====
-- 已上传至 OSS；可重复执行。
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-1-3.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-1-3.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-1-2.jpg"]' AS JSON) WHERE `id` = 1;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-2-2.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-2-2.jpg","https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-2-3.jpg"]' AS JSON) WHERE `id` = 2;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-3-2.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-3-2.jpg"]' AS JSON) WHERE `id` = 3;
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-4-2.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/m1/products/product-4-2.jpg"]' AS JSON) WHERE `id` = 4;
UPDATE `wudong`.`wudong_m1_product` SET `artisan` = JSON_SET(COALESCE(`artisan`, JSON_OBJECT()), '$.avatar', 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/common/merchants/merchant-1-logo.jpg') WHERE `id` = 1;
UPDATE `wudong`.`wudong_m1_product` SET `artisan` = JSON_SET(COALESCE(`artisan`, JSON_OBJECT()), '$.avatar', 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/common/merchants/merchant-2-logo.jpg') WHERE `id` = 2;
UPDATE `wudong`.`wudong_m1_product` SET `artisan` = JSON_SET(COALESCE(`artisan`, JSON_OBJECT()), '$.avatar', 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/common/merchants/merchant-3-logo.jpg') WHERE `id` = 3;
-- 百鸟衣改良礼服指定主图（OSS）
UPDATE `wudong`.`wudong_m1_product` SET `cover` = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg', `images` = CAST('["https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/019_modern-fashion-dress-with-miao-embroidery-_1958710e.jpg"]' AS JSON) WHERE `id` = 4;

-- =====================================================================
-- 乌东文旅 · m2/m3 补充图片改写到阿里云 OSS
--
-- 前置：先执行 node scripts/oss/upload-m2m3-images.mjs 把图片传到
--       https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/<文件名>
-- 作用：把 wudong 库里残留的文生图 prompt 外链换成对应 OSS 地址。
-- 库：  wudong（运行中后端 app/wu_dong_midway 的 MYSQL_DATABASE=wudong）
-- 执行：mysql -h127.0.0.1 -P13306 -uroot -p123456 wudong < scripts/sql/wudong_m2m3_images_to_oss.sql
-- 说明：按主键定位，幂等，可重复执行。
-- =====================================================================
SET NAMES utf8mb4;

use wudong;
SET @oss = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com/wudong/images/';
START TRANSACTION;

-- =====================================================================
-- 1. 菜品图 wudong_m2_dish.img
--    id1/id2/id8 无专属图，复用最接近的 dish-12/dish-9/dish-4
-- =====================================================================
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-12.jpg') WHERE `id` = 1;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-9.jpg')  WHERE `id` = 2;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-3.jpg')  WHERE `id` = 3;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-4.jpg')  WHERE `id` = 4;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-5.jpg')  WHERE `id` = 5;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-6.jpg')  WHERE `id` = 6;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-7.jpg')  WHERE `id` = 7;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-4.jpg')  WHERE `id` = 8;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-9.jpg')  WHERE `id` = 9;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-10.jpg') WHERE `id` = 10;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-11.jpg') WHERE `id` = 11;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-12.jpg') WHERE `id` = 12;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-13.jpg') WHERE `id` = 13;
UPDATE `wudong_m2_dish` SET `img` = CONCAT(@oss, 'dish-14.jpg') WHERE `id` = 14;

-- =====================================================================
-- 2. 餐厅图集 wudong_m2_restaurant.images（id=1 云雾长桌宴）
-- =====================================================================
UPDATE `wudong_m2_restaurant` SET `images` = REPLACE(CAST(`images` AS CHAR),
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Guizhou%20sour%20soup%20fish%20hotpot%20red%20broth%20steam&image_size=landscape_4_3',
  CONCAT(@oss, 'restarunt1.jpg'))
WHERE `id` = 1;

UPDATE `wudong_m2_restaurant` SET `images` = REPLACE(CAST(`images` AS CHAR),
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glutinous%20rice%20wine%20bowls%20on%20wooden%20table&image_size=landscape_4_3',
  CONCAT(@oss, 'restarunt2.jpg'))
WHERE `id` = 1;

-- =====================================================================
-- 3. 民宿图集 wudong_m3_homestay.images（id=1 枕云山舍）
-- =====================================================================
UPDATE `wudong_m3_homestay` SET `images` = REPLACE(CAST(`images` AS CHAR),
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20wooden%20guesthouse%20room%20with%20indigo%20textiles%20warm%20lamp&image_size=landscape_4_3',
  CONCAT(@oss, 'homestay-1-gallery-2.jpg'))
WHERE `id` = 1;

UPDATE `wudong_m3_homestay` SET `images` = REPLACE(CAST(`images` AS CHAR),
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guesthouse%20balcony%20overlooking%20mountain%20valley%20morning&image_size=landscape_4_3',
  CONCAT(@oss, 'homestay-1-gallery-3.jpg'))
WHERE `id` = 1;

-- =====================================================================
-- 4. 房型封面 wudong_m3_room_type.cover（id 1~7）
-- =====================================================================
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-1-cover.jpg') WHERE `id` = 1;
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-2-cover.jpg') WHERE `id` = 2;
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-3-cover.jpg') WHERE `id` = 3;
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-4-cover.jpg') WHERE `id` = 4;
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-5-cover.jpg') WHERE `id` = 5;
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-6-cover.jpg') WHERE `id` = 6;
UPDATE `wudong_m3_room_type` SET `cover` = CONCAT(@oss, 'room-7-cover.jpg') WHERE `id` = 7;

COMMIT;

-- =====================================================================
-- 执行后校验：下面各 remain 应全为 0
-- =====================================================================
SELECT 'wudong_m2_dish.img' AS field, COUNT(*) AS remain FROM `wudong_m2_dish` WHERE `img` LIKE '%trae-api-cn%'
UNION ALL SELECT 'wudong_m2_restaurant.images', COUNT(*) FROM `wudong_m2_restaurant` WHERE CAST(`images` AS CHAR) LIKE '%trae-api-cn%'
UNION ALL SELECT 'wudong_m3_homestay.images', COUNT(*) FROM `wudong_m3_homestay` WHERE CAST(`images` AS CHAR) LIKE '%trae-api-cn%'
UNION ALL SELECT 'wudong_m3_room_type.cover', COUNT(*) FROM `wudong_m3_room_type` WHERE `cover` LIKE '%trae-api-cn%';
