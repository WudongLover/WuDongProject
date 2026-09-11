<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<cl-search ref="Search" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table" />
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert" />

		<!-- 景点详情弹窗 -->
		<el-dialog v-model="detailVisible" width="820px" destroy-on-close :show-close="false" class="detail-dialog">
			<template v-if="detailItem">
				<!-- 顶部 Banner -->
				<div class="detail-banner detail-banner--travel">
					<div class="detail-banner__main">
						<div class="detail-banner__tag">
							<el-tag size="small" effect="dark" :type="detailItem.status === 'ENABLED' ? 'success' : 'info'">
								{{ detailItem.status === 'ENABLED' ? '开放中' : '已关闭' }}
							</el-tag>
							<el-tag size="small" effect="plain" type="primary">山水胜景</el-tag>
						</div>
						<h2 class="detail-banner__title">{{ detailItem.name }}</h2>
						<p class="detail-banner__subtitle">
							<el-icon><Location /></el-icon>
							{{ detailItem.address }}
						</p>
					</div>
					<div class="detail-banner__price">
						<span class="detail-banner__price-label">评分</span>
						<span class="detail-banner__price-value">{{ detailItem.rating }}</span>
					</div>
				</div>

				<!-- 数据概览 -->
				<div class="detail-stats">
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--yellow">⭐</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.rating }}</span>
							<span class="detail-stats__label">用户评分</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--green">🕐</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value detail-stats__value--sm">{{ detailItem.openTime || '全天开放' }}</span>
							<span class="detail-stats__label">开放时间</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--blue">📍</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value detail-stats__value--sm">{{ detailItem.address }}</span>
							<span class="detail-stats__label">详细地址</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--orange">🆔</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">#{{ detailItem.id }}</span>
							<span class="detail-stats__label">景点编号</span>
						</div>
					</div>
				</div>

				<!-- 内容卡片区域 -->
				<div class="detail-content">
					<div v-if="detailItem.intro" class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon">🏞️</span>
							<span class="detail-card__title">景点介绍</span>
						</div>
						<div class="detail-card__body">
							<p>{{ detailItem.intro }}</p>
						</div>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="detail-footer">
					<el-button size="large" @click="detailVisible = false">关闭</el-button>
					<el-button size="large" type="primary" @click="editItem">
						<el-icon><Edit /></el-icon>
						编辑景点
					</el-button>
				</div>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-travel-manage'
});

import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Location, Edit } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';

// ==================== 类型定义 ====================
type ScenicStatus = 'ENABLED' | 'DISABLED';

interface ScenicItem {
	id: string;
	name: string;
	cover: string;
	openTime: string;
	address: string;
	intro: string | null;
	rating: number;
	status: ScenicStatus;
	createdAt: string;
}

// ==================== Mock 数据层 ====================
const mockDB = reactive<ScenicItem[]>(generateMockScenics());

function generateMockScenics(): ScenicItem[] {
	const names = ['乌东云海观景台', '苗寨古楼群', '梯田徒步路线', '芦笙场', '银饰作坊体验区', '蜡染工坊', '鼓楼夜景打卡点', '苗年节主会场', '山间瀑布', '星空观测点'];
	const addresses = ['苗寨东侧山顶', '苗寨中心区域', '苗寨南侧梯田区', '苗寨中心广场', '银饰街12号', '蜡染巷8号', '鼓楼广场', '苗寨北门大广场', '苗寨西侧山谷', '苗寨后山山顶'];
	const openTimes = ['05:00 - 19:00', '08:00 - 22:00', '06:00 - 18:00', '09:00 - 21:00', '09:00 - 18:00', '09:00 - 17:30', '18:00 - 23:00', '节日期间全天', '07:00 - 17:00', '19:00 - 05:00'];
	const intros = [
		'乌东云海观景台位于苗寨东侧山顶，海拔1200米，是观赏云海日出的最佳位置。清晨五点，云海在脚下翻涌，远处的苗寨若隐若现，宛如仙境。',
		'苗寨古楼群保存了完整的苗族传统建筑，包括鼓楼、风雨桥、吊脚楼等。每栋建筑都有上百年历史，是研究苗族建筑文化的活化石。',
		'梯田徒步路线全长约5公里，沿途经过层层叠叠的梯田，春季灌水如镜，秋季金黄一片。路线难度适中，适合亲子徒步。'
	];
	const statuses: ScenicStatus[] = ['ENABLED', 'ENABLED', 'ENABLED', 'ENABLED', 'ENABLED', 'DISABLED'];

	const list: ScenicItem[] = [];
	for (let i = 1; i <= 18; i++) {
		const d = new Date(Date.now() - i * 3600 * 1000 * 30);
		list.push({
			id: String(5000 + i),
			name: names[i % names.length],
			cover: '',
			openTime: openTimes[i % openTimes.length],
			address: addresses[i % addresses.length],
			intro: intros[i % intros.length],
			rating: Math.round((4.0 + Math.random()) * 10) / 10,
			status: statuses[i % statuses.length],
			createdAt: d.toISOString()
		});
	}
	return list;
}

