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

		<!-- 民宿详情弹窗 -->
		<el-dialog v-model="detailVisible" width="820px" destroy-on-close :show-close="false" class="detail-dialog">
			<template v-if="detailItem">
				<!-- 顶部 Banner -->
				<div class="detail-banner detail-banner--lodging">
					<div class="detail-banner__main">
						<div class="detail-banner__tag">
							<el-tag size="small" effect="dark" :type="detailItem.status === 'ENABLED' ? 'success' : 'info'">
								{{ detailItem.status === 'ENABLED' ? '营业中' : '已停业' }}
							</el-tag>
							<el-tag size="small" effect="plain" type="success">山居美宿</el-tag>
						</div>
						<h2 class="detail-banner__title">{{ detailItem.name }}</h2>
						<p class="detail-banner__subtitle">
							<el-icon><Location /></el-icon>
							{{ detailItem.address }}
						</p>
					</div>
					<div class="detail-banner__price">
						<span class="detail-banner__price-label">综合评分</span>
						<span class="detail-banner__price-value">{{ detailItem.rating }}</span>
					</div>
				</div>

				<!-- 数据概览 -->
				<div class="detail-stats">
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--blue"><el-icon><Location /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.score?.location || '-' }}</span>
							<span class="detail-stats__label">位置评分</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--green"><el-icon><MagicStick /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.score?.cleanliness || '-' }}</span>
							<span class="detail-stats__label">卫生评分</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--orange"><el-icon><Bell /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailItem.score?.service || '-' }}</span>
							<span class="detail-stats__label">服务评分</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--yellow"><el-icon><PriceTag /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ (detailItem.tags || []).length }}个</span>
							<span class="detail-stats__label">特色标签</span>
						</div>
					</div>
				</div>

				<!-- 标签展示 -->
				<div class="detail-tags">
					<template v-if="detailItem.tags && detailItem.tags.length">
						<el-tag v-for="(t, i) in detailItem.tags" :key="'t'+i" size="large" effect="plain" round class="detail-tags__item">{{ t }}</el-tag>
					</template>
					<template v-if="detailItem.facilities && detailItem.facilities.length">
						<el-tag v-for="(f, i) in detailItem.facilities" :key="'f'+i" size="large" type="success" effect="plain" round class="detail-tags__item">{{ f }}</el-tag>
					</template>
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
							<span class="detail-card__icon"><el-icon><House /></el-icon></span>
							<span class="detail-card__title">民宿介绍</span>
						</div>
						<div class="detail-card__body">
							<p>{{ detailItem.intro }}</p>
						</div>
					</div>

					<div v-if="detailItem.notice" class="detail-card detail-card--notice">
						<div class="detail-card__header">
							<span class="detail-card__icon"><el-icon><Warning /></el-icon></span>
							<span class="detail-card__title">入住须知</span>
						</div>
						<div class="detail-card__body">
							<p>{{ detailItem.notice }}</p>
						</div>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="detail-footer">
					<el-button size="large" @click="detailVisible = false">关闭</el-button>
					<el-button size="large" type="primary" @click="editItem">
						<el-icon><Edit /></el-icon>
						编辑民宿
					</el-button>
				</div>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-lodging-manage'
});

import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Location, Edit, MagicStick, Bell, PriceTag, House, Warning, View, Delete, Top, Bottom } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';
import { ossImage } from '../../utils/oss-image';

// ==================== 类型定义 ====================
type HomestayStatus = 'ENABLED' | 'DISABLED';

interface HomestayScore {
	location?: number;
	cleanliness?: number;
	service?: number;
}

interface HomestayItem {
	id: string;
	merchantId: string;
	name: string;
	cover: string;
	images: string[] | null;
	rating: number;
	score: HomestayScore | null;
	tags: string[] | null;
	facilities: string[] | null;
	address: string;
	intro: string | null;
	notice: string | null;
	status: HomestayStatus;
	createdAt: string;
}

// ==================== Mock 数据层 ====================
const mockDB = reactive<HomestayItem[]>(generateMockHomestays());

