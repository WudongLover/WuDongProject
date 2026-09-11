<template>
	<el-scrollbar>
		<div class="wd-dashboard">
			<wd-page-head title="社区数据看板" desc="乌东游客游记、照片、短视频内容社区运营监控">
				<el-tag type="info" effect="plain" size="small">演示数据</el-tag>
			</wd-page-head>

			<el-row :gutter="10">
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="累计游记"
						:value="2486"
						unit="篇"
						icon="icon-pic"
						color="#23456b"
						trend="+18.2%"
						desc="本月新增 412 篇"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="今日新增内容"
						:value="63"
						unit="条"
						icon="icon-camera"
						color="#67c23a"
						trend="+12.4%"
						desc="游记 41 · 动态 22"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="内容待审核"
						:value="23"
						unit="条"
						icon="icon-search"
						color="#e6a23c"
						trend="审核中"
						trend-type="down"
						desc="平均审核时长 1.8 小时"
					/>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<wd-stat
						label="举报待处理"
						:value="4"
						unit="条"
						icon="icon-warn"
						color="#f56c6c"
						trend="需跟进"
						trend-type="down"
						desc="超过 24 小时 1 条"
					/>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="14">
					<wd-panel title="近 30 日发布与互动趋势">
						<wd-trend
							:categories="categories"
							:series="trendSeries"
							right-name="互动量"
							height="320px"
						/>
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="10">
					<wd-panel title="社区内容形式构成">
						<wd-pie :rows="contentRows" unit="条" height="320px" />
					</wd-panel>
				</el-col>
			</el-row>

			<el-row :gutter="10" class="wd-row">
				<el-col :xs="24" :lg="13">
					<wd-panel title="热门话题 TOP">
						<template #extra>
							<el-text type="info" size="small">按讨论量排序</el-text>
						</template>
						<wd-rank :rows="hotRows" />
					</wd-panel>
				</el-col>

				<el-col :xs="24" :lg="11">
					<wd-panel title="审核与举报监控">
						<wd-rank :rows="warnRows" empty="暂无待办，内容生态健康" />
					</wd-panel>
				</el-col>
			</el-row>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-community'
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
		name: '新增发布(条)',
		data: genTrend(71, 30, 30, 92),
		type: 'line',
		area: true
	},
	{
		name: '点赞收藏互动(次)',
		data: genTrend(72, 30, 800, 2800),
		type: 'line',
		yAxisIndex: 1,
		color: '#e6a23c'
	}
]);

const contentRows = [
	{ name: '图文游记', value: 1860 },
	{ name: '照片打卡', value: 486 },
	{ name: '短视频', value: 140 }
];

const hotRows: WdRankRow[] = [
	{
		name: '#乌东云海',
		desc: '清晨观景台 · 苗岭晨雾',
		value: 1286,
		unit: '讨论',
		trend: '+32% 本周'
	},
	{
		name: '#苗年节',
		desc: '11 月节庆 · 盛装巡游与芦笙赛',
		value: 963,
		unit: '讨论',
		trend: '+58% 本周',
		trendType: 'up'
	},
	{
		name: '#长桌宴',
		desc: '酸汤鱼与糯米酒的正确打开方式',
		value: 874,
		unit: '讨论',
		trend: '+12% 本周'
	},
	{
		name: '#非遗手作',
		desc: '银饰、蜡染、刺绣体验打卡',
		value: 632,
		unit: '讨论',
		trend: '+8% 本周'
	},
	{
		name: '#亲子研学',
		desc: '带孩子发现苗寨的色彩',
		value: 421,
		unit: '讨论',
		trend: '+16% 本周'
	}
];

const warnRows: WdRankRow[] = [
	{
		name: '待人工复审',
		desc: '命中敏感词规则，等待管理员处理',
		value: 6,
		unit: '条',
		status: {
			label: '待复审',
			type: 'danger'
		}
	},
	{
		name: '常规内容待审核',
		desc: '最早一条等待 3.4 小时',
		value: 17,
		unit: '条',
		status: {
			label: '队列中',
			type: 'warning'
		}
	},
	{
		name: '举报待处理',
		desc: '涉及不当言论 1 条，建议优先处理',
		value: 4,
		unit: '条',
		status: {
			label: '待处理',
			type: 'warning'
		}
	},
	{
		name: '单用户高频发布',
		desc: '3 个账号接近每日 10 篇上限',
		value: 3,
		unit: '个',
		status: {
			label: '关注',
			type: 'primary'
		}
	},
	{
		name: '24 小时爆量内容',
		desc: '《凌晨五点，云海漫进了我的窗》',
		value: 1,
		unit: '条',
		status: {
			label: '可推荐',
			type: 'success'
		}
	}
];
</script>
