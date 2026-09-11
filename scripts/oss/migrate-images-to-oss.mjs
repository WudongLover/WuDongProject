#!/usr/bin/env node
/**
 * 存量照片迁移到阿里云 OSS（一次性脚本，可重复执行）
 *
 * 做什么：
 *   1) 上传：把 app/wu_dong_vue/public/images/** 全部传到 `{OSS_PREFIX}/images/<原文件名>`；
 *   2) 改写：把库里所有图片字段改成 OSS 访问地址
 *      - `/images/x.jpg`      → `{OSS_PUBLIC_BASE_URL}/{OSS_PREFIX}/images/x.jpg`
 *      - 文生图外链（命中 image-map.ts 的）→ 对应本地文件的 OSS 地址
 *      - 已是 OSS 地址 / 无关键          → 原样保留
 *
 * 用法（在仓库根目录执行）：
 *   node scripts/oss/migrate-images-to-oss.mjs --dry-run     # 只打印计划，不写 OSS / 不改库
 *   node scripts/oss/migrate-images-to-oss.mjs               # 正式执行
 *   node scripts/oss/migrate-images-to-oss.mjs --force       # 已存在的对象也重新上传
 *   node scripts/oss/migrate-images-to-oss.mjs --only=db     # 只改库（或 --only=upload 只传图）
 *   node scripts/oss/migrate-images-to-oss.mjs --sql         # 只生成改写 SQL（不执行），默认输出 scripts/sql/wudong_images_to_oss.sql
 *   node scripts/oss/migrate-images-to-oss.mjs --sql=xxx.sql # 指定 SQL 输出路径
 *
 * 依赖与配置来源：
 *   - 依赖（mysql2 / ali-oss / dotenv）从 app/cool-admin-midway 的 node_modules 解析；
 *   - 配置读 app/wu_dong_midway/.env 与 app/cool-admin-midway/.env（后者优先），也可用同名环境变量覆盖。
 *
 * 前置：先执行 scripts/sql/wudong_schema.sql 与种子脚本；OSS 配置留空时脚本会直接报错退出。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const ADMIN_DIR = path.join(ROOT, 'app', 'cool-admin-midway');
const CSIDE_DIR = path.join(ROOT, 'app', 'wu_dong_midway');
const IMAGE_DIR = path.join(ROOT, 'app', 'wu_dong_vue', 'public', 'images');
const IMAGE_MAP_FILE = path.join(ROOT, 'app', 'wu_dong_vue', 'src', 'mock', 'image-map.ts');

// 依赖装在两个后端工程里（脚本目录本身没有 node_modules）
const backendRequire = createRequire(path.join(ADMIN_DIR, 'package.json'));
const mysql = backendRequire('mysql2/promise');
const OSS = backendRequire('ali-oss');
const dotenv = backendRequire('dotenv');

/** 需要改写的图片字段（表 → 列 + 形态） */
const TARGETS = [
  { table: 'wudong_common_user', columns: [['avatar', 'text']] },
  { table: 'wudong_common_banner', columns: [['image', 'text']] },
  { table: 'wudong_common_story', columns: [['cover', 'text']] },
  {
    table: 'wudong_common_review',
    columns: [
      ['user_avatar', 'text'],
      ['images', 'json-array'],
    ],
  },
  { table: 'wudong_common_cart_item', columns: [['cover', 'text']] },
  { table: 'wudong_common_order', columns: [['cover', 'text']] },
  { table: 'wudong_common_order_item', columns: [['cover', 'text']] },
  {
    table: 'wudong_m1_product',
    columns: [
      ['cover', 'text'],
      ['images', 'json-array'],
      ['artisan', 'json-object-field:avatar'],
    ],
  },
  {
    table: 'wudong_m2_restaurant',
    columns: [
      ['cover', 'text'],
      ['images', 'json-array'],
    ],
  },
  { table: 'wudong_m2_dish', columns: [['img', 'text']] },
  {
    table: 'wudong_m3_homestay',
    columns: [
      ['cover', 'text'],
      ['images', 'json-array'],
    ],
  },
  { table: 'wudong_m3_room_type', columns: [['cover', 'text']] },
  { table: 'wudong_m4_scenic', columns: [['cover', 'text']] },
  { table: 'wudong_m4_route', columns: [['cover', 'text']] },
  { table: 'wudong_m5_post', columns: [['images', 'json-array']] },
];

