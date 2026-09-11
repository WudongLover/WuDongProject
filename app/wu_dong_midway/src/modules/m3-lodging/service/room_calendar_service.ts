/**
 * 【m3-lodging 模块】房态日历：日期工具 + 缺失行补齐
 *
 * 房态按 wudong_m3_room_calendar 逐日管理（stock / price_delta / closed），金额与库存以服务端日历为准。
 * 日历行缺失（种子未覆盖的日期，或整表未初始化）时不能直接判「满房」，否则所有日期都不可订；
 * 这里按房型总库存懒创建当日行，保证「下单预占」「取消释放」仍有行可扣可回补。
 */
import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { RoomCalendarEntity } from '../entity/room_calendar_entity';
import { RoomTypeEntity } from '../entity/room_type_entity';

/** 周末加价（与前端提示、种子数据口径一致：周末上浮 ¥60） */
export const WEEKEND_PRICE_DELTA = 60;
/** C 端日历窗口：今天起 30 天 */
export const CALENDAR_WINDOW_DAYS = 30;

/** 'YYYY-MM-DD' 加 n 天，仍返回 'YYYY-MM-DD'（按本地零点计算，避免 UTC 偏移） */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 两个 'YYYY-MM-DD' 之间的天数 */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() -
      new Date(`${from}T00:00:00`).getTime()) /
      86400000,
  );
}

/** 今天（本地时区）'YYYY-MM-DD' */
export function todayStr(): string {
  const d = new Date();
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 周六 / 周日 */
export function isWeekend(dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

/** 从 from 起连续 days 天的日期序列 */
export function dateRange(from: string, days: number): string[] {
  return Array.from({ length: Math.max(0, days) }, (_, i) => addDays(from, i));
}

@Provide()
export class RoomCalendarService {
  @InjectDataSource('default')
  dataSource!: DataSource;

  /**
   * 补齐这批日期的日历行并返回：已存在的保留原值（尊重后台调整与已预占库存），
   * 缺失的按房型总库存 + 周末加价创建；唯一键 (room_type_id, date) + INSERT IGNORE 保证并发下不重复建行。
   */
  async ensure(
    em: EntityManager,
    roomType: RoomTypeEntity,
    dates: string[],
  ): Promise<RoomCalendarEntity[]> {
    if (!dates.length) return [];
    const roomTypeId = String(roomType.id);
    const exist = await em.find(RoomCalendarEntity, {
      where: { roomTypeId, date: In(dates) },
    });
    const have = new Set(exist.map((c) => c.date));
    const missing = dates.filter((d) => !have.has(d));
    if (!missing.length) return exist;

    const stock = Math.max(0, Number(roomType.stock) || 0);
    for (const date of missing) {
      await em.query(
        'INSERT IGNORE INTO wudong_m3_room_calendar (room_type_id, `date`, stock, price_delta, closed) VALUES (?, ?, ?, ?, 0)',
        [roomTypeId, date, stock, isWeekend(date) ? WEEKEND_PRICE_DELTA : 0],
      );
    }
    return em.find(RoomCalendarEntity, {
      where: { roomTypeId, date: In(dates) },
    });
  }

  /**
   * C 端房态：今天起 days 天，缺失日期先补齐再返回。
   * 与下单同源，保证前端格子的「满/价」和服务端预占、计价一致。
   */
  async window(roomTypeId: string, days = CALENDAR_WINDOW_DAYS) {
    const id = String(roomTypeId || '');
    if (!/^\d+$/.test(id)) return [];
    return this.dataSource.transaction(async (em) => {
      const roomType = await em.findOne(RoomTypeEntity, { where: { id } });
      if (!roomType) return [];
      const rows = await this.ensure(em, roomType, dateRange(todayStr(), days));
      return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
    });
  }
}