function generateMockHomestays(): HomestayItem[] {
	const names = ['云上山居', '苗寨客栈', '梯田观景民宿', '鼓楼人家', '芦笙小院', '银饰主题民宿', '蜡染工坊民宿', '星空帐篷营地'];
	const addresses = ['乌东苗寨观景台旁', '苗寨中心鼓楼北侧', '梯田景区入口处', '芦笙场东侧小巷', '银饰作坊隔壁', '蜡染工坊二楼', '苗寨北门山坡上', '云海观景台下方'];
	const tagsPool = [['观景房', '亲子房', '独立卫浴'], ['山景房', '阳台', '早餐提供'], ['榻榻米', '日式风格', '温泉'], ['loft', '家庭房', '厨房可用'], ['星空房', '情侣房', '浪漫']];
	const facilitiesPool = [['免费WiFi', '停车场', '空调'], ['免费WiFi', '早餐', '接送服务'], ['免费WiFi', '茶室', '书吧'], ['免费WiFi', '烧烤', '露营装备'], ['免费WiFi', '洗衣机', '厨房']];
	const statuses: HomestayStatus[] = ['ENABLED', 'ENABLED', 'ENABLED', 'ENABLED', 'DISABLED'];
	const imageFiles = ['m3-stay1-cover.jpg', 'm3-stay2-cover.jpg', 'm3-stay3-cover.jpg', 'm3-stay4-cover.jpg'];

	const list: HomestayItem[] = [];
	for (let i = 1; i <= 20; i++) {
		const d = new Date(Date.now() - i * 3600 * 1000 * 24);
		const cover = ossImage(imageFiles[i % imageFiles.length]);
		list.push({
			id: String(4000 + i),
			merchantId: '0',
			name: names[i % names.length] + `（${String(i).padStart(2, '0')}号院）`,
			cover,
			images: [cover],
			rating: Math.round((4.2 + Math.random() * 0.8) * 10) / 10,
			score: {
				location: Math.round((4.0 + Math.random()) * 10) / 10,
				cleanliness: Math.round((4.0 + Math.random()) * 10) / 10,
				service: Math.round((4.0 + Math.random()) * 10) / 10
			},
			tags: tagsPool[i % tagsPool.length],
			facilities: facilitiesPool[i % facilitiesPool.length],
			address: addresses[i % addresses.length],
			intro: '本民宿位于乌东苗寨核心区域，推开窗即可看到云海梯田。房间采用苗族传统装饰风格，配备现代化设施。主人热情好客，可提供苗家特色早餐和当地旅游咨询服务。',
			notice: '入住时间：14:00后；退房时间：12:00前。请勿在室内吸烟。宠物需提前告知。节假日价格可能调整，请以实际预订为准。',
			status: statuses[i % statuses.length],
			createdAt: d.toISOString()
		});
	}
	return list;
}

