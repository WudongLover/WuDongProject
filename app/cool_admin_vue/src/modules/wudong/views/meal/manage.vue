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

		<!-- 餐厅详情弹窗 -->
		<el-dialog v-model="detailVisible" width="820px" destroy-on-close :show-close="false" class="detail-dialog">
			<template v-if="detailItem">
				<!-- 顶部 Banner -->
				<div class="detail-banner detail-banner--meal">
					<div class="detail-banner__main">
						<div class="detail-banner__tag">
							<el-tag size="small" effect="dark" :type="detailItem.status === 'ENABLED' ? 'success' : 'info'">
								{{ detailItem.status === 'ENABLED' ? '营业中' : '已停业' }}
							</el-tag>
							<el-tag size="small" effect="plain" type="danger">苗家风味</el-tag>
						</div>
						<h2 class="detail-banner__title">{{ detailItem.name }}</h2>
						<p class="detail-banner__subtitle">
							<el-icon><Location /></el-icon>
							{{ detailItem.address }}
						</p>
					</div>
					<div class="detail-banner__price">
						<span class="detail-banner__price-label">人均</span>
						<span class="detail-banner__price-value">¥{{ detailItem.pricePerCapita }}</span>
					</div>
				</div>

				<!-- 数据概览 -->
				<div class="detail-stats">
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--yellow"><el-icon><Star /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.rating }}</span>
							<span class="detail-stats__label">用户评分</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--blue"><el-icon><User /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.capacity }}人</span>
							<span class="detail-stats__label">容纳人数</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--green"><el-icon><Clock /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value detail-stats__value--sm">{{ detailItem.hours }}</span>
							<span class="detail-stats__label">营业时间</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--orange"><el-icon><PriceTag /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ (detailItem.tags || []).length }}个</span>
							<span class="detail-stats__label">特色标签</span>
						</div>
					</div>
				</div>

				<!-- 标签展示 -->
				<div v-if="detailItem.tags && detailItem.tags.length" class="detail-tags">
					<el-tag v-for="(t, i) in detailItem.tags" :key="i" size="large" effect="plain" round class="detail-tags__item">{{ t }}</el-tag>
				</div>

				<!-- 图片展示 -->
				<div v-if="detailItem.images && detailItem.images.length" class="detail-images">
					<el-image
						v-for="(img, i) in detailItem.images"
						:key="i"
						:src="img"
						:preview-src-list="detailItem.images"
						fit="cover"
						class="detail-images__item"
					/>
				</div>

				<!-- 内容卡片区域 -->
				<div class="detail-content">
					<div v-if="detailItem.intro" class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon"><el-icon><Food /></el-icon></span>
							<span class="detail-card__title">餐厅介绍</span>
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
						编辑餐厅
					</el-button>
				</div>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-meal-manage'
});

import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Location, Edit, Star, User, Clock, PriceTag, Food, View, Delete } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';

// ==================== 类型定义 ====================
type RestaurantStatus = 'ENABLED' | 'DISABLED';

interface RestaurantItem {
	id: number;
	merchantId: number;
	name: string;
	cover: string;
	images: string[] | null;
	rating: number;
	pricePerCapita: number;
	address: string;
	hours: string;
	capacity: number;
	tags: string[] | null;
	intro: string;
	status: RestaurantStatus;
	createdAt: string;
}

// ==================== Mock 数据层 ====================
const mockDB = reactive<RestaurantItem[]>(generateMockRestaurants());

function generateMockRestaurants(): RestaurantItem[] {
	const names = ['苗家酸汤鱼馆', '乌东长桌宴', '苗岭风味楼', '山居小厨', '芦笙美食坊', '侗家腌鱼店', '苗寨米粉铺', '云上山居餐厅'];
	const addresses = ['苗寨中心广场东侧', '观景台下山步道旁', '芦笙场对面', '云上山居一楼', '银饰作坊隔壁', '苗寨北门入口', '鼓楼广场南侧', '梯田观景台旁'];
	const hoursList = ['10:00 - 22:00', '11:00 - 21:30', '08:00 - 20:00', '11:30 - 22:30', '09:00 - 21:00'];
	const tagsPool = [['酸汤鱼', '苗家菜', '长桌宴'], ['农家菜', '土鸡', '山野菜'], ['米粉', '小吃', '早餐'], ['烧烤', '米酒', '夜宵'], ['私房菜', '观景位', '预约制']];
	const statuses: RestaurantStatus[] = ['ENABLED', 'ENABLED', 'ENABLED', 'ENABLED', 'DISABLED'];

	const list: RestaurantItem[] = [];
	for (let i = 1; i <= 24; i++) {
		const d = new Date(Date.now() - i * 3600 * 1000 * 18);
		list.push({
			id: 3000 + i,
			merchantId: 0,
			name: names[i % names.length] + `（${String(i).padStart(2, '0')}号店）`,
			cover: '',
			images: [],
			rating: Math.round((4.0 + Math.random()) * 10) / 10,
			pricePerCapita: Math.floor(Math.random() * 150) + 30,
			address: addresses[i % addresses.length],
			hours: hoursList[i % hoursList.length],
			capacity: Math.floor(Math.random() * 100) + 20,
			tags: tagsPool[i % tagsPool.length],
			intro: '本店位于乌东苗寨核心区域，主打地道苗家风味。酸汤鱼采用本地稻田鱼，配以祖传酸汤发酵工艺，酸辣开胃。长桌宴可同时容纳多人就餐，是体验苗族饮食文化的绝佳选择。',
			status: statuses[i % statuses.length],
			createdAt: d.toISOString()
		});
	}
	return list;
}