const EXT_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
};

/* ------------------------------ 基础工具 ------------------------------ */

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const flagValue = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : '';
};

const DRY_RUN = hasFlag('dry-run');
const FORCE = hasFlag('force');
const ONLY = flagValue('only'); // upload | db | ''
/** 只生成 SQL 不执行：--sql 或 --sql=路径 */
const SQL_MODE = hasFlag('sql');
const SQL_FILE = path.isAbsolute(flagValue('sql'))
  ? flagValue('sql')
  : path.join(ROOT, flagValue('sql') || path.join('scripts', 'sql', 'wudong_images_to_oss.sql'));

const log = (...rest) => console.log(...rest);
const warn = (...rest) => console.warn(...rest);

function loadEnv() {
  const env = {};
  // 先 C 端后后台：同名变量以后台为准
  for (const dir of [CSIDE_DIR, ADMIN_DIR]) {
    const file = path.join(dir, '.env');
    if (fs.existsSync(file)) {
      Object.assign(env, dotenv.parse(fs.readFileSync(file)));
    }
  }
  return env;
}

const ENV = loadEnv();
const envGet = (key) => String(process.env[key] ?? ENV[key] ?? '').trim();

const trimSlash = (v) => v.replace(/\/+$/, '');
const stripProtocol = (v) => trimSlash(v.replace(/^https?:\/\//i, ''));

const region = envGet('OSS_REGION');
const bucket = envGet('OSS_BUCKET');
const accessKeyId = envGet('OSS_ACCESS_KEY_ID');
const accessKeySecret = envGet('OSS_ACCESS_KEY_SECRET');
const rawEndpoint = envGet('OSS_ENDPOINT');
const endpoint = rawEndpoint
  ? stripProtocol(rawEndpoint)
  : region
    ? `oss-${region.replace(/^oss-/, '')}.aliyuncs.com`
    : '';
const publicBase = trimSlash(envGet('OSS_PUBLIC_BASE_URL')) || (bucket && endpoint ? `https://${bucket}.${endpoint}` : '');
const ossPrefix = trimSlash(envGet('OSS_PREFIX')) || 'wudong';
/** 真实执行需要完整凭据；dry-run 只需要能拼出访问地址 */
const ossEnabled = !!(bucket && accessKeyId && accessKeySecret && (endpoint || region));
const canBuildUrl = !!(publicBase && ossPrefix);

const oss = new OSS({
  region: region || undefined,
  bucket,
  accessKeyId: accessKeyId || 'dry-run',
  accessKeySecret: accessKeySecret || 'dry-run',
  endpoint: endpoint || undefined,
  secure: true,
});

/** 本地图片路径 → OSS 访问地址 */
function toOssUrl(localPath) {
  if (!publicBase || !localPath.startsWith('/images/')) return localPath;
  return `${publicBase}/${[ossPrefix, 'images', localPath.slice('/images/'.length)].join('/')}`;
}

/** 本地图片路径 → OSS 对象键 */
function toOssKey(localPath) {
  return `${ossPrefix}/images/${localPath.slice('/images/'.length)}`;
}

function mimeOf(name) {
  const ext = path.extname(name).replace(/^\./, '').toLowerCase();
  return EXT_MIME[ext] || 'application/octet-stream';
}

/** 读取前端 image-map.ts：外链 URL → 本地图片路径 */
function loadImageMap() {
  const text = fs.readFileSync(IMAGE_MAP_FILE, 'utf8');
  const map = new Map();
  const re = /^\s*"([^"]+)":\s*"([^"]+)",?\s*$/gm;
  let m;
  while ((m = re.exec(text))) {
    map.set(m[1], m[2]);
  }
  return map;
}

/** 递归列出目录下全部文件（相对路径用 / 分隔） */
function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(abs, base));
    } else if (entry.isFile()) {
      out.push(path.relative(base, abs).split(path.sep).join('/'));
    }
  }
  return out;
}

/* ------------------------------ 上传照片 ------------------------------ */

