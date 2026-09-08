const { Bootstrap } = require('@midwayjs/bootstrap');

// 生产/预发入口：引用编译后的 dist/configuration.js
// 本地开发请使用 npm run dev（mwtsc watch + @midwayjs/mock）
Bootstrap.configure({
  // eslint-disable-next-line node/no-unpublished-require
  imports: require('./dist/configuration'),
  // 禁用依赖注入目录扫描，改由 dist/configuration 显式引入
  moduleDetector: false,
}).run();
