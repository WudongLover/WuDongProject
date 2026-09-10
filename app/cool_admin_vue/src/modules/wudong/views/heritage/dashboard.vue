<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head
				title="衣·非遗数据看板"
				desc="苗族银饰、蜡染、刺绣、服饰等非遗手工艺品经营监控"
			>
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="在售非遗商品"
						:value="86"
						unit="款"
						icon="icon-goods"
						color="#4165d7"
						trend="+6"
						desc="本月新上架 4 款"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="本月销售额"
						:value="86400"
						unit="元"
						money
						icon="icon-amount"
						color="#e6a23c"
						trend="+22.4%"
						desc="环比上月"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日订单"
						:value="37"
						unit="单"
						icon="icon-cart"
						color="#67c23a"
						trend="+16.2%"
						desc="待发货 12 单"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="库存预警"
						:value="8"
						unit="款"
						icon="icon-warn"
						color="#f56c6c"
						trend="需补货"
						trend-type="down"
						desc="库存低于 5 件"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="近 30 日销售趋势">
						<wd-trend
							:categories="categories"
							:series="trendSeries"
							right-name="订单量"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="品类销售构成">
						<wd-pie :rows="categoryRows" unit="元" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="非遗商品热销榜">
						<template #extra>
							<el-text type="info" size="small">按累计销量排序</el-text>
						</template>
						<wd-rank :rows="hotRows" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="库存与履约预警">
						<wd-rank :rows="warnRows" empty="暂无预警" />
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-heritage'
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
		name: '销售额(元)',
		data: genTrend(31, 30, 52000, 96000),
		type: 'line',
		area: true
	},
	{
		name: '订单量(单)',
		data: genTrend(32, 30, 22, 78),
		type: 'line',
		yAxisIndex: 1,
		color: '#e6a23c'
	}
]);

const categoryRows = [
	{ name: '银饰', value: 62400 },
	{ name: '蜡染', value: 21800 },
	{ name: '刺绣', value: 15600 },
	{ name: '苗族服饰', value: 9800 },
	{ name: '非遗体验课', value: 4500 }
];

const hotRows: WdRankRow[] = [
	{
		name: '苗银蝴蝶妈妈耳坠',
		desc: '银饰 · 925 银 3.2g/只',
		value: 677,
		unit: '件',
		trend: '+24 本周',
		trendType: 'up'
	},
	{
		name: '靛蓝植物染方巾',
		desc: '蜡染 · 板蓝根蓝染冰裂纹',
		value: 512,
		unit: '件',
		trend: '+18 本周'
	},
	{
		name: '手工苗银花丝手镯',
		desc: '银饰 · 拉丝掐花蝶恋花纹',
		value: 231,
		unit: '件',
		trend: '+9 本周'
	},
	{
		name: '铜鼓纹蜡染桌旗',
		desc: '蜡染 · 手工点蜡 2.2m 长幅',
		value: 124,
		unit: '件',
		trend: '+5 本周'
	},
	{
		name: '破线绣双龙捧寿壁挂',
		desc: '刺绣 · 省级苗绣传承人作品',
		value: 46,
		unit: '件',
		trend: '-2 本周',
		trendType: 'down'
	}
];

const warnRows: WdRankRow[] = [
	{
		name: '破线绣双龙捧寿壁挂',
		desc: '库存低于安全线，制作周期约 30 天',
		value: 3,
		unit: '件',
		status: {
			label: '严重不足',
			type: 'danger'
		}
	},
	{
		name: '百鸟衣改良礼服 M 码',
		desc: '近 7 日售出 2 件，预计 3 天内售罄',
		value: 3,
		unit: '件',
		status: {
			label: '库存紧张',
			type: 'warning'
		}
	},
	{
		name: '手工苗银花丝手镯（大号）',
		desc: '定制款仍在制作中',
		value: 4,
		unit: '件',
		status: {
			label: '补货中',
			type: 'warning'
		}
	},
	{
		name: '待发货订单',
		desc: '最早一笔等待 8 小时，建议今日发出',
		value: 12,
		unit: '单',
		status: {
			label: '履约中',
			type: 'primary'
		}
	},
	{
		name: '近 7 日退款申请',
		desc: '无异常批量退款，理由多为尺寸调整',
		value: 3,
		unit: '单',
		status: {
			label: '正常',
			type: 'success'
		}
	}
];
</script>