async function uploadImages() {
  const localFiles = walk(IMAGE_DIR).sort();
  log(`\n[1/2] 上传本地照片 → OSS`);
  log(`  本地目录：${path.relative(ROOT, IMAGE_DIR)}（${localFiles.length} 个文件）`);
  log(`  目标位置：${publicBase}/${ossPrefix}/images/<文件名>`);

  let uploaded = 0;
  let skipped = 0;

  for (const rel of localFiles) {
    const localPath = `/${path.posix.join('images', rel)}`;
    const key = toOssKey(localPath);
    const abs = path.join(IMAGE_DIR, rel);

    if (DRY_RUN) {
      uploaded += 1;
      continue;
    }

    if (!FORCE) {
      try {
        await oss.head(key);
        skipped += 1;
        continue;
      } catch (err) {
        const status = err?.status ?? err?.statusCode;
        if (status !== 404 && err?.code !== 'NoSuchKey' && err?.code !== 'NotFound') {
          throw err;
        }
      }
    }

    await oss.put(key, fs.readFileSync(abs), { mime: mimeOf(rel) });
    uploaded += 1;
    if (uploaded % 20 === 0) {
      log(`  已上传 ${uploaded} 个…`);
    }
  }

  log(
    DRY_RUN
      ? `  [dry-run] 待上传 ${uploaded} 个文件`
      : `  完成：新上传 ${uploaded} 个，已存在跳过 ${skipped} 个`
  );
}

/* ------------------------------ 改写数据库 ------------------------------ */

/**
 * 外链查表：先精确匹配，再兼容 `+` 与 `%20` 两种空格编码（同一 URL 的不同写法）
 */
function lookupImageMap(imageMap, url) {
  if (imageMap.has(url)) return imageMap.get(url);
  const normalized = url.replace(/\+/g, '%20');
  return imageMap.get(normalized) || '';
}

/** 单个图片 URL 的改写规则 */
function rewriteUrl(value, imageMap, stats) {
  if (typeof value !== 'string' || !value) return value;
  if (publicBase && value.startsWith(publicBase)) return value; // 已迁移

  let localPath = '';
  if (value.startsWith('/images/')) {
    localPath = value;
  }
  if (!localPath) {
    localPath = lookupImageMap(imageMap, value);
    if (!localPath) {
      // 既不是本地路径也不在映射表里：外链原样保留，计入待人工确认清单
      if (/^https?:\/\//i.test(value)) {
        stats.unmapped.add(value);
      }
      return value;
    }
  }

  // 本地文件不存在时保持原值，避免改写成一个 404 的 OSS 地址
  const abs = path.join(IMAGE_DIR, localPath.slice('/images/'.length));
  if (!fs.existsSync(abs)) {
    stats.missing.add(localPath);
    return value;
  }
  return toOssUrl(localPath);
}

/** 按列形态改写整列值；返回 undefined 表示无需更新 */
function rewriteColumn(value, shape, imageMap, stats) {
  if (value === null || value === undefined) return undefined;

  if (shape === 'text') {
    const next = rewriteUrl(value, imageMap, stats);
    return next === value ? undefined : next;
  }

  // JSON 列：mysql2 默认已解析为对象/数组，兜底兼容字符串
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (shape === 'json-array') {
    if (!Array.isArray(parsed)) return undefined;
    const next = parsed.map((item) => rewriteUrl(item, imageMap, stats));
    return JSON.stringify(next) === JSON.stringify(parsed) ? undefined : JSON.stringify(next);
  }

  if (shape.startsWith('json-object-field:')) {
    const field = shape.split(':')[1];
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
    const nextValue = rewriteUrl(parsed[field], imageMap, stats);
    if (nextValue === parsed[field]) return undefined;
    return JSON.stringify({ ...parsed, [field]: nextValue });
  }

  return undefined;
}

