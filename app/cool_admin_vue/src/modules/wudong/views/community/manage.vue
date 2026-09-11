<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 批量删除 -->
			<cl-multi-delete-btn />
			<el-button type="warning" :icon="SearchIcon" @click="openAuditDialog">
				批量审核
			</el-button>
			<cl-flex1 />

			<!-- 搜索 -->
			<cl-search ref="Search" />
		</cl-row>

		<cl-row>
			<!-- 数据表格 -->
			<cl-table ref="Table" />
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<!-- 分页控件 -->
			<cl-pagination />
		</cl-row>

		<!-- 新增、编辑（此处用于管理员编辑帖子内容） -->
		<cl-upsert ref="Upsert" />

		<!-- 帖子详情弹窗 -->
		<el-dialog v-model="detailVisible" width="820px" destroy-on-close :show-close="false" class="detail-dialog">
			<template v-if="detailPost">
				<!-- 顶部 Banner -->
				<div class="detail-banner detail-banner--community">
					<div class="detail-banner__main">
						<div class="detail-banner__tag">
							<el-tag size="small" effect="dark" :type="detailPost.status === 'PASSED' ? 'success' : detailPost.status === 'REJECTED' ? 'danger' : 'warning'">
								{{ detailPost.status === 'PASSED' ? '已通过' : detailPost.status === 'REJECTED' ? '已拒绝' : '待审核' }}
							</el-tag>
							<el-tag v-if="detailPost.topic" size="small" effect="plain">{{ detailPost.topic }}</el-tag>
						</div>
						<h2 class="detail-banner__title">{{ detailPost.title }}</h2>
						<p class="detail-banner__subtitle">
							<span class="detail-banner__author">
								<span class="detail-banner__avatar">{{ detailPost.authorName.charAt(0) }}</span>
								{{ detailPost.authorName }}
							</span>
							<span v-if="detailPost.place" class="detail-banner__place">
								<el-icon><Location /></el-icon> {{ detailPost.place }}
							</span>
							<span>发布于 {{ formatTime(detailPost.publishedAt) }}</span>
						</p>
					</div>
				</div>

				<!-- 数据概览 -->
				<div class="detail-stats">
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--red">👍</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailPost.likes }}</span>
							<span class="detail-stats__label">点赞数</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--yellow">⭐</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailPost.collects }}</span>
							<span class="detail-stats__label">收藏数</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--blue">👁</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailPost.views }}</span>
							<span class="detail-stats__label">浏览量</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--green">📝</div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">#{{ detailPost.id }}</span>
							<span class="detail-stats__label">帖子编号</span>
						</div>
					</div>
				</div>

				<!-- 图片展示 -->
				<div v-if="detailPost.images && detailPost.images.length" class="detail-images">
					<el-image
						v-for="(img, i) in detailPost.images"
						:key="i"
						:src="img"
						:preview-src-list="detailPost.images"
						fit="cover"
						class="detail-images__item"
					/>
				</div>

				<!-- 内容卡片区域 -->
				<div class="detail-content">
					<div class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon">📖</span>
							<span class="detail-card__title">帖子正文</span>
						</div>
						<div class="detail-card__body detail-card__body--content">
							{{ detailPost.content }}
						</div>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="detail-footer">
					<el-button size="large" @click="detailVisible = false">关闭</el-button>
					<el-button
						v-if="detailPost?.status === 'PENDING'"
						size="large"
						type="success"
						@click="auditPost(detailPost.id, 'PASSED')"
					>
						审核通过
					</el-button>
					<el-button
						v-if="detailPost?.status === 'PENDING'"
						size="large"
						type="danger"
						@click="auditPost(detailPost.id, 'REJECTED')"
					>
						审核拒绝
					</el-button>
				</div>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-community-manage'
});

import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search as SearchIcon, Location } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';

const { service } = useCool();

