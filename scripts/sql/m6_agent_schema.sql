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
