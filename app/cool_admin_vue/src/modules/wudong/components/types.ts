// 看板共享组件类型定义

export interface WdTrendSeries {
	name: string;
	data: number[];
	color?: string;
	type?: 'line' | 'bar';
	yAxisIndex?: 0 | 1;
	area?: boolean;
}

export interface WdRankRow {
	name: string;
	value: string | number;
	unit?: string;
	desc?: string;
	trend?: string;
	trendType?: 'up' | 'down';
	status?: {
		label: string;
		type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
	};
}
