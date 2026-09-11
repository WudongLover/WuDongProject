<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<el-button type="warning" :icon="SearchIcon" @click="batchToggleShelf">
				批量上下架
			</el-button>
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

		<!-- 商品详情弹窗 -->
		<el-dialog v-model="detailVisible" width="820px" destroy-on-close :show-close="false" class="detail-dialog">
			<template v-if="detailItem">
				<!-- 顶部 Banner -->
				<div class="detail-banner detail-banner--heritage">
					<div class="detail-banner__main">
						<div class="detail-banner__tag">
							<el-tag size="small" effect="dark" :type="detailItem.status === 'ON_SHELF' ? 'success' : 'info'">
								{{ detailItem.status === 'ON_SHELF' ? '在售中' : '已下架' }}
							</el-tag>
							<el-tag size="small" effect="plain" type="warning">非遗手作</el-tag>
						</div>
						<h2 class="detail-banner__title">{{ detailItem.title }}</h2>
						<p v-if="detailItem.subtitle" class="detail-banner__subtitle">{{ detailItem.subtitle }}</p>
					</div>
					<div class="detail-banner__price">
						<span class="detail-banner__price-label">售价</span>
						<span class="detail-banner__price-value">¥{{ detailItem.price }}</span>
						<span v-if="detailItem.marketPrice" class="detail-banner__price-market">¥{{ detailItem.marketPrice }}</span>
					</div>
				</div>

				<!-- 数据概览 -->
				<div class="detail-stats">
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--orange">🔥</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.sales }}</span>
							<span class="detail-stats__label">累计销量</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--yellow">⭐</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.rating }}</span>
							<span class="detail-stats__label">用户评分</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--blue">📦</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.stock }}</span>
							<span class="detail-stats__label">库存数量</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--green">🏷️</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ categoryLabel }}</span>
							<span class="detail-stats__label">所属分类</span>
						</div>
					</div>
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
					<div v-if="detailItem.craft" class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon">🎨</span>
							<span class="detail-card__title">非遗工艺</span>
						</div>
						<div class="detail-card__body">
							<p>{{ detailItem.craft }}</p>
						</div>
					</div>

					<div v-if="detailItem.artisan" class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon">👨‍🎨</span>
							<span class="detail-card__title">匠人信息</span>
						</div>
						<div class="detail-card__body">
							<div class="detail-artisan">
								<div class="detail-artisan__avatar">{{ detailItem.artisan.name.charAt(0) }}</div>
								<div class="detail-artisan__info">
									<div class="detail-artisan__name">
										{{ detailItem.artisan.name }}
										<el-tag size="small" type="warning" effect="plain">{{ detailItem.artisan.title }}</el-tag>
									</div>
									<p v-if="detailItem.artisan.story" class="detail-artisan__story">{{ detailItem.artisan.story }}</p>
								</div>
							</div>
						</div>
					</div>

					<div v-if="detailItem.detail" class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon">📝</span>
							<span class="detail-card__title">图文详情</span>
						</div>
						<div class="detail-card__body detail-card__body--html" v-html="detailItem.detail"></div>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="detail-footer">
					<el-button size="large" @click="detailVisible = false">关闭</el-button>
					<el-button size="large" type="primary" @click="editItem">
						<el-icon><Edit /></el-icon>
						编辑商品
					</el-button>
				</div>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-heritage-manage'
});

import { reactive, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search as SearchIcon, Edit } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';

// ==================== 类型定义 ====================
type ProductStatus = 'ON_SHELF' | 'OFF_SHELF';

interface Artisan {
	name: string;
	title: string;
	avatar: string;
	story: string;
}

interface ProductItem {
	id: string;
	module: string;
	categoryId: string;
	title: string;
	subtitle: string;
	price: number;
	marketPrice: number | null;
	sales: number;
	rating: number;
	stock: number;
	cover: string;
	images: string[] | null;
	detail: string | null;
	craft: string | null;
	artisan: Artisan | null;
	status: ProductStatus;
	createdAt: string;
}

// ==================== Mock 数据层 ====================
const mockDB = reactive<ProductItem[]>(generateMockProducts());