// ==================== 类型定义 ====================
type PostStatus = 'PENDING' | 'PASSED' | 'REJECTED';

interface PostItem {
	id: number;
	userId: number;
	authorName: string;
	title: string;
	content: string;
	images: string[];
	topic: string;
	place: string;
	likes: number;
	collects: number;
	views: number;
	status: PostStatus;
	publishedAt: string;
	createdAt: string;
}

// ==================== Mock 数据层 ====================
// 说明：当前管理端后端暂无社区帖子的 CRUD 接口，此处使用前端 Mock Service。
// 后端接口就绪后，将下方 mockService 替换为 service.community.post（或对应路径）即可，
// 需后端实现标准 cool-admin 接口：page / info / update / delete / add。
const mockDB = reactive<PostItem[]>(generateMockPosts());

function generateMockPosts(): PostItem[] {
	const topics = ['#乌东云海', '#苗年节', '#长桌宴', '#非遗手作', '#亲子研学', '#山居生活'];
	const places = ['观景台', '苗寨中心', '酸汤鱼馆', '银饰作坊', '云上山居', '芦笙场'];
	const authors = ['苗岭小哥', '旅行的猫', '山居日记', '摄影师阿杰', '美食猎人', '亲子游天下'];
	const statuses: PostStatus[] = ['PENDING', 'PASSED', 'PASSED', 'PASSED', 'REJECTED'];

	const list: PostItem[] = [];
	for (let i = 1; i <= 48; i++) {
		const d = new Date(Date.now() - i * 3600 * 1000 * 6);
		list.push({
			id: 1000 + i,
			userId: 2000 + (i % 6),
			authorName: authors[i % authors.length],
			title: `乌东游记 ${String(i).padStart(2, '0')}：${['云海日出', '苗寨夜色', '长桌宴体验', '银饰制作', '山间徒步', '糯米酒香'][i % 6]}`,
			content:
				'这是一篇来自乌东苗寨的真实游记。清晨五点登上观景台，云海在脚下翻涌，远处的苗寨若隐若现。白天体验了银饰制作，老师傅的手艺令人惊叹。晚上的长桌宴上，酸汤鱼和糯米酒让人回味无穷。',
			images: [],
			topic: topics[i % topics.length],
			place: places[i % places.length],
			likes: Math.floor(Math.random() * 500),
			collects: Math.floor(Math.random() * 200),
			views: Math.floor(Math.random() * 5000) + 100,
			status: statuses[i % statuses.length],
			publishedAt: d.toISOString(),
			createdAt: d.toISOString()
		});
	}
	return list;
}

// Mock Service —— 实现 cool-admin BaseService 的核心方法
const mockService = {
	async page(data: {
		page: number;
		size: number;
		title?: string;
		topic?: string;
		status?: PostStatus;
	}) {
		let rows = [...mockDB];
		if (data.title) {
			rows = rows.filter(r => r.title.includes(data.title!));
		}
		if (data.topic) {
			rows = rows.filter(r => r.topic === data.topic);
		}
		if (data.status) {
			rows = rows.filter(r => r.status === data.status);
		}
		const total = rows.length;
		const start = (data.page - 1) * data.size;
		const list = rows.slice(start, start + data.size);
		return {
			list,
			pagination: {
				page: data.page,
				size: data.size,
				total
			}
		};
	},

	async info(params: { id: number }) {
		return mockDB.find(r => r.id === params.id) || null;
	},

	async update(data: Partial<PostItem> & { id: number }) {
		const idx = mockDB.findIndex(r => r.id === data.id);
		if (idx >= 0) {
			mockDB[idx] = { ...mockDB[idx], ...data };
		}
		return true;
	},

	async delete(data: { ids: number[] }) {
		for (const id of data.ids) {
			const idx = mockDB.findIndex(r => r.id === id);
			if (idx >= 0) mockDB.splice(idx, 1);
		}
		return true;
	},

	async add(data: Partial<PostItem>) {
		const id = Math.max(...mockDB.map(r => r.id)) + 1;
		const now = new Date().toISOString();
		mockDB.unshift({
			id,
			userId: 0,
			authorName: '管理员发布',
			title: data.title || '',
			content: data.content || '',
			images: data.images || [],
			topic: data.topic || '',
			place: data.place || '',
			likes: 0,
			collects: 0,
			views: 0,
			status: 'PASSED',
			publishedAt: now,
			createdAt: now
		});
		return true;
	}
};

