import { type ModuleConfig } from '/@/cool';
import './static/dashboard.scss';

export default (): ModuleConfig => {
	return {
		label: '乌东文旅数据看板',
		description: '衣·非遗 / 食·风味 / 住·山居 / 行·山水 / 社区 / 用户的运营监控看板',
		order: 1,
		enable: true
	};
};
