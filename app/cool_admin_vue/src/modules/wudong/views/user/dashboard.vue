<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head title="用户数据看板" desc="C 端游客注册、活跃、来源与账号安全监控">
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="累计注册用户"
						:value="12648"
						icon="icon-user"
						color="#23456b"
						trend="+4.2%"
						desc="本月新增 486 人"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日新增用户"
						:value="158"
						icon="icon-activity"
						color="#67c23a"
						trend="+8.7%"
						desc="较昨日 +13 人"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="近 7 日活跃用户"
						:value="3860"
						icon="icon-local"
						color="#e6a23c"
						trend="+15.6%"
						desc="日均活跃 2,164"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="7 日复访率"
						:value="46.2"
						unit="%"
						icon="icon-time"
						color="#b5442e"
						trend="+3.4%"
						desc="留存表现良好"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="近 30 日新增与活跃趋势">
						<wd-trend
							:categories="categories"
							:series="trendSeries"
							right-name="活跃用户"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="登录方式构成">
						<wd-pie :rows="sourceRows" unit="人" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="最新注册用户">
						<template #extra>
							<el-button link type="primary" size="small" @click="toList">
								前往用户列表
							</el-button>
						</template>
						<wd-rank :rows="newRows" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="账号安全与待办">
						<wd-rank :rows="warnRows" empty="暂无异常，账号状态健康" />
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-user'
});

import { computed } from 'vue';
import { useCool } from '/@/cool';
import WdPageHead from '../../components/head.vue';
import WdStat from '../../components/stat.vue';
import WdPanel from '../../components/panel.vue';
import WdTrend from '../../components/trend.vue';
import WdPie from '../../components/pie.vue';
import WdRank from '../../components/rank.vue';
import type { WdRankRow, WdTrendSeries } from '../../components/types';
import { genTrend, recentDays } from '../../utils/demo';

const { router } = useCool();

const categories = recentDays(30);

const trendSeries = computed<WdTrendSeries[]>(() => [
	{
		name: '新增用户(人)',
		data: genTrend(81, 30, 60, 220),
		type: 'line',
		area: true
	},
	{
		name: '活跃用户(人)',
		data: genTrend(82, 30, 1200, 2800),
		type: 'line',
		yAxisIndex: 1,
		color: '#e6a23c'
	}
]);

const sourceRows = [
	{ name: '微信小程序', value: 7820 },
	{ name: 'H5 网页', value: 3164 },
	{ name: '微信公众号', value: 1664 }
];

const newRows: WdRankRow[] = [
	{
		name: '山月不知',
		desc: 'H5 · 注册后收藏 2 款非遗商品',
		value: '09-09 10:32',
		status: {
			label: '正常',
			type: 'success'
		}
	},
	{
		name: '带娃去看山',
		desc: '小程序 · 浏览亲子研学路线',
		value: '09-09 09:58',
		status: {
			label: '正常',
			type: 'success'
		}
	},
	{
		name: '南方有雨',
		desc: '公众号 · 领新人礼包并加入社区',
		value: '09-09 09:12',
		status: {
			label: '正常',
			type: 'success'
		}
	},
	{
		name: '追云者',
		desc: 'H5 · 注册 30 分钟内完成民宿预订',
		value: '09-09 08:36',
		status: {
			label: '高意向',
			type: 'warning'
		}
	}
];

const warnRows: WdRankRow[] = [
	{
		name: '账号注销申请',
		desc: '资料导出确认后进入 7 天冷静期',
		value: 3,
		unit: '个',
		status: {
			label: '待处理',
			type: 'warning'
		}
	},
	{
		name: '疑似异常登录',
		desc: '同账号短时间内多地登录',
		value: 2,
		unit: '个',
		status: {
			label: '待核验',
			type: 'danger'
		}
	},
	{
		name: '用户投诉 / 反馈',
		desc: '与餐位预订取消规则相关',
		value: 5,
		unit: '条',
		status: {
			label: '待回复',
			type: 'warning'
		}
	},
	{
		name: '敏感词触发次数 > 3',
		desc: '已自动禁言 24 小时',
		value: 1,
		unit: '个',
		status: {
			label: '已禁言',
			type: 'danger'
		}
	}
];

function toList() {
	router.push('/user/list');
}
</script>
