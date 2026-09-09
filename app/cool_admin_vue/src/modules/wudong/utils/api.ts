import { service } from '/@/cool';

export type DashboardScene =
	'overview' | 'heritage' | 'meal' | 'lodging' | 'travel' | 'community' | 'user';

export interface DashboardRow {
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

export interface DashboardData {
	updatedAt: string;
	stats: any[];
	trend: {
		categories: string[];
		series: {
			name: string;
			data: number[];
			type?: 'line' | 'bar';
			yAxisIndex?: 0 | 1;
			color?: string;
			area?: boolean;
		}[];
	};
	ratio: {
		unit?: string;
		rows: {
			name: string;
			value: number;
		}[];
	};
	lists: {
		title: string;
		extra?: string;
		rows: DashboardRow[];
	}[];
}

export async function getDashboardData(scene: DashboardScene): Promise<DashboardData> {
	const data = await service.request({
		url: `/admin/dashboard/stats/${scene}`,
		method: 'GET'
	});
	return data as DashboardData;
}
