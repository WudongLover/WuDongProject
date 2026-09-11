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