/** MySQL 字符串字面量（转义反斜杠与单引号） */
function sqlLiteral(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

/** 生成单行 UPDATE：JSON 列用 CAST(... AS JSON)，普通列直接赋字符串 */
function toUpdateSql(schema, table, target, updates, id) {
  const sets = Object.entries(updates).map(([col, value]) => {
    const shape = (target.columns.find(([name]) => name === col) || [])[1] || 'text';
    const literal = sqlLiteral(value);
    return `\`${col}\` = ${shape === 'text' ? literal : `CAST(${literal} AS JSON)`}`;
  });
  return `UPDATE \`${schema}\`.\`${table}\` SET ${sets.join(', ')} WHERE \`id\` = ${id};`;
}

/**
 * 生成执行后校验语句：统计各图片字段中残留的老值。
 * 注意 OSS 地址本身也含 `/images/`，所以要排除已迁移到本 bucket 的值：
 * - 普通列：值不是 `{OSS 前缀}/...` 且仍含 `/images/` 或文生图外链；
 * - JSON 列：文本里仍有文生图外链，或仍有以 `"/images/` 开头的本地路径元素。
 */
function buildVerifySql(existing) {
  const parts = [];
  for (const { schema, table } of existing) {
    const target = TARGETS.find((t) => t.table === table);
    if (!target) continue;
    for (const [name, shape] of target.columns) {
      const expr = shape === 'text' ? `\`${name}\`` : `CAST(\`${name}\` AS CHAR)`;
      const condition =
        shape === 'text'
          ? `${expr} LIKE '%/images/%' AND ${expr} NOT LIKE '${publicBase}/%' `
          : `${expr} LIKE '%"/images/%' `;
      parts.push(
        `SELECT '${schema}.${table}.${name}' AS field, COUNT(*) AS remain ` +
          `FROM \`${schema}\`.\`${table}\` ` +
          `WHERE (${condition}OR ${expr} LIKE '%trae-api-cn%')`
      );
    }
  }
  return parts.length ? `${parts.join('\nUNION ALL\n')};` : '-- 无命中字段';
}

/**
 * 找出含有目标表的库（cool / wudong 等），只返回实际存在的 (库, 表) 组合，
 * 避免对不存在的表产生噪音告警。
 */
async function findExistingTables(conn, tables, only) {
  const [rows] = await conn.query(
    `SELECT table_schema AS schemaName, table_name AS tableName
       FROM information_schema.tables
      WHERE table_name IN (${tables.map(() => '?').join(',')})
        AND table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
      ORDER BY table_schema, table_name`,
    tables
  );
  const wanted = only ? only.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const result = [];
  for (const row of rows) {
    if (wanted && !wanted.includes(row.schemaName)) continue;
    result.push({ schema: row.schemaName, table: row.tableName });
  }
  return result;
}

async function migrateDatabase() {
  const conn = await mysql.createConnection({
    host: envGet('MYSQL_HOST') || '127.0.0.1',
    port: Number(envGet('MYSQL_PORT')) || 3306,
    user: envGet('MYSQL_USERNAME') || 'root',
    password: envGet('MYSQL_PASSWORD') || '',
    charset: 'utf8mb4',
    multipleStatements: false,
  });

  const imageMap = loadImageMap();
  const stats = { missing: new Set(), unmapped: new Set() };
  const tables = TARGETS.map((t) => t.table);
  const existing = await findExistingTables(conn, tables, flagValue('database'));
  const schemas = [...new Set(existing.map((item) => item.schema))];

  log(`\n[2/2] 改写数据库图片字段 → OSS`);
  log(`  命中库：${schemas.join(', ') || '（无）'}`);
  log(`  命中表：${existing.length} 个`);
  log(`  外链映射：image-map.ts 共 ${imageMap.size} 条`);

  let scanned = 0;
  let updated = 0;
  /** --sql 模式：收集 UPDATE 语句，最后落盘 */
  const sqlStatements = [];
  const sqlHeader = [
    '-- =====================================================================',
    '-- 乌东文旅 · 数据库图片字段改写为阿里云 OSS 地址（增量脚本，可重复执行）',
    `-- 生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    `-- 目标：${publicBase}/${ossPrefix}/images/<文件名>`,
    '-- 覆盖：用户头像、Banner、推文封面、评价晒图、购物车/订单快照封面、',
    '--       商品/餐厅/民宿/门票/路线/社区配图（含 JSON 数组与 artisan.avatar）',
    '-- 来源：scripts/oss/migrate-images-to-oss.mjs --sql（由 image-map.ts 与本地图片推导，勿手改）',
    '-- 前置：先用同脚本上传图片（--only=upload）；本脚本对老值幂等，重跑无副作用',
    '-- 注意：未命中 image-map.ts 的外链（若干种子用户头像）不在此文件中，需补图后重新生成',
    '-- 执行：mysql -h127.0.0.1 -P13306 -uroot -p < scripts/sql/wudong_images_to_oss.sql',
    '-- =====================================================================',
    '',
    'SET NAMES utf8mb4;',
    'START TRANSACTION;',
    '',
  ];

  try {
    for (const { schema, table } of existing) {
      const target = TARGETS.find((t) => t.table === table);
      if (!target) continue;
      const cols = target.columns.map(([name]) => `\`${name}\``).join(', ');
      const [rows] = await conn.query(
        `SELECT \`id\`, ${cols} FROM \`${schema}\`.\`${target.table}\``
      );

      for (const row of rows) {
        scanned += 1;
        const updates = {};
        for (const [name, shape] of target.columns) {
          const next = rewriteColumn(row[name], shape, imageMap, stats);
          if (next !== undefined) updates[name] = next;
        }
        if (!Object.keys(updates).length) continue;

        updated += 1;
        if (DRY_RUN) {
          if (updated <= 5) {
            log(
              `  [dry-run] ${schema}.${target.table}#${row.id} → ${JSON.stringify(updates).slice(0, 160)}`
            );
          }
          continue;
        }
        if (SQL_MODE) {
          sqlStatements.push(toUpdateSql(schema, target.table, target, updates, row.id));
          continue;
        }
        await conn.query(`UPDATE \`${schema}\`.\`${target.table}\` SET ? WHERE \`id\` = ?`, [
          updates,
          row.id,
        ]);
      }
    }
  } finally {
    await conn.end();
  }

  if (SQL_MODE) {
    const sqlFooter = [
      '',
      'COMMIT;',
      '',
      '-- ---------------- 执行后校验：下列 remain 应全为 0 ----------------',
      buildVerifySql(existing),
      '',
    ];
    fs.writeFileSync(SQL_FILE, [...sqlHeader, ...sqlStatements, ...sqlFooter].join('\n'), 'utf8');
    log(`  SQL 已生成：${path.relative(ROOT, SQL_FILE)}（${sqlStatements.length} 条 UPDATE）`);
    log('  执行方式：mysql -h127.0.0.1 -P13306 -uroot -p < ' + path.relative(ROOT, SQL_FILE));
  }

  log(
    DRY_RUN
      ? `  [dry-run] 扫描 ${scanned} 行，待改写 ${updated} 行`
      : SQL_MODE
        ? `  扫描 ${scanned} 行，生成改写语句 ${updated} 行`
      : `  完成：扫描 ${scanned} 行，改写 ${updated} 行`
  );
  if (stats.missing.size) {
    warn(
      `  注意：以下本地文件不存在，对应字段保持原值（共 ${stats.missing.size} 个）：${[...stats.missing]
        .slice(0, 10)
        .join('、')}${stats.missing.size > 10 ? ' …' : ''}`
    );
  }
  if (stats.unmapped.size) {
    warn(
      `  注意：以下外链未命中 image-map.ts，保持原值、需人工确认（共 ${stats.unmapped.size} 个）：${[...stats.unmapped]
        .slice(0, 5)
        .join('、')}${stats.unmapped.size > 5 ? ' …' : ''}`
    );
  }
}