const mockService = {
	async page(data: { page: number; size: number; name?: string; status?: RestaurantStatus }) {
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
	async info(params: { id: number }) {
		return mockDB.find(r => r.id === params.id) || null;
	},
	async update(data: Partial<RestaurantItem> & { id: number }) {
		const idx = mockDB.findIndex(r => r.id === data.id);
		if (idx >= 0) mockDB[idx] = { ...mockDB[idx], ...data };
		return true;
	},
	async delete(data: { ids: number[] }) {
		for (const id of data.ids) {
			const idx = mockDB.findIndex(r => r.id === id);
			if (idx >= 0) mockDB.splice(idx, 1);
		}
		return true;
	},
	async add(data: Partial<RestaurantItem>) {
		const id = Math.max(...mockDB.map(r => r.id)) + 1;
		const now = new Date().toISOString();
		mockDB.unshift({
			id,
			merchantId: 0,
			name: data.name || '',
			cover: data.cover || '',
			images: data.images || [],
			rating: data.rating || 5.0,
			pricePerCapita: data.pricePerCapita || 0,
			address: data.address || '',
			hours: data.hours || '',
			capacity: data.capacity || 0,
			tags: data.tags || [],
			intro: data.intro || '',
			status: 'ENABLED',
			createdAt: now
		});
		return true;
	}
};

// ==================== 字典 ====================
const statusOptions = [
	{ label: '营业中', value: 'ENABLED', type: 'success' },
	{ label: '已停业', value: 'DISABLED', type: 'info' }
];

// ==================== 详情弹窗 ====================
const detailVisible = ref(false);
const detailItem = ref<RestaurantItem | null>(null);

function formatTime(iso: string) {
	if (!iso) return '-';
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function viewDetail(id: number) {
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
		{ label: '餐厅名称', prop: 'name', minWidth: 200, showOverflowTooltip: true },
		{
			label: '人均',
			prop: 'pricePerCapita',
			width: 100,
			component: {
				name: 'el-text',
				props: { type: 'danger', size: 'small' },
				valuePrepare: (row: RestaurantItem) => `¥${row.pricePerCapita}`
			}
		},
		{ label: '评分', prop: 'rating', width: 80, sortable: true },
		{ label: '地址', prop: 'address', minWidth: 180, showOverflowTooltip: true },
		{ label: '营业时间', prop: 'hours', width: 140 },
		{ label: '容量', prop: 'capacity', width: 90 },
		{
			label: '标签',
			prop: 'tags',
			minWidth: 160,
			component: {
				name: 'el-text',
				props: { size: 'small' },
				valuePrepare: (row: RestaurantItem) => (row.tags || []).join('、')
			}
		},
		{ label: '状态', prop: 'status', width: 100, dict: statusOptions },
		{
			label: '创建时间',
			prop: 'createdAt',
			width: 120,
			sortable: 'desc',
			component: {
				name: 'el-text',
				props: { size: 'small' },
				valuePrepare: (row: RestaurantItem) => formatTime(row.createdAt)
			}
		},
		{
			label: '操作',
			type: 'op',
			width: 148,
			buttons: [
				{
					label: '',
					type: 'primary',
					props: {
						icon: View,
						size: 'small',
						title: '查看详情',
						'aria-label': '查看详情'
					},
					onClick: ({ scope }: { scope: { row: RestaurantItem } }) => viewDetail(scope.row.id)
				},
				{
					label: '',
					type: 'primary',
					props: {
						icon: Edit,
						size: 'small',
						title: '编辑餐厅',
						'aria-label': '编辑餐厅'
					},
					onClick: ({ scope }: { scope: { row: RestaurantItem } }) =>
						Crud.value?.rowEdit(scope.row)
				},
				{
					label: '',
					type: 'danger',
					props: {
						icon: Delete,
						size: 'small',
						title: '删除餐厅',
						'aria-label': '删除餐厅'
					},
					confirm: '确认删除该餐厅？删除后不可恢复。'
				}
			]
		}
	]
});