function generateMockProducts(): ProductItem[] {
	const titles = ['苗族银饰项链', '蜡染方巾', '苗绣荷包', '侗族鼓楼模型', '苗族银冠', '蜡染挂画', '苗绣披肩', '银饰手镯', '侗族大歌CD', '苗族芦笙'];
	const crafts = ['国家级非物质文化遗产，纯手工打制，每件需耗时30天以上', '传统蜡染工艺，使用天然植物染料，图案源自苗族创世神话', '苗绣工艺，12种针法，图案寓意吉祥如意'];
	const artisans = [
		{ name: '杨师傅', title: '国家级非遗传承人', avatar: '', story: '从事银饰制作40年，作品多次获得国家级奖项' },
		{ name: '龙阿姨', title: '省级非遗传承人', avatar: '', story: '蜡染技艺传承人，致力于传统图案的保护与创新' },
		{ name: '吴师傅', title: '苗族银饰大师', avatar: '', story: '家族三代从事银饰制作，独创浮雕工艺' }
	];
	const statuses: ProductStatus[] = ['ON_SHELF', 'ON_SHELF', 'ON_SHELF', 'OFF_SHELF'];

	const list: ProductItem[] = [];
	for (let i = 1; i <= 32; i++) {
		const d = new Date(Date.now() - i * 3600 * 1000 * 12);
		list.push({
			id: String(2000 + i),
			module: 'GOODS',
			categoryId: String(100 + (i % 4)),
			title: titles[i % titles.length] + ` · ${String(i).padStart(2, '0')}`,
			subtitle: '乌东苗寨手作 · 限量发售',
			price: Math.floor(Math.random() * 800) + 99,
			marketPrice: Math.floor(Math.random() * 1200) + 200,
			sales: Math.floor(Math.random() * 500),
			rating: Math.round((4.0 + Math.random()) * 10) / 10,
			stock: Math.floor(Math.random() * 200),
			cover: '',
			images: [],
			detail: '<p>这是一件来自乌东苗寨的手工艺品，由非遗传承人亲手制作。</p><p>每一件作品都凝聚了匠人的心血和苗族千年文化的积淀。</p>',
			craft: crafts[i % crafts.length],
			artisan: artisans[i % artisans.length],
			status: statuses[i % statuses.length],
			createdAt: d.toISOString()
		});
	}
	return list;
}