// ==================== 字典选项 ====================
const statusOptions = [
	{ label: '待审核', value: 'PENDING', type: 'warning' },
	{ label: '已通过', value: 'PASSED', type: 'success' },
	{ label: '已拒绝', value: 'REJECTED', type: 'danger' }
];

const topicOptions = [
	{ label: '#乌东云海', value: '#乌东云海' },
	{ label: '#苗年节', value: '#苗年节' },
	{ label: '#长桌宴', value: '#长桌宴' },
	{ label: '#非遗手作', value: '#非遗手作' },
	{ label: '#亲子研学', value: '#亲子研学' },
	{ label: '#山居生活', value: '#山居生活' }
];

// ==================== 详情弹窗 ====================
const detailVisible = ref(false);
const detailPost = ref<PostItem | null>(null);

function formatTime(iso: string) {
	if (!iso) return '-';
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function viewDetail(id: number) {
	const post = await mockService.info({ id });
	detailPost.value = post;
	detailVisible.value = true;
}

async function auditPost(id: number, status: PostStatus) {
	try {
		await ElMessageBox.confirm(
			`确认将该帖子审核为「${status === 'PASSED' ? '通过' : '拒绝'}」？`,
			'审核确认',
			{ type: 'warning' }
		);
		await mockService.update({ id, status });
		ElMessage.success('审核操作成功');
		detailVisible.value = false;
		Crud.value?.refresh();
	} catch {
		/* 用户取消 */
	}
}

// 批量审核（仅对选中的待审核帖子执行通过）
async function openAuditDialog() {
	const selection: PostItem[] = Table.value?.selection || [];
	if (selection.length === 0) {
		ElMessage.warning('请先勾选要审核的帖子');
		return;
	}
	const pending = selection.filter(r => r.status === 'PENDING');
	if (pending.length === 0) {
		ElMessage.info('选中的帖子中没有待审核项');
		return;
	}
	try {
		await ElMessageBox.confirm(
			`将对 ${pending.length} 条待审核帖子执行「通过」操作，是否继续？`,
			'批量审核',
			{ type: 'warning' }
		);
		for (const p of pending) {
			await mockService.update({ id: p.id, status: 'PASSED' });
		}
		ElMessage.success(`已通过 ${pending.length} 条帖子`);
		Crud.value?.refresh();
	} catch {
		/* 用户取消 */
	}
}

// ==================== cl-table ====================
const Table = useTable({
	columns: [
		{
			type: 'selection',
			width: 60
		},
		{
			label: 'ID',
			prop: 'id',
			width: 90
		},
		{
			label: '标题',
			prop: 'title',
			minWidth: 240,
			showOverflowTooltip: true
		},
		{
			label: '作者',
			prop: 'authorName',
			width: 120
		},
		{
			label: '话题',
			prop: 'topic',
			width: 120,
			component: {
				name: 'el-tag',
				props: {
					size: 'small',
					effect: 'plain'
				}
			}
		},
		{
			label: '地点',
			prop: 'place',
			width: 120
		},
		{
			label: '点赞',
			prop: 'likes',
			width: 80,
			sortable: true
		},
		{
			label: '收藏',
			prop: 'collects',
			width: 80
		},
		{
			label: '浏览',
			prop: 'views',
			width: 90,
			sortable: true
		},
		{
			label: '状态',
			prop: 'status',
			width: 100,
			dict: statusOptions
		},
		{
			label: '发布时间',
			prop: 'publishedAt',
			width: 170,
			sortable: 'desc',
			component: {
				name: 'el-text',
				props: {
					size: 'small'
				},
				valuePrepare: (row: PostItem) => formatTime(row.publishedAt)
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
					onClick: ({ scope }: { scope: { row: PostItem } }) => viewDetail(scope.row.id)
				},
				{
					label: '通过',
					type: 'success',
					text: true,
					show: ({ scope }: { scope: { row: PostItem } }) => scope.row.status === 'PENDING',
					onClick: ({ scope }: { scope: { row: PostItem } }) => auditPost(scope.row.id, 'PASSED')
				},
				{
					label: '拒绝',
					type: 'danger',
					text: true,
					show: ({ scope }: { scope: { row: PostItem } }) => scope.row.status === 'PENDING',
					onClick: ({ scope }: { scope: { row: PostItem } }) => auditPost(scope.row.id, 'REJECTED')
				},
				{
					label: '删除',
					type: 'danger',
					text: true,
					confirm: '确认删除该帖子？删除后不可恢复。'
				}
			]
		}
	]
});

