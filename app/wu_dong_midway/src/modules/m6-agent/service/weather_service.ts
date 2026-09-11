/**
 * 【m6-agent 模块】天气查询服务
 * 数据源：Open-Meteo（免密钥），按乌东村坐标查询实况与未来预报
 */
import { Provide, Logger } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';

/**
 * 乌东村坐标（贵州省雷山县丹江镇，雷公山半山腰，海拔约 1306 米）。
 * elevation 必须显式传入：Open-Meteo 的网格海拔与山谷实际海拔差 400 米左右，
 * 不订正会导致气温偏高 2-3℃。
 */
const WUDONG = {
  name: '乌东村',
  latitude: 26.39,
  longitude: 108.15,
  elevation: 1306,
};

/** WMO 天气码 → 中文描述（Open-Meteo 使用 WMO 4677 标准） */
const WEATHER_CODES: Record<number, string> = {
  0: '晴',
  1: '晴间多云',
  2: '多云',
  3: '阴',
  45: '有雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  56: '冻毛毛雨',
  57: '强冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '阵雨',
  82: '强阵雨',
  85: '小阵雪',
  86: '强阵雪',
  95: '雷阵雨',
  96: '雷阵雨伴小冰雹',
  99: '雷阵雨伴冰雹',
};

function describeWeather(code: number | undefined): string {
  if (code === undefined || code === null) return '未知';
  return WEATHER_CODES[code] || `未知天气(${code})`;
}

/** 把 ISO 日期（2026-09-12）转成"9月12日" */
function formatDate(iso: string, index: number): string {
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  const [, month, day] = iso.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

@Provide()
export class WeatherService {
  @Logger()
  logger: ILogger;

  /**
   * 查询乌东村天气，返回供 LLM 阅读的中文文本
   * @param days 预报天数，1-7，默认 3
   */
  async getWudongWeather(days = 3): Promise<string> {
    const forecastDays = Math.min(Math.max(Math.round(days) || 3, 1), 7);

    const params = new URLSearchParams({
      latitude: String(WUDONG.latitude),
      longitude: String(WUDONG.longitude),
      elevation: String(WUDONG.elevation),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Shanghai',
      forecast_days: String(forecastDays),
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`天气接口返回 ${res.status}`);
    }
    const data: any = await res.json();

    const current = data?.current;
    const daily = data?.daily;
    if (!current || !daily?.time?.length) {
      throw new Error('天气接口返回数据不完整');
    }

    const lines: string[] = [];
    lines.push(`【乌东村天气】观测时间：${String(current.time).replace('T', ' ')}（北京时间）`);
    lines.push(
      `当前实况：${describeWeather(current.weather_code)}，气温 ${current.temperature_2m}℃，` +
        `体感 ${current.apparent_temperature}℃，湿度 ${current.relative_humidity_2m}%，` +
        `风速 ${current.wind_speed_10m} km/h，降水量 ${current.precipitation} mm`
    );
    lines.push('');
    lines.push(`未来 ${daily.time.length} 天预报：`);
    for (let i = 0; i < daily.time.length; i++) {
      lines.push(
        `- ${formatDate(daily.time[i], i)}（${daily.time[i]}）：${describeWeather(daily.weather_code[i])}，` +
          `${daily.temperature_2m_min[i]}~${daily.temperature_2m_max[i]}℃，` +
          `降水概率 ${daily.precipitation_probability_max[i]}%`
      );
    }

    this.logger.info('[m6-agent] weather fetched, days=%d', forecastDays);
    return lines.join('\n');
  }
}
