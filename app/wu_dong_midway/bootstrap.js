const { Bootstrap } = require('@midwayjs/bootstrap');

// 生产/预发入口：引用编译后的 dist/configuration.js
// 本地开发请使用 npm run dev（mwtsc watch + @midwayjs/mock）
Bootstrap.configure({
  // eslint-disable-next-line node/no-unpublished-require
  imports: require('./dist/configuration'),
  // 保持默认的依赖注入目录扫描（baseDir=dist）：
  // useMiddleware/useFilter/@Inject 都依赖容器中已注册的 @Provide 类定义，
  // 若设 moduleDetector:false 关闭扫描，所有请求会因
  // MidwayDefinitionNotFoundError（如 RequestLogMiddleware is not valid）而 500
}).run();
