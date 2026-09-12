#!/usr/bin/env node
/**
 * 把 exp/local-images 中已核对的“衣”模块商品图同步到 OSS，并更新 m1 商品图集。
 *
 * 用法：node scripts/oss/sync-m1-local-images.mjs [--dry-run]
 *
 * 该脚本只处理下方 M1_IMAGES 列表。图片的归属经过人工核对：
 * 1 为银镯与佩戴图；2 为靛蓝织物和蜡染工具；3 为刺绣纹样；4 为苗族礼服。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CSIDE_DIR = path.join(ROOT, 'app', 'wu_dong_midway');
const ADMIN_DIR = path.join(ROOT, 'app', 'cool-admin-midway');
const SOURCE_DIR = path.join(ROOT, 'exp', 'local-images', 'local-images', 'm1', 'products');
const SQL_FILE = path.join(ROOT, 'scripts', 'sql', 'wudong_all_in_one.sql');
const backendRequire = createRequire(path.join(ADMIN_DIR, 'package.json'));
const OSS = backendRequire('ali-oss');
const mysql = backendRequire('mysql2/promise');
const dotenv = backendRequire('dotenv');
const DRY_RUN = process.argv.includes('--dry-run');

const M1_IMAGES = {
  1: ['product-1-3.jpg', 'product-1-2.jpg'],
  2: ['product-2-2.jpg', 'product-2-3.jpg'],
  3: ['product-3-2.jpg'],
  4: ['product-4-2.jpg'],
};
const ARTISAN_AVATARS = {
  1: 'merchant-1-logo.jpg',
  2: 'merchant-2-logo.jpg',
  3: 'merchant-3-logo.jpg',
};

function readEnv(dir) {
  const file = path.join(dir, '.env');
  return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
}

function quoteSql(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

// 商品数据在 C 端的 wudong 库中；OSS 缺项时才回退到管理端配置。
const csideEnv = readEnv(CSIDE_DIR);
const adminEnv = readEnv(ADMIN_DIR);
const get = (key) => String(process.env[key] ?? csideEnv[key] ?? adminEnv[key] ?? '').trim();
const bucket = get('OSS_BUCKET');
const endpoint = get('OSS_ENDPOINT').replace(/^https?:\/\//, '').replace(/\/+$/, '');
const prefix = get('OSS_PREFIX').replace(/^\/+|\/+$/g, '') || 'wudong';
const publicBase = (get('OSS_PUBLIC_BASE_URL') || `https://${bucket}.${endpoint}`).replace(/\/+$/, '');
const schema = String(process.env.WUDONG_MYSQL_DATABASE ?? csideEnv.MYSQL_DATABASE ?? 'wudong').trim();

if (!bucket || !endpoint || !get('OSS_ACCESS_KEY_ID') || !get('OSS_ACCESS_KEY_SECRET')) {
  throw new Error('OSS 配置不完整：请检查 app/wu_dong_midway/.env。');
}

const oss = new OSS({
  region: get('OSS_REGION') || undefined,
  bucket,
  endpoint,
  accessKeyId: get('OSS_ACCESS_KEY_ID'),
  accessKeySecret: get('OSS_ACCESS_KEY_SECRET'),
  secure: true,
});

const records = Object.entries(M1_IMAGES).map(([id, files]) => ({
  id: Number(id),
  urls: files.map((file) => `${publicBase}/${prefix}/images/m1/products/${file}`),
}));
const artisanRecords = Object.entries(ARTISAN_AVATARS).map(([id, file]) => ({
  id: Number(id),
  file,
  url: `${publicBase}/${prefix}/images/common/merchants/${file}`,
}));

async function upload() {
  for (const { urls } of records) {
    for (const url of urls) {
      const file = path.basename(url);
      const source = path.join(SOURCE_DIR, file);
      if (!fs.existsSync(source)) throw new Error(`缺少本地图片：${source}`);
      const key = `${prefix}/images/m1/products/${file}`;
      if (DRY_RUN) {
        console.log(`[dry-run] ${source} -> ${key}`);
      } else {
        await oss.put(key, fs.readFileSync(source), { mime: 'image/jpeg' });
        console.log(`已上传：${key}`);
      }
    }
  }
  for (const { file, url } of artisanRecords) {
    const source = path.join(ROOT, 'exp', 'local-images', 'local-images', 'common', 'merchants', file);
    const key = `${prefix}/images/common/merchants/${file}`;
    if (DRY_RUN) console.log(`[dry-run] ${source} -> ${key}`);
    else {
      await oss.put(key, fs.readFileSync(source), { mime: 'image/jpeg' });
      console.log(`已上传：${key}`);
    }
  }
}

function updatesSql() {
  const productSql = records
    .map(({ id, urls }) =>
      `UPDATE \`${schema}\`.\`wudong_m1_product\` SET \`cover\` = ${quoteSql(urls[0])}, ` +
      `\`images\` = CAST(${quoteSql(JSON.stringify(urls))} AS JSON) WHERE \`id\` = ${id};`
    )
    .join('\n');
  const artisanSql = artisanRecords.map(({ id, url }) =>
    `UPDATE \`${schema}\`.\`wudong_m1_product\` SET \`artisan\` = JSON_SET(COALESCE(\`artisan\`, JSON_OBJECT()), '$.avatar', ${quoteSql(url)}) WHERE \`id\` = ${id};`
  ).join('\n');
  return `${productSql}\n${artisanSql}`;
}

async function updateDatabase() {
  const conn = await mysql.createConnection({
    host: get('MYSQL_HOST') || '127.0.0.1',
    port: Number(get('MYSQL_PORT')) || 3306,
    user: get('MYSQL_USERNAME') || 'root',
    password: get('MYSQL_PASSWORD'),
    database: schema,
    charset: 'utf8mb4',
  });
  try {
    for (const { id, urls } of records) {
      if (DRY_RUN) {
        console.log(`[dry-run] 更新 ${schema}.wudong_m1_product#${id}`);
      } else {
        await conn.execute(
          'UPDATE wudong_m1_product SET cover = ?, images = CAST(? AS JSON) WHERE id = ?',
          [urls[0], JSON.stringify(urls), id]
        );
      }
    }
    for (const { id, url } of artisanRecords) {
      if (!DRY_RUN) {
        await conn.execute(
          "UPDATE wudong_m1_product SET artisan = JSON_SET(COALESCE(artisan, JSON_OBJECT()), '$.avatar', ?) WHERE id = ?",
          [url, id]
        );
      }
    }
  } finally {
    await conn.end();
  }
}

function appendSeedUpdates() {
  const marker = '-- ===== m1 衣模块本地图片同步（exp/local-images） =====';
  const content = fs.readFileSync(SQL_FILE, 'utf8');
  if (content.includes(marker)) {
    console.log('SQL 已含本次 m1 更新语句，跳过追加。');
    return;
  }
  const block = `\n\n${marker}\n-- 已上传至 OSS；可重复执行。\n${updatesSql()}\n`;
  if (!DRY_RUN) fs.appendFileSync(SQL_FILE, block, 'utf8');
  console.log(DRY_RUN ? '[dry-run] 将追加 m1 商品 UPDATE 到总 SQL 脚本末尾。' : '已追加 m1 商品 UPDATE 到总 SQL 脚本末尾。');
}

await upload();
await updateDatabase();
appendSeedUpdates();
