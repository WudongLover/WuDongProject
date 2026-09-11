<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head
				title="食·风味数据看板"
				desc="苗家长桌宴、餐厅餐位预订与农产品特产的经营监控"
			>
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="合作餐厅"
						:value="18"
						unit="家"
						icon="icon-hot"
						color="#e6a23c"
						trend="+2"
						desc="本月新入驻 1 家"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日餐位预订"
						:value="46"
						unit="桌"
						icon="icon-tag"
						color="#23456b"
						trend="+9.5%"
						desc="全天可订 120 桌"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="特产本月销售额"
						:value="32800"
						unit="元"
						money
						icon="icon-amount"
						color="#67c23a"
						trend="+14.6%"
						desc="环比上月"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="待确认预订"
						:value="5"
						unit="单"
						icon="icon-warn"
						color="#f56c6c"
						trend="需跟进"
						trend-type="down"
						desc="最早一笔等待 35 分钟"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="近 14 日餐位预订与特产销售趋势">
						<wd-trend
							:categories="categories"
							:series="trendSeries"
							right-name="特产销售额"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="用餐时段预订占比">
						<wd-pie :rows="slotRows" unit="桌" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="热门餐厅排行">
						<template #extra>
							<el-text type="info" size="small">按今日预订量排序</el-text>
						</template>
						<wd-rank :rows="hotRows" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="餐段余量与预订提醒">
						<wd-rank :rows="warnRows" empty="暂无预警" />
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-meal'
});

import { computed } from 'vue';
import WdPageHead from '../../components/head.vue';
import WdStat from '../../components/stat.vue';
import WdPanel from '../../components/panel.vue';
import WdTrend from '../../components/trend.vue';
import WdPie from '../../components/pie.vue';
import WdRank from '../../components/rank.vue';
import type { WdRankRow, WdTrendSeries } from '../../components/types';
import { genTrend, recentDays } from '../../utils/demo';

const categories = recentDays(14);

const trendSeries = computed<WdTrendSeries[]>(() => [
	{
		name: '餐位预订(桌)',
		data: genTrend(41, 14, 24, 62),
		type: 'line',
		area: true
	},
	{
		name: '特产销售额(元)',
		data: genTrend(42, 14, 800, 2600),
		type: 'line',
		yAxisIndex: 1,
		color: '#67c23a'
	}
]);

const slotRows = [
	{ name: '晚餐 17:30-19:30', value: 236 },
	{ name: '午餐 11:30-13:30', value: 182 },
	{ name: '夜场 / 晚宴', value: 88 },
	{ name: '下午茶', value: 46 }
];

const hotRows: WdRankRow[] = [
	{
		name: '云雾长桌宴',
		desc: '评分 4.9 · 距乌东寨口 300m',
		value: 34,
		unit: '桌',
		trend: '+12 今日',
		trendType: 'up'
	},
	{
		name: '阿婆火塘',
		desc: '评分 4.8 · 火塘夜场人气最高',
		value: 18,
		unit: '桌',
		trend: '+6 今日'
	},
	{
		name: '梯田人家',
		desc: '评分 4.7 · 梯田景观位',
		value: 16,
		unit: '桌',
		trend: '+3 今日'
	},
	{
		name: '锦鸡轩茶餐',
		desc: '评分 4.6 · 雷公山银球茶特色',
		value: 12,
		unit: '桌',
		trend: '+1 今日'
	}
];

const warnRows: WdRankRow[] = [
	{
		name: '云雾长桌宴 · 晚餐',
		desc: '17:30-19:30 场次，距离开始约 4 小时',
		value: 4,
		unit: '位',
		status: {
			label: '余量不足',
			type: 'danger'
		}
	},
	{
		name: '阿婆火塘 · 夜场 19:00',
		desc: '烤五花与糯米酒备货请同步确认',
		value: 3,
		unit: '位',
		status: {
			label: '余量不足',
			type: 'danger'
		}
	},
	{
		name: '云雾长桌宴 · 午餐',
		desc: '11:30 场次余量低于全天半数',
		value: 12,
		unit: '位',
		status: {
			label: '余量偏低',
			type: 'warning'
		}
	},
	{
		name: '待确认餐位预订',
		desc: '需餐厅确认，超时未处理将自动取消',
		value: 5,
		unit: '单',
		status: {
			label: '待处理',
			type: 'primary'
		}
	},
	{
		name: '今日预订取消',
		desc: '均为免费取消窗口期内取消',
		value: 3,
		unit: '单',
		status: {
			label: '正常',
			type: 'success'
		}
	}
];
</script>
