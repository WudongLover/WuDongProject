<template>
	<el-scrollbar>
		<div v-loading="loading" class="wd-dashboard">
			<wd-page-head :title="title" :desc="desc">
				<el-tag v-if="data" type="success" effect="plain" size="small">
					数据库数据 · {{ data.updatedAt }}
				</el-tag>
				<el-tag v-else-if="error" type="danger" effect="plain" size="small">
					接口加载失败
				</el-tag>
				<el-tag v-else type="info" effect="plain" size="small">加载中</el-tag>
			</wd-page-head>

			<el-result
				v-if="!data && !loading"
				icon="warning"
				title="统计数据加载失败"
				:sub-title="error"
			>
				<template #extra>
					<el-button type="primary" @click="load">重新加载</el-button>
				</template>
			</el-result>

			<template v-if="data">
				<el-row :gutter="10">
					<el-col
						v-for="(stat, index) in data.stats"
						:key="index"
						:xs="24"
						:sm="12"
						:md="6"
					>
						<wd-stat v-bind="stat" />
					</el-col>
				</el-row>

				<el-row :gutter="10" class="wd-row">
					<el-col :xs="24" :lg="14">
						<wd-panel title="数据趋势">
							<wd-trend
								:categories="data.trend.categories"
								:series="data.trend.series"
								:right-name="rightName"
								height="320px"
							/>
						</wd-panel>
					</el-col>

					<el-col :xs="24" :lg="10">
						<wd-panel title="构成分析">
							<wd-pie
								:rows="data.ratio.rows"
								:unit="data.ratio.unit"
								height="320px"
							/>
						</wd-panel>
					</el-col>
				</el-row>

				<el-row v-if="data.lists.length" :gutter="10" class="wd-row">
					<el-col
						v-for="(list, index) in data.lists"
						:key="index"
						:xs="24"
						:lg="data.lists.length === 1 ? 24 : 12"
					>
						<wd-panel :title="list.title">
							<template v-if="list.extra" #extra>
								<el-text type="info" size="small">{{ list.extra }}</el-text>
							</template>
							<wd-rank :rows="list.rows" />
						</wd-panel>
					</el-col>
				</el-row>
			</template>
		</div>
	</el-scrollbar>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import WdPageHead from './head.vue';
import WdStat from './stat.vue';
import WdPanel from './panel.vue';
import WdTrend from './trend.vue';
import WdPie from './pie.vue';
import WdRank from './rank.vue';
import { getDashboardData, type DashboardData, type DashboardScene } from '../utils/api';

defineOptions({
	name: 'scene-dashboard'
});

const props = withDefaults(
	defineProps<{
		scene: DashboardScene;
		title: string;
		desc?: string;
	}>(),
	{
		desc: ''
	}
);

const data = ref<DashboardData | null>(null);
const loading = ref(false);
const error = ref('');

const rightName = computed(() => {
	return data.value?.trend.series.find(e => e.yAxisIndex === 1)?.name || '';
});

async function load() {
	loading.value = true;
	error.value = '';

	try {
		data.value = await getDashboardData(props.scene);
	} catch (err: any) {
		data.value = null;
		error.value = err?.message || '请确认管理端后端已启动';
	} finally {
		loading.value = false;
	}
}

onMounted(() => {
	load();
});
</script>