const mockService = {
	async page(data: { page: number; size: number; name?: string; status?: ScenicStatus }) {
		let rows = [...mockDB];
		if (data.name) rows = rows.filter(r => r.name.includes(data.name!));
		if (data.status) rows = rows.filter(r => r.status === data.status);
		const total = rows.length;
		const start = (data.page - 1) * data.size;
		return {
			list: rows.slice(start, start + data.size),
			pagination: { page: data.page, size: data.size, total }
		};
	},
	async info(params: { id: string }) {
		return mockDB.find(r => r.id === params.id) || null;
	},
	async update(data: Partial<ScenicItem> & { id: string }) {
		const idx = mockDB.findIndex(r => r.id === data.id);
		if (idx >= 0) mockDB[idx] = { ...mockDB[idx], ...data };
		return true;
	},
	async delete(data: { ids: string[] }) {
		for (const id of data.ids) {
			const idx = mockDB.findIndex(r => r.id === id);
			if (idx >= 0) mockDB.splice(idx, 1);
		}
		return true;
	},
	async add(data: Partial<ScenicItem>) {
		const id = String(Math.max(...mockDB.map(r => Number(r.id))) + 1);
		const now = new Date().toISOString();
		mockDB.unshift({
			id,
			name: data.name || '',
			cover: data.cover || '',
			openTime: data.openTime || '',
			address: data.address || '',
			intro: data.intro || null,
			rating: data.rating || 5.0,
			status: 'ENABLED',
			createdAt: now
		});
		return true;
	}
};

// ==================== 字典 ====================
const statusOptions = [
	{ label: '开放中', value: 'ENABLED', type: 'success' },
	{ label: '已关闭', value: 'DISABLED', type: 'info' }
];

// ==================== 详情弹窗 ====================
const detailVisible = ref(false);
const detailItem = ref<ScenicItem | null>(null);

function formatTime(iso: string) {
	if (!iso) return '-';
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function viewDetail(id: string) {
	detailItem.value = await mockService.info({ id });
	detailVisible.value = true;
}

function editItem() {
	if (detailItem.value) {
		detailVisible.value = false;
		Crud.value?.rowEdit(detailItem.value);
	}
}

// ==================== cl-table ====================
const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: 'ID', prop: 'id', width: 80 },
		{ label: '景点名称', prop: 'name', minWidth: 200, showOverflowTooltip: true },
		{ label: '评分', prop: 'rating', width: 80, sortable: true },
		{ label: '开放时间', prop: 'openTime', width: 160 },
		{ label: '地址', prop: 'address', minWidth: 200, showOverflowTooltip: true },
		{ label: '状态', prop: 'status', width: 100, dict: statusOptions },
		{
			label: '创建时间',
			prop: 'createdAt',
			width: 120,
			sortable: 'desc',
			component: {
				name: 'el-text',
				props: { size: 'small' },
				valuePrepare: (row: ScenicItem) => formatTime(row.createdAt)
			}
		},
		{
			label: '操作',
			type: 'op',
			width: 180,
			buttons: [
				{
					label: '详情',
					type: 'primary',
					text: true,
					onClick: ({ scope }: { scope: { row: ScenicItem } }) => viewDetail(scope.row.id)
				},
				{
					label: '编辑',
					type: 'primary',
					text: true,
					onClick: ({ scope }: { scope: { row: ScenicItem } }) =>
						Crud.value?.rowEdit(scope.row)
				},
				{
					label: '删除',
					type: 'danger',
					text: true,
					confirm: '确认删除该景点？删除后不可恢复。'
				}
			]
		}
	]
});

