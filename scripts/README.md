用于放置一些脚本文件,如数据库迁移脚本,测试脚本等

## oss/migrate-images-to-oss.mjs —— 存量照片迁移到阿里云 OSS

把前端 `app/wu_dong_vue/public/images/**` 上传到 OSS，并把数据库里的图片字段统一改写为 OSS 访问地址。

```bash
# 1. 先在 app/cool-admin-midway/.env（或 app/wu_dong_midway/.env）填写 OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET
# 2. 预演（只打印计划，不写 OSS、不改库；此时可只填 OSS_REGION + OSS_BUCKET）
node scripts/oss/migrate-images-to-oss.mjs --dry-run
# 3. 正式执行
node scripts/oss/migrate-images-to-oss.mjs
```

说明：

- 上传：88 张本地图 → `{OSS_PREFIX}/images/<原文件名>`，`headObject` 已存在即跳过，`--force` 可重传；脚本位于 `scripts/`，依赖从 `app/cool-admin-midway` 的 node_modules 解析。
- 改写：`/images/x.jpg` 与命中 `src/mock/image-map.ts` 的文生图外链 → OSS 地址；已是 OSS 地址的值原样保留，脚本可重复执行（幂等）。
- 覆盖 `cool` 与 `wudong` 两个库中实际存在的图片字段（用户头像、Banner、推文封面、评价晒图、购物车/订单快照封面、商品/餐厅/民宿/门票/路线/社区配图）。
- 输出会列出两类需人工确认的值：本地文件缺失（保持原值）、外链未命中 `image-map.ts`（保持原值，主要是若干种子用户头像，暂无对应本地图，补图后重跑即可）。
- 其它参数：`--only=upload` / `--only=db` 分步执行，`--database=wudong,cool` 限定库。