// ==================== cl-upsert ====================
const Upsert = useUpsert({
	items: [
		{ prop: 'name', label: '餐厅名称', component: { name: 'el-input' }, required: true },
		{ prop: 'cover', label: '封面图', component: { name: 'cl-upload' } },
		{ prop: 'pricePerCapita', label: '人均消费(元)', value: 0, component: { name: 'el-input-number', props: { min: 0, precision: 2 } } },
		{ prop: 'rating', label: '评分', value: 5.0, component: { name: 'el-input-number', props: { min: 0, max: 5, precision: 1 } } },
		{ prop: 'address', label: '地址', component: { name: 'el-input' }, required: true },
		{ prop: 'hours', label: '营业时间', component: { name: 'el-input', props: { placeholder: '如 10:00 - 22:00' } } },
		{ prop: 'capacity', label: '容纳人数', value: 0, component: { name: 'el-input-number', props: { min: 0 } } },
		{ prop: 'tags', label: '标签', component: { name: 'el-input', props: { placeholder: '多个标签用逗号分隔' } } },
		{
			prop: 'status',
			label: '状态',
			value: 'ENABLED',
			component: { name: 'el-radio-group', options: statusOptions }
		},
		{ prop: 'intro', label: '餐厅介绍', component: { name: 'el-input', props: { type: 'textarea', rows: 4 } } }
	]
});

// ==================== cl-search ====================
const Search = useSearch({
	items: [
		{
			prop: 'name',
			label: '名称关键词',
			component: { name: 'el-input', props: { clearable: true, placeholder: '输入餐厅名称' } }
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
	.el-dialog { overflow: hidden; border-radius: 10px; }
	.el-dialog__body { padding: 0; background: #f8f8f4; }
	.el-dialog__footer { padding: 0; border-top: 1px solid #e2e5dc; background: #fff; }
}

.detail-banner {
	padding: 30px 34px 26px;
	color: #fff;
	position: relative;
	overflow: hidden;

	&--meal {
		background-color: #284b3c;
		background-image: repeating-linear-gradient(90deg, transparent 0, transparent 26px, rgba(255, 255, 255, 0.035) 27px), linear-gradient(108deg, rgba(21, 61, 45, 0.22), transparent 62%);
	}

	&::after {
		content: '';
		position: absolute;
		right: -30px;
		top: -80px;
		width: 230px;
		height: 230px;
		border-radius: 50%;
		background: rgba(221, 177, 87, 0.14);
	}

	&__main { position: relative; z-index: 1; }
	&__tag { display: flex; gap: 8px; margin-bottom: 14px; }
	&__title { margin: 0 0 8px; font-size: 25px; font-weight: 700; letter-spacing: 0; }
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
	background: #f7f8f5;
	border-bottom: 1px solid #e2e5dc;

	&__item {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		border-radius: 6px;
		padding: 14px 16px;
		box-shadow: 0 1px 2px rgba(23, 57, 43, 0.05);
	}

	&__icon {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		&--orange { background: #f6ead7; color: #a46621; }
		&--yellow { background: #f8f1da; color: #a77916; }
		&--blue { background: #e5eff1; color: #286778; }
		&--green { background: #e5f0e8; color: #337451; }
	}

	&__info { display: flex; flex-direction: column; }
	&__value { font-size: 20px; font-weight: 700; color: #294337; line-height: 1.2; }
	&__value--sm { font-size: 14px; }
	&__label { font-size: 12px; color: #7a867e; margin-top: 2px; }
}

.detail-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 16px 32px 0;

	&__item {
		font-size: 13px;
	}
}

.detail-images {
	display: flex;
	gap: 10px;
	padding: 16px 32px 0;
	flex-wrap: wrap;

	&__item {
		width: 140px;
		height: 105px;
		border-radius: 8px;
		cursor: pointer;
	}
}

.detail-content {
	padding: 20px 32px 24px;
}

.detail-card {
	background: #fff;
	border: 1px solid #dfe5dd;
	border-radius: 6px;
	overflow: hidden;

	&__header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 20px;
		background: #f7f9f5;
		border-bottom: 1px solid #e4e8e1;
	}

	&__icon { font-size: 18px; }
	&__title { font-size: 15px; font-weight: 700; color: #29483a; }

	&__body {
		padding: 18px 20px;
		line-height: 1.8;
		color: #526158;
		font-size: 14px;
		p { margin: 0; }
	}
}

.detail-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 32px;
	:deep(.el-button--primary) { --el-button-bg-color: #287a5a; --el-button-border-color: #287a5a; --el-button-hover-bg-color: #21684d; }
}

:deep(.cl-table .cl-table__op) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	white-space: nowrap;
	margin-bottom: 0;
}


:deep(.cl-table .cl-table__op .el-button) {
	margin-bottom: 0;
}

:deep(.cl-table .cl-table__op .el-button + .el-button) {
	margin-left: 0;
}
</style>