const mockService = {
	async page(data: { page: number; size: number; name?: string; status?: HomestayStatus }) {
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
	async update(data: Partial<HomestayItem> & { id: string }) {
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
	async add(data: Partial<HomestayItem>) {
		const id = String(Math.max(...mockDB.map(r => Number(r.id))) + 1);
		const now = new Date().toISOString();
		mockDB.unshift({
			id,
			merchantId: '0',
			name: data.name || '',
			cover: data.cover || '',
			images: data.images || [],
			rating: data.rating || 5.0,
			score: data.score || null,
			tags: data.tags || [],
			facilities: data.facilities || [],
			address: data.address || '',
			intro: data.intro || null,
			notice: data.notice || null,
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
const statusFilterOptions = [{ label: '全部状态', value: '' }, ...statusOptions];

// ==================== 详情弹窗 ====================
const detailVisible = ref(false);
const detailItem = ref<HomestayItem | null>(null);

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

async function toggleHomestayStatus(id: string, status: HomestayStatus) {
	const action = status === 'ENABLED' ? '恢复营业' : '设为停业';
	try {
		await ElMessageBox.confirm(`确认将该民宿${action}？`, '状态确认', { type: 'warning' });
		await mockService.update({ id, status });
		ElMessage.success(`民宿已${action}`);
		Crud.value?.refresh();
	} catch { /* cancel */ }
}

// ==================== cl-table ====================
const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: 'ID', prop: 'id', width: 80 },
		{ label: '民宿名称', prop: 'name', minWidth: 200, showOverflowTooltip: true },
		{ label: '评分', prop: 'rating', width: 80, sortable: true },
		{ label: '地址', prop: 'address', minWidth: 180, showOverflowTooltip: true },
		{
			label: '标签',
			prop: 'tags',
			minWidth: 160,
			component: {
				name: 'el-text',
				props: { size: 'small' },
				valuePrepare: (row: HomestayItem) => (row.tags || []).join('、')
			}
		},
		{
			label: '设施',
			prop: 'facilities',
			minWidth: 160,
			component: {
				name: 'el-text',
				props: { size: 'small', type: 'success' },
				valuePrepare: (row: HomestayItem) => (row.facilities || []).join('、')
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
				valuePrepare: (row: HomestayItem) => formatTime(row.createdAt)
			}
		},
		{
			label: '操作',
			type: 'op',
			width: 148,
			buttons: ({ scope }: { scope: { row: HomestayItem } }) => [
				{
					label: '',
					type: 'primary',
					props: { icon: View, size: 'small', title: '查看详情', 'aria-label': '查看详情' },
					onClick: ({ scope }: { scope: { row: HomestayItem } }) => viewDetail(scope.row.id)
				},
				{
					label: '',
					type: 'primary',
					props: { icon: Edit, size: 'small', title: '编辑民宿', 'aria-label': '编辑民宿' },
					onClick: ({ scope }: { scope: { row: HomestayItem } }) =>
						Crud.value?.rowEdit(scope.row)
				},
				scope.row.status === 'ENABLED'
					? {
						label: '', type: 'warning', props: { icon: Bottom, size: 'small', title: '设为停业', 'aria-label': '设为停业' },
						onClick: ({ scope }: { scope: { row: HomestayItem } }) => toggleHomestayStatus(scope.row.id, 'DISABLED')
					}
					: {
						label: '', type: 'success', props: { icon: Top, size: 'small', title: '恢复营业', 'aria-label': '恢复营业' },
						onClick: ({ scope }: { scope: { row: HomestayItem } }) => toggleHomestayStatus(scope.row.id, 'ENABLED')
					},
				{
					label: '',
					type: 'danger',
					props: { icon: Delete, size: 'small', title: '删除民宿', 'aria-label': '删除民宿' },
					confirm: '确认删除该民宿？删除后不可恢复。'
				}
			]
		}
	]
});

// ==================== cl-upsert ====================
const Upsert = useUpsert({
	dialog: { width: '780px', height: '74vh', class: 'wudong-upsert-dialog' },
	props: { labelPosition: 'top' },
	op: { saveButtonText: '保存民宿', closeButtonText: '取消' },
	items: [
		{ prop: 'name', label: '民宿名称', span: 24, component: { name: 'el-input', props: { placeholder: '输入民宿名称' } }, required: true },
		{ prop: 'cover', label: '封面图', span: 24, component: { name: 'cl-upload' } },
		{ prop: 'images', label: '民宿图集', span: 24, component: { name: 'cl-upload', props: { multiple: true, limit: 6, draggable: true } } },
		{ prop: 'rating', label: '综合评分', span: 12, value: 5.0, component: { name: 'el-input-number', props: { min: 0, max: 5, precision: 1 } } },
		{ prop: 'address', label: '详细地址', span: 12, component: { name: 'el-input', props: { placeholder: '输入民宿地址' } }, required: true },
		{ prop: 'tags', label: '房型标签', span: 12, component: { name: 'el-input', props: { placeholder: '多个标签用逗号分隔' } } },
		{ prop: 'facilities', label: '配套设施', span: 12, component: { name: 'el-input', props: { placeholder: '多个设施用逗号分隔' } } },
		{
			prop: 'status',
			label: '状态',
			span: 24,
			value: 'ENABLED',
			component: { name: 'el-radio-group', options: statusOptions }
		},
		{ prop: 'intro', label: '民宿介绍', span: 24, component: { name: 'el-input', props: { type: 'textarea', rows: 5, maxlength: 600, showWordLimit: true, placeholder: '介绍环境、房型与服务特色' } } },
		{ prop: 'notice', label: '入住须知', span: 24, component: { name: 'el-input', props: { type: 'textarea', rows: 3, maxlength: 400, showWordLimit: true, placeholder: '填写入住和退房规则等注意事项' } } }
	]
});

// ==================== cl-search ====================
const Search = useSearch({
	items: [
		{
			prop: 'name',
			label: '名称关键词',
			component: { name: 'el-input', props: { clearable: true, placeholder: '输入民宿名称' } }
		},
		{
			prop: 'status',
			label: '状态',
			component: { name: 'el-select', options: statusFilterOptions, props: { clearable: true, placeholder: '全部状态' } }
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

:deep(.wudong-upsert-dialog) {
	.el-dialog { overflow: hidden; border-radius: 10px; }
	.el-dialog__header { padding: 20px 26px; margin-right: 0; border-bottom: 1px solid #e1e6df; background: #f8faf7; }
	.el-dialog__title { color: #25473b; font-size: 18px; font-weight: 700; }
	.el-dialog__body { padding: 24px 26px 6px; }
	.el-dialog__footer { padding: 14px 26px; border-top: 1px solid #e1e6df; }
	.el-form-item__label { color: #506158; font-weight: 650; }
	.el-input__wrapper, .el-textarea__inner { box-shadow: 0 0 0 1px #dce4da inset; }
	.el-input__wrapper.is-focus, .el-textarea__inner:focus { box-shadow: 0 0 0 1px #287a5a inset; }
}

.detail-banner {
	padding: 28px 32px 24px;
	color: #fff;
	position: relative;
	overflow: hidden;

	&--lodging {
		background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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
		&--orange { background: #fff3e0; color: #e65100; }
		&--yellow { background: #fffde7; color: #f9a825; }
		&--blue { background: #e3f2fd; color: #23456b; }
		&--green { background: #e8f5e9; color: #2e7d32; }
	}

	&__info { display: flex; flex-direction: column; }
	&__value { font-size: 20px; font-weight: 600; color: #303133; line-height: 1.2; }
	&__label { font-size: 12px; color: #909399; margin-top: 2px; }
}

.detail-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 16px 32px 0;

	&__item { font-size: 13px; }
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
	border: 1px solid #ebeef5;
	border-radius: 12px;
	margin-bottom: 16px;
	overflow: hidden;

	&:last-child { margin-bottom: 0; }

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

	&--notice {
		border-color: #faecd8;
		.detail-card__header {
			background: #fdf6ec;
			border-bottom-color: #faecd8;
		}
		.detail-card__body {
			background: #fef9f0;
			color: #8a6d3b;
		}
	}
}

.detail-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 32px;
}

:deep(.cl-table .cl-table__op) { display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; margin-bottom: 0; }
:deep(.cl-table .cl-table__op .el-button) { margin-bottom: 0; }
:deep(.cl-table .cl-table__op .el-button + .el-button) { margin-left: 0; }
</style>