const mockService = {
	async page(data: { page: number; size: number; title?: string; status?: ProductStatus }) {
		let rows = [...mockDB].filter(r => r.module === 'GOODS');
		if (data.title) rows = rows.filter(r => r.title.includes(data.title!));
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
	async update(data: Partial<ProductItem> & { id: string }) {
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
	async add(data: Partial<ProductItem>) {
		const id = String(Math.max(...mockDB.map(r => Number(r.id))) + 1);
		const now = new Date().toISOString();
		mockDB.unshift({
			id,
			module: 'GOODS',
			categoryId: data.categoryId || '100',
			title: data.title || '',
			subtitle: data.subtitle || '',
			price: data.price || 0,
			marketPrice: data.marketPrice || null,
			sales: 0,
			rating: 5.0,
			stock: data.stock || 0,
			cover: data.cover || '',
			images: data.images || [],
			detail: data.detail || null,
			craft: data.craft || null,
			artisan: data.artisan || null,
			status: 'ON_SHELF',
			createdAt: now
		});
		return true;
	}
};

// ==================== 字典 ====================
const statusOptions = [
	{ label: '在售', value: 'ON_SHELF', type: 'success' },
	{ label: '已下架', value: 'OFF_SHELF', type: 'info' }
];

const categoryOptions = [
	{ label: '银饰', value: '100' },
	{ label: '蜡染', value: '101' },
	{ label: '苗绣', value: '102' },
	{ label: '其他', value: '103' }
];

// ==================== 详情弹窗 ====================
const detailVisible = ref(false);
const detailItem = ref<ProductItem | null>(null);

const categoryLabel = computed(() => {
	if (!detailItem.value) return '-';
	const found = categoryOptions.find(c => c.value === detailItem.value!.categoryId);
	return found ? found.label : '-';
});

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

async function toggleShelf(id: string, status: ProductStatus) {
	try {
		await ElMessageBox.confirm(
			`确认将该商品${status === 'ON_SHELF' ? '上架' : '下架'}？`,
			'操作确认',
			{ type: 'warning' }
		);
		await mockService.update({ id, status });
		ElMessage.success(`已${status === 'ON_SHELF' ? '上架' : '下架'}`);
		Crud.value?.refresh();
	} catch { /* cancel */ }
}

async function batchToggleShelf() {
	const selection: ProductItem[] = Table.value?.selection || [];
	if (selection.length === 0) {
		ElMessage.warning('请先勾选商品');
		return;
	}
	try {
		await ElMessageBox.confirm(
			`将对选中的 ${selection.length} 件商品执行「上架」操作，是否继续？`,
			'批量上下架',
			{ type: 'warning' }
		);
		for (const p of selection) {
			await mockService.update({ id: p.id, status: 'ON_SHELF' });
		}
		ElMessage.success(`已上架 ${selection.length} 件商品`);
		Crud.value?.refresh();
	} catch { /* cancel */ }
}

// ==================== cl-table ====================
const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: 'ID', prop: 'id', width: 90 },
		{
			label: '商品标题',
			prop: 'title',
			minWidth: 220,
			showOverflowTooltip: true
		},
		{ label: '分类', prop: 'categoryId', width: 100, dict: categoryOptions },
		{
			label: '售价',
			prop: 'price',
			width: 100,
			component: {
				name: 'el-text',
				props: { type: 'danger', size: 'small' },
				valuePrepare: (row: ProductItem) => `¥${row.price}`
			}
		},
		{ label: '销量', prop: 'sales', width: 80, sortable: true },
		{ label: '评分', prop: 'rating', width: 80, sortable: true },
		{ label: '库存', prop: 'stock', width: 80 },
		{ label: '状态', prop: 'status', width: 100, dict: statusOptions },
		{
			label: '创建时间',
			prop: 'createdAt',
			width: 120,
			sortable: 'desc',
			component: {
				name: 'el-text',
				props: { size: 'small' },
				valuePrepare: (row: ProductItem) => formatTime(row.createdAt)
			}
		},
		{
			label: '操作',
			type: 'op',
			width: 220,
			buttons: [
				{
					label: '详情',
					type: 'primary',
					text: true,
					onClick: ({ scope }: { scope: { row: ProductItem } }) => viewDetail(scope.row.id)
				},
				{
					label: '编辑',
					type: 'primary',
					text: true,
					onClick: ({ scope }: { scope: { row: ProductItem } }) =>
						Crud.value?.rowEdit(scope.row)
				},
				{
					label: '下架',
					type: 'warning',
					text: true,
					show: ({ scope }: { scope: { row: ProductItem } }) => scope.row.status === 'ON_SHELF',
					onClick: ({ scope }: { scope: { row: ProductItem } }) =>
						toggleShelf(scope.row.id, 'OFF_SHELF')
				},
				{
					label: '上架',
					type: 'success',
					text: true,
					show: ({ scope }: { scope: { row: ProductItem } }) => scope.row.status === 'OFF_SHELF',
					onClick: ({ scope }: { scope: { row: ProductItem } }) =>
						toggleShelf(scope.row.id, 'ON_SHELF')
				},
				{
					label: '删除',
					type: 'danger',
					text: true,
					confirm: '确认删除该商品？删除后不可恢复。'
				}
			]
		}
	]
});