/* ------------------------------ 入口 ------------------------------ */

async function main() {
  log('=== 乌东文旅 · 存量照片迁移到阿里云 OSS ===');
  log(
    `运行模式：${
      SQL_MODE ? '仅生成 SQL（不写 OSS、不改库）' : DRY_RUN ? 'dry-run（不写数据）' : '正式执行'
    }${FORCE ? ' · force' : ''}`
  );

  if (!canBuildUrl) {
    throw new Error(
      'OSS 未配置：请在 app/cool-admin-midway/.env（或 wu_dong_midway/.env）至少填写 OSS_REGION + OSS_BUCKET（或 OSS_PUBLIC_BASE_URL）'
    );
  }
  if (!DRY_RUN && !SQL_MODE && !ossEnabled) {
    throw new Error(
      'OSS 凭据缺失：正式执行需要 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET（dry-run 可省略）'
    );
  }
  log(`Bucket：${bucket} · Endpoint：${endpoint} · 访问前缀：${publicBase}/${ossPrefix}`);

  if (!SQL_MODE && ONLY !== 'db') {
    await uploadImages();
  }
  if (ONLY !== 'upload') {
    await migrateDatabase();
  }

  log('\n全部完成。');
}

main().catch((err) => {
  console.error('\n执行失败：', err?.message || err);
  process.exit(1);
});
