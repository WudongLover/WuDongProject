<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head title="住·山居数据看板" desc="苗寨特色民宿、房态日历与入住经营监控">
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="在营民宿"
						:value="8"
						unit="家"
						icon="icon-home"
						color="#23456b"
						trend="+1"
						desc="本月新开业 1 家"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="在租房型"
						:value="26"
						unit="种"
						icon="icon-design"
						color="#e6a23c"
						trend="+2"
						desc="本月新增 2 种房型"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日入住"
						:value="63"
						unit="间"
						icon="icon-local"
						color="#67c23a"
						trend="+11.2%"
						desc="明日预离 28 间"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今夜入住率"
						:value="82"
						unit="%"
						icon="icon-rank"
						color="#b5442e"
						trend="+6.4%"
						desc="较上周同期"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="未来 14 天预订间夜与平均房价">
						<wd-trend
							:categories="categories"
							:series="trendSeries"
							right-name="平均房价"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="房型价位带分布">
						<wd-pie :rows="priceRows" unit="间" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="民宿入住率排行">
						<template #extra>
							<el-text type="info" size="small">按近 7 日入住率排序</el-text>
						</template>
						<wd-rank :rows="hotRows" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="房态与预订提醒">
						<wd-rank :rows="warnRows" empty="暂无预警" />
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-lodging'
});

import { computed } from 'vue';
import WdPageHead from '../../components/head.vue';
import WdStat from '../../components/stat.vue';
import WdPanel from '../../components/panel.vue';
import WdTrend from '../../components/trend.vue';
import WdPie from '../../components/pie.vue';
import WdRank from '../../components/rank.vue';
import type { WdRankRow, WdTrendSeries } from '../../components/types';
import { futureDays, genTrend } from '../../utils/demo';

const categories = futureDays(14);

const trendSeries = computed<WdTrendSeries[]>(() => [
	{
		name: '预订间夜(间)',
		data: genTrend(51, 14, 38, 96),
		type: 'bar',
		color: '#23456b'
	},
	{
		name: '平均房价(元)',
		data: genTrend(52, 14, 420, 760, 1),
		type: 'line',
		yAxisIndex: 1,
		color: '#e6a23c'
	}
]);

const priceRows = [
	{ name: '舒适带 400-700 元', value: 182 },
	{ name: '经济带 400 元以下', value: 76 },
	{ name: '高端带 700 元以上', value: 98 }
];

const hotRows: WdRankRow[] = [
	{
		name: '枕云山舍',
		desc: '苗族木屋大床房 / 云海亲子房',
		value: 92,
		unit: '%',
		trend: '+8.2%',
		trendType: 'up'
	},
	{
		name: '银匠世家客栈',
		desc: '花丝主题房 · 非遗体验联动',
		value: 88,
		unit: '%',
		trend: '+5.6%'
	},
	{
		name: '稻田畔的院子',
		desc: '稻香家庭套房 / 蛙声标间',
		value: 84,
		unit: '%',
		trend: '+3.1%'
	},
	{
		name: '雾里 · 悬廊民宿',
		desc: '松雾全景大床房',
		value: 80,
		unit: '%',
		trend: '-2.4%',
		trendType: 'down'
	}
];

const warnRows: WdRankRow[] = [
	{
		name: '明日退房高峰',
		desc: '涉及 4 家民宿，退房集中在 9:00-11:00',
		value: 28,
		unit: '间',
		status: {
			label: '需安排保洁',
			type: 'warning'
		}
	},
	{
		name: '待确认预订',
		desc: '最早一笔等待 1.2 小时',
		value: 6,
		unit: '单',
		status: {
			label: '待处理',
			type: 'primary'
		}
	},
	{
		name: '下周三空置预警',
		desc: '雾里·悬廊民宿该日空置率预计 65%',
		value: 65,
		unit: '%',
		status: {
			label: '空置偏高',
			type: 'warning'
		}
	},
	{
		name: '入住人证件待补录',
		desc: '明日入住订单缺少身份证件信息',
		value: 4,
		unit: '单',
		status: {
			label: '待补充',
			type: 'danger'
		}
	},
	{
		name: '待退款申请',
		desc: '1 单在免费取消期内，1 单需人工审核',
		value: 2,
		unit: '单',
		status: {
			label: '待审批',
			type: 'warning'
		}
	}
];
</script>