// ==================== cl-upsert ====================
const Upsert = useUpsert({
	items: [
		{ prop: 'name', label: '景点名称', component: { name: 'el-input' }, required: true },
		{ prop: 'cover', label: '封面图', component: { name: 'cl-upload' } },
		{ prop: 'rating', label: '评分', value: 5.0, component: { name: 'el-input-number', props: { min: 0, max: 5, precision: 1 } } },
		{ prop: 'openTime', label: '开放时间', component: { name: 'el-input', props: { placeholder: '如 08:00 - 18:00' } } },
		{ prop: 'address', label: '地址', component: { name: 'el-input' }, required: true },
		{
			prop: 'status',
			label: '状态',
			value: 'ENABLED',
			component: { name: 'el-radio-group', options: statusOptions }
		},
		{ prop: 'intro', label: '景点介绍', component: { name: 'el-input', props: { type: 'textarea', rows: 5 } } }
	]
});

// ==================== cl-search ====================
const Search = useSearch({
	items: [
		{
			prop: 'name',
			label: '名称关键词',
			component: { name: 'el-input', props: { clearable: true, placeholder: '输入景点名称' } }
		},
		{
			prop: 'status',
			label: '状态',
			component: { name: 'el-select', options: statusOptions, props: { clearable: true, placeholder: '全部状态' } }
		}
	]
});

// ==================== cl-crud ====================
const Crud = useCrud({ service: mockService }, app => {
	app.refresh();
});
</script>

<style scoped lang="scss">
:deep(.detail-dialog) {
	.el-dialog__body { padding: 0; }
	.el-dialog__footer { padding: 0; border-top: 1px solid #ebeef5; }
}

.detail-banner {
	padding: 28px 32px 24px;
	color: #fff;
	position: relative;
	overflow: hidden;

	&--travel {
		background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
	}

	&::after {
		content: '';
		position: absolute;
		right: -40px;
		top: -40px;
		width: 180px;
		height: 180px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
	}

	&__main { position: relative; z-index: 1; }
	&__tag { display: flex; gap: 8px; margin-bottom: 12px; }
	&__title { margin: 0 0 6px; font-size: 24px; font-weight: 600; }
	&__subtitle {
		margin: 0;
		font-size: 14px;
		opacity: 0.9;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	&__price {
		position: absolute;
		right: 32px;
		top: 50%;
		transform: translateY(-50%);
		text-align: right;
		z-index: 1;

		&-label { display: block; font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
		&-value { font-size: 32px; font-weight: 700; }
	}
}

.detail-stats {
	display: flex;
	gap: 12px;
	padding: 20px 32px;
	background: #fafafa;
	border-bottom: 1px solid #ebeef5;

	&__item {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		border-radius: 10px;
		padding: 14px 16px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
	}

	&__icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		&--orange { background: #fff3e0; }
		&--yellow { background: #fffde7; }
		&--blue { background: #e3f2fd; }
		&--green { background: #e8f5e9; }
	}

	&__info { display: flex; flex-direction: column; }
	&__value { font-size: 20px; font-weight: 600; color: #303133; line-height: 1.2; }
	&__value--sm { font-size: 13px; }
	&__label { font-size: 12px; color: #909399; margin-top: 2px; }
}

.detail-content {
	padding: 20px 32px 24px;
}

.detail-card {
	background: #fff;
	border: 1px solid #ebeef5;
	border-radius: 12px;
	overflow: hidden;

	&__header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 20px;
		background: #fafbfc;
		border-bottom: 1px solid #f0f2f5;
	}

	&__icon { font-size: 18px; }
	&__title { font-size: 15px; font-weight: 600; color: #303133; }

	&__body {
		padding: 18px 20px;
		line-height: 1.8;
		color: #606266;
		font-size: 14px;
		p { margin: 0; }
	}
}

.detail-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 32px;
}
</style>
