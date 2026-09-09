import dayjs from 'dayjs';

/**
 * 看板演示数据工具。
 * 数据源尚未接入后端统计接口，先用稳定的种子数据占位；
 * 联调时把各看板中的数据替换为 service 请求即可。
 */

// 简单可复现的伪随机数，避免每次刷新页面图表跳动
export function seedRandom(seed: number) {
	let s = seed >>> 0;

	return function () {
		s += 0x6d2b79f5;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// 生成一条带轻微波动、趋势稳定的曲线
export function genTrend(
	seed: number,
	count: number,
	min: number,
	max: number,
	decimals = 0
): number[] {
	const rand = seedRandom(seed);
	const wave = (max - min) / 6;
	const base = min + (max - min) / 2;
	const list: number[] = [];

	for (let i = 0; i < count; i++) {
		const cycle = Math.sin((i / (count - 1)) * Math.PI * 2.2) * wave;
		const drift = (rand() - 0.45) * wave;
		const v = Math.min(max, Math.max(min, base + cycle + drift));
		list.push(decimals ? Number(v.toFixed(decimals)) : Math.round(v));
	}

	return list;
}

// 近 n 天日期，如 ['08-11', '08-12', ...]
export function recentDays(n: number, format = 'MM-DD'): string[] {
	return Array.from({ length: n }, (_, i) =>
		dayjs()
			.subtract(n - 1 - i, 'day')
			.format(format)
	);
}

// 未来 n 天日期
export function futureDays(n: number, format = 'MM-DD'): string[] {
	return Array.from({ length: n }, (_, i) =>
		dayjs()
			.add(i + 1, 'day')
			.format(format)
	);
}

// 格式化金额
export function money(value: number | string): string {
	return Number(value).toLocaleString('zh-CN', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	});
}

// 格式化普通数字
export function number(value: number | string): string {
	return Number(value).toLocaleString('zh-CN');
}
