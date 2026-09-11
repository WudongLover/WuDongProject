import { MidwayConfig, MidwayAppInfo } from '@midwayjs/core';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const keys = 'wu_dong_midway_key';

export const cors = {
  allowMethods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  origin: '*',
};

export const mongoose = {
  clients: {
    wudong: {
      uri: 'mongodb://localhost:27017/wudong',
      options: {},
    },
  },
};

export const redis = {
  clients: {
    session: {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
    },
    cache: {
      host: '127.0.0.1',
      port: 6379,
      db: 1,
    },
    queue: {
      host: '127.0.0.1',
      port: 6379,
      db: 2,
    },
  },
};

export const midwayFeature = {
  replaceModule: {
    '@midwayjs/session': {
      useModule: require.resolve('../lib/session/sessionManager.js'),
    },
  },
};

export const jwt = {
  secret: process.env.JWT_SECRET || 'wudong-jwt-secret-key',
  expiresIn: '2h',
};

export const httpProxy = {
  '/api/mock': {
    target: 'http://127.0.0.1:6666',
    changeOrigin: true,
  },
  '/api/ws': {
    target: 'ws://127.0.0.1:6666',
    ws: true,
  },
};

export const koaBody = {
  multipart: true,
  formidable: {
    uploadDir: path.join(__dirname, '../../uploads'),
    keepExtensions: true,
    maxFileSize: 200 * 1024 * 1024,
  },
};

export const view: MidwayConfig['view'] = {
  root: path.join(__dirname, '../views'),
  localsShape: {
    extend: (ctx, locals) => locals,
  },
  defaultExtension: '.html',
  mapping: {
    '.html': 'nunjucks',
  },
};

export const loggers = {
  midwayLogger: {
    default: {
      file: 'logs/wudong.log',
      level: process.env.LOG_LEVEL || 'info',
      format: (info: { ctx?: any; level: string; message: string; args: any[] }) => {
        const ctx = info.ctx;
        const requestInfo = ctx
          ? {
              method: ctx.method,
              url: ctx.url,
              ip: ctx.get('X-Real-IP') || ctx.ip,
              userId: ctx.state?.user?.userId || '-',
              requestId: ctx.get('X-Request-ID') || '-',
            }
          : {};

        return JSON.stringify({
          timestamp: new Date().toISOString(),
          level: info.level,
          message: info.message,
          args: info.args,
          ...requestInfo,
        });
      },
    },
  },
};

export const validation = {
  validation: true,
  validationOptions: {
    forbidNonWhitelisted: false,
    stopAtFirstError: true,
    whitelist: true,
  },
};

export const typeorm: MidwayConfig['typeorm'] = {
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'wudong',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: '+08:00',
  entities: ['src/modules/**/entity/*{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  subscribers: ['src/subscribers/*{.ts,.js}'],
};

export const queue = {
  defaultQueue: {
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 2,
    },
    prefix: 'wudong:queue',
  },
};

export const upload = {
  tmpDir: path.join(__dirname, '../../uploads/tmp'),
  targetDir: path.join(__dirname, '../../uploads/files'),
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSize: 10 * 1024 * 1024,
};

export const cache = {
  store: 'redis',
  redis: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
  },
  prefix: 'wudong:cache:',
  ttl: 3600,
};