// ==================== cl-upsert（管理员编辑帖子） ====================
const Upsert = useUpsert({
	items: [
		{
			prop: 'title',
			label: '标题',
			component: { name: 'el-input' },
			required: true
		},
		{
			prop: 'topic',
			label: '话题',
			component: {
				name: 'el-select',
				options: topicOptions,
				props: {
					clearable: true,
					placeholder: '请选择话题'
				}
			}
		},
		{
			prop: 'place',
			label: '地点',
			component: { name: 'el-input' }
		},
		{
			prop: 'content',
			label: '内容',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 5
				}
			},
			required: true
		},
		{
			prop: 'status',
			label: '状态',
			value: 'PASSED',
			component: {
				name: 'el-radio-group',
				options: statusOptions
			}
		}
	]
});

// ==================== cl-search ====================
const Search = useSearch({
	items: [
		{
			prop: 'title',
			label: '标题关键词',
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					placeholder: '输入标题关键词'
				}
			}
		},
		{
			prop: 'topic',
			label: '话题',
			component: {
				name: 'el-select',
				options: topicOptions,
				props: {
					clearable: true,
					placeholder: '全部话题'
				}
			}
		},
		{
			prop: 'status',
			label: '状态',
			component: {
				name: 'el-select',
				options: statusOptions,
				props: {
					clearable: true,
					placeholder: '全部状态'
				}
			}
		}
	]
});

// ==================== cl-crud ====================
const Crud = useCrud(
	{
		service: mockService
	},
	app => {
		app.refresh();
	}
);
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

	&--community {
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

	&__main { position: relative; z-index: 1; }
	&__tag { display: flex; gap: 8px; margin-bottom: 12px; }
	&__title { margin: 0 0 10px; font-size: 22px; font-weight: 600; line-height: 1.4; }
	&__subtitle {
		margin: 0;
		font-size: 13px;
		opacity: 0.9;
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	&__author {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	&__avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
	}

	&__place {
		display: inline-flex;
		align-items: center;
		gap: 2px;
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
		&--red { background: #ffebee; }
		&--yellow { background: #fffde7; }
		&--blue { background: #e3f2fd; }
		&--green { background: #e8f5e9; }
	}

	&__info { display: flex; flex-direction: column; }
	&__value { font-size: 20px; font-weight: 600; color: #303133; line-height: 1.2; }
	&__label { font-size: 12px; color: #909399; margin-top: 2px; }
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
		padding: 20px;
		line-height: 1.8;
		color: #606266;
		font-size: 14px;

		&--content {
			white-space: pre-wrap;
			color: #303133;
			font-size: 15px;
			line-height: 2;
		}
	}
}

.detail-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 32px;
}
</style>
