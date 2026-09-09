<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head
				title="乌东文旅运营总览"
				desc="衣·非遗、食·风味、住·山居、行·山水、社区全业务经营数据一览"
			>
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日平台 GMV"
						:value="68420"
						unit="元"
						money
						icon="icon-amount"
						color="#4165d7"
						trend="+18.6%"
						desc="较昨日"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日订单数"
						:value="326"
						icon="icon-cart"
						color="#e6a23c"
						trend="+12.3%"
						desc="其中 302 单支付成功"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日新增用户"
						:value="158"
						icon="icon-user"
						color="#67c23a"
						trend="+8.7%"
						desc="较昨日 +13 人"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日活跃游客"
						:value="2364"
						icon="icon-activity"
						color="#9b59b6"
						trend="+15.2%"
						desc="近 7 日平均 1,982"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="近 30 日平台交易趋势">
						<wd-trend
							:categories="categories"
							:series="tradeSeries"
							right-name="订单量"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="各业务交易占比">
						<wd-pie :rows="moduleRows" unit="元" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="平台待办监控">
						<wd-rank :rows="todoRows" empty="暂无待办，运营状态良好" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="实时运营动态">
						<div class="wd-feeds">
							<div v-for="(feed, index) in feeds" :key="index" class="wd-feeds__item">
								<span class="time">{{ feed.time }}</span>
								<p>
									<span class="name">{{ feed.user }}</span
									>{{ feed.action }}
								</p>
							</div>
						</div>
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'overview'
});

import { computed } from 'vue';
import WdPanel from '../../components/panel.vue';
import WdStat from '../../components/stat.vue';
import WdPageHead from '../../components/head.vue';
import WdTrend from '../../components/trend.vue';
import WdPie from '../../components/pie.vue';
import WdRank from '../../components/rank.vue';
import type { WdRankRow, WdTrendSeries } from '../../components/types';
import { genTrend, recentDays } from '../../utils/demo';

const categories = recentDays(30);

const tradeSeries = computed<WdTrendSeries[]>(() => [
	{
		name: '交易金额(元)',
		data: genTrend(11, 30, 42000, 86000),
		type: 'line',
		area: true
	},
	{
		name: '交易订单(单)',
		data: genTrend(22, 30, 180, 420),
		type: 'line',
		yAxisIndex: 1,
		color: '#e6a23c'
	}
]);

const moduleRows = [
	{ name: '衣·非遗', value: 186000 },
	{ name: '住·山居', value: 152000 },
	{ name: '食·风味', value: 93000 },
	{ name: '行·山水', value: 78000 }
];

const todoRows: WdRankRow[] = [
	{
		name: '社区内容待审核',
		desc: '最早一条提交于 12 分钟前，涉及 3 篇短视频',
		value: 23,
		unit: '条',
		status: {
			label: '待处理',
			type: 'danger'
		}
	},
	{
		name: '退款申请待审批',
		desc: '衣·非遗 2 单 / 住·山居 2 单 / 行·山水 1 单',
		value: 5,
		unit: '单',
		status: {
			label: '超 4 小时',
			type: 'warning'
		}
	},
	{
		name: '非遗商品库存预警',
		desc: '库存低于 5 件的商品需要尽快补货',
		value: 8,
		unit: '款',
		status: {
			label: '预警',
			type: 'danger'
		}
	},
	{
		name: '社区举报待处理',
		desc: '其中 1 条涉及言论不当，建议优先处理',
		value: 4,
		unit: '条',
		status: {
			label: '待处理',
			type: 'warning'
		}
	},
	{
		name: '商家入驻待审核',
		desc: '平均等待 1.2 天，均在 SLA 3 天内',
		value: 2,
		unit: '家',
		status: {
			label: '审核中',
			type: 'primary'
		}
	}
];

const feeds = [
	{
		time: '10:42',
		user: '追云者',
		action: ' 预订「枕云山舍 · 云海亲子房」2 晚'
	},
	{
		time: '10:31',
		user: '麦子',
		action: ' 下单《苗寨漫游记 · 一日精华》× 2'
	},
	{
		time: '10:19',
		user: '南方有雨',
		action: ' 发布游记《在银匠巷学了一晚上掐丝》'
	},
	{
		time: '10:05',
		user: '旅人手记',
		action: ' 预订「云雾长桌宴 · 晚餐」4 人位'
	},
	{
		time: '09:47',
		user: '带娃去看山',
		action: ' 购买「手工苗银花丝手镯」并完成支付'
	}
];
</script>

<style lang="scss" scoped>
.wd-feeds {
	&__item {
		display: flex;
		align-items: flex-start;
		padding: 9px 0;
		border-bottom: 1px dashed var(--el-border-color-extra-light);

		&:last-child {
			border-bottom: 0;
		}

		.time {
			flex-shrink: 0;
			width: 46px;
			font-size: 12px;
			color: var(--el-text-color-secondary);
			font-variant-numeric: tabular-nums;
		}

		p {
			margin: 0;
			font-size: 13px;
			line-height: 1.7;
			color: var(--el-text-color-regular);
		}

		.name {
			color: var(--el-color-primary);
			font-weight: 600;
		}
	}
}
</style>