// ==================== cl-upsert ====================
const Upsert = useUpsert({
	items: [
		{ prop: 'title', label: '商品标题', component: { name: 'el-input' }, required: true },
		{ prop: 'subtitle', label: '副标题', component: { name: 'el-input' } },
		{
			prop: 'categoryId',
			label: '分类',
			component: { name: 'el-select', options: categoryOptions, props: { clearable: true } }
		},
		{ prop: 'price', label: '售价(元)', value: 0, component: { name: 'el-input-number', props: { min: 0, precision: 2 } }, required: true },
		{ prop: 'marketPrice', label: '划线价(元)', value: null, component: { name: 'el-input-number', props: { min: 0, precision: 2 } } },
		{ prop: 'stock', label: '库存', value: 0, component: { name: 'el-input-number', props: { min: 0 } } },
		{ prop: 'cover', label: '封面图', component: { name: 'cl-upload' } },
		{ prop: 'craft', label: '非遗工艺介绍', component: { name: 'el-input', props: { type: 'textarea', rows: 3 } } },
		{
			prop: 'status',
			label: '状态',
			value: 'ON_SHELF',
			component: { name: 'el-radio-group', options: statusOptions }
		},
		{ prop: 'detail', label: '图文详情', component: { name: 'el-input', props: { type: 'textarea', rows: 5 } } }
	]
});

// ==================== cl-search ====================
const Search = useSearch({
	items: [
		{
			prop: 'title',
			label: '标题关键词',
			component: { name: 'el-input', props: { clearable: true, placeholder: '输入标题关键词' } }
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
// 弹窗整体去默认内边距
:deep(.detail-dialog) {
	.el-dialog__body {
		padding: 0;
	}
	.el-dialog__footer {
		padding: 0;
		border-top: 1px solid #ebeef5;
	}
}

// 顶部 Banner
.detail-banner {
	padding: 28px 32px 24px;
	color: #fff;
	position: relative;
	overflow: hidden;

	&--heritage {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

	&__main {
		position: relative;
		z-index: 1;
	}

	&__tag {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	&__title {
		margin: 0 0 6px;
		font-size: 24px;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	&__subtitle {
		margin: 0;
		font-size: 14px;
		opacity: 0.85;
	}

	&__price {
		position: absolute;
		right: 32px;
		top: 50%;
		transform: translateY(-50%);
		text-align: right;
		z-index: 1;

		&-label {
			display: block;
			font-size: 12px;
			opacity: 0.8;
			margin-bottom: 4px;
		}

		&-value {
			font-size: 32px;
			font-weight: 700;
		}

		&-market {
			display: block;
			font-size: 14px;
			text-decoration: line-through;
			opacity: 0.6;
			margin-top: 2px;
		}
	}
}

// 数据概览
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

	&__info {
		display: flex;
		flex-direction: column;
	}

	&__value {
		font-size: 20px;
		font-weight: 600;
		color: #303133;
		line-height: 1.2;
	}

	&__label {
		font-size: 12px;
		color: #909399;
		margin-top: 2px;
	}
}

// 图片展示
.detail-images {
	display: flex;
	gap: 10px;
	padding: 20px 32px 0;
	flex-wrap: wrap;

	&__item {
		width: 140px;
		height: 105px;
		border-radius: 8px;
		cursor: pointer;
	}
}

// 内容卡片区域
.detail-content {
	padding: 20px 32px 24px;
}

.detail-card {
	background: #fff;
	border: 1px solid #ebeef5;
	border-radius: 12px;
	margin-bottom: 16px;
	overflow: hidden;

	&:last-child {
		margin-bottom: 0;
	}

	&__header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 20px;
		background: #fafbfc;
		border-bottom: 1px solid #f0f2f5;
	}

	&__icon {
		font-size: 18px;
	}

	&__title {
		font-size: 15px;
		font-weight: 600;
		color: #303133;
	}

	&__body {
		padding: 18px 20px;
		line-height: 1.8;
		color: #606266;
		font-size: 14px;

		p {
			margin: 0;
		}

		&--html {
			:deep(p) {
				margin-bottom: 8px;
			}
		}
	}
}

// 匠人信息
.detail-artisan {
	display: flex;
	gap: 16px;
	align-items: flex-start;

	&__avatar {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		font-weight: 600;
		flex-shrink: 0;
	}

	&__info {
		flex: 1;
	}

	&__name {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 16px;
		font-weight: 600;
		color: #303133;
		margin-bottom: 6px;
	}

	&__story {
		margin: 0;
		font-size: 13px;
		color: #909399;
		line-height: 1.7;
	}
}

// 底部操作区
.detail-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 32px;
}
</style>
