import * as net from 'node:net';

type RedisReply = string | null;
let warned = false;

function endpoint() {
  const raw = (process.env.REDIS_URL || '').trim();
  if (raw) {
    const url = new URL(raw);
    return { host: url.hostname, port: Number(url.port) || 6379, password: url.password ? decodeURIComponent(url.password) : process.env.REDIS_PASSWORD, database: Number(url.pathname.slice(1)) || Number(process.env.REDIS_DB) || 0 };
  }
  const host = (process.env.REDIS_HOST || '').trim();
  if (!host) return null;
  return { host, port: Number(process.env.REDIS_PORT) || 6379, password: process.env.REDIS_PASSWORD || undefined, database: Number(process.env.REDIS_DB) || 0 };
}

function command(parts: string[]): Buffer {
  const body = parts.map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join('');
  return Buffer.from(`*${parts.length}\r\n${body}`);
}

function request(parts: string[]): Promise<RedisReply> {
  const config = endpoint();
  if (!config) return Promise.resolve(null);
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: config.host, port: config.port });
    let response = Buffer.alloc(0);
    let skipReplies = (config.password ? 1 : 0) + (config.database ? 1 : 0);
    let settled = false;
    const finish = (value: RedisReply) => { if (settled) return; settled = true; socket.destroy(); resolve(value); };
    socket.setTimeout(1200, () => finish(null));
    socket.on('error', (error) => { if (!warned) { warned = true; console.warn('[Redis] unavailable, falling back to database:', error.message); } finish(null); });
    socket.on('data', (chunk) => {
      response = Buffer.concat([response, chunk]);
      const end = response.indexOf('\r\n');
      if (end < 0) return;
      const header = response.subarray(0, end).toString();
      if (header.startsWith('-')) return finish(null);
      if (header.startsWith('$')) {
        const length = Number(header.slice(1));
        if (length === -1) return finish(null);
        if (response.length < end + 2 + length + 2) return;
        const value = response.subarray(end + 2, end + 2 + length).toString();
        response = response.subarray(end + 2 + length + 2);
        if (skipReplies > 0) { skipReplies--; return; }
        finish(value);
      } else if (header.startsWith('+') || header.startsWith(':')) {
        response = response.subarray(end + 2);
        if (skipReplies > 0) { skipReplies--; return; }
        finish(header.slice(1));
      }
    });
    socket.on('connect', () => {
      const auth = config.password ? command(['AUTH', config.password]) : Buffer.alloc(0);
      const select = config.database ? command(['SELECT', String(config.database)]) : Buffer.alloc(0);
      socket.write(Buffer.concat([auth, select, command(parts)]));
    });
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try { const value = await request(['GET', key]); return value ? (JSON.parse(value) as T) : null; } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try { await request(['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]); } catch { /* cache is best effort */ }
}

export function cacheTtl(): number { return Math.max(1, Number(process.env.REDIS_CACHE_TTL) || 300); }
