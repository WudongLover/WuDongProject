<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head title="行·山水数据看板" desc="景区门票、苗寨游路线套餐与电子票核销监控">
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="合作景区"
						:value="4"
						unit="个"
						icon="icon-map"
						color="#23456b"
						trend="+1"
						desc="乌东 / 雷公山等"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="在售票种与路线"
						:value="13"
						unit="种"
						icon="icon-vip"
						color="#e6a23c"
						trend="+2"
						desc="票种 9 · 路线套餐 4"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="本月出票量"
						:value="1248"
						unit="张"
						icon="icon-rank"
						color="#67c23a"
						trend="+28.5%"
						desc="门票 896 · 路线 352"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日待核销"
						:value="18"
						unit="张"
						icon="icon-warn"
						color="#f56c6c"
						trend="已核销 76"
						trend-type="down"
						desc="核销率 80.9%"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="近 30 日票务销售趋势">
						<wd-trend
							:categories="categories"
							:series="trendSeries"
							right-name="路线预订"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="票种收入构成">
						<wd-pie :rows="ticketRows" unit="元" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="热门景区与路线">
						<template #extra>
							<el-text type="info" size="small">按本月销量排序</el-text>
						</template>
						<wd-rank :rows="hotRows" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="票务预警与核销提醒">
						<wd-rank :rows="warnRows" empty="暂无预警" />
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-travel'
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

const categories = recentDays(30);

const trendSeries = computed<WdTrendSeries[]>(() => [
	{
		name: '出票量(张)',
		data: genTrend(61, 30, 28, 88),
		type: 'line',
		area: true
	},
	{
		name: '路线预订(单)',
		data: genTrend(62, 30, 3, 19),
		type: 'line',
		yAxisIndex: 1,
		color: '#67c23a'
	}
]);

const ticketRows = [
	{ name: '景区成人票', value: 48600 },
	{ name: '家庭套票', value: 26800 },
	{ name: '苗寨游路线套餐', value: 38200 },
	{ name: '学生 / 儿童票', value: 9600 },
	{ name: '含观光车套票', value: 13800 }
];

const hotRows: WdRankRow[] = [
	{
		name: '乌东苗寨景区 · 成人票',
		desc: '含芦笙场迎宾仪式',
		value: 486,
		unit: '张',
		trend: '+18% 本月'
	},
	{
		name: '苗寨漫游记 · 一日精华',
		desc: '入寨仪式 + 匠人工坊 + 长桌宴',
		value: 226,
		unit: '单',
		trend: '+32% 本月',
		trendType: 'up'
	},
	{
		name: '雷公山国家森林公园',
		desc: '成人票（含观光车）',
		value: 186,
		unit: '张',
		trend: '+9% 本月'
	},
	{
		name: '小摄影师的苗寨 · 亲子研学',
		desc: '亲子家庭热门，周末场次售罄较快',
		value: 86,
		unit: '单',
		trend: '+21% 本月'
	}
];

const warnRows: WdRankRow[] = [
	{
		name: '家庭套票未来 3 日库存',
		desc: '乌东苗寨景区周末场仅余少量',
		value: 18,
		unit: '张',
		status: {
			label: '库存紧张',
			type: 'danger'
		}
	},
	{
		name: '今日待核销电子票',
		desc: '最早一张将在 12:00 后失效',
		value: 18,
		unit: '张',
		status: {
			label: '待核销',
			type: 'warning'
		}
	},
	{
		name: '退票申请待审批',
		desc: '均在用票日前 24 小时外提交',
		value: 3,
		unit: '单',
		status: {
			label: '待审批',
			type: 'warning'
		}
	},
	{
		name: '亲子研学周末余位',
		desc: '本周六仅剩 3 个儿童名额',
		value: 3,
		unit: '位',
		status: {
			label: '即将售罄',
			type: 'danger'
		}
	}
];
</script>
