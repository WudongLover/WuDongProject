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
		<el-dialog v-model="detailVisible" width="min(1040px, calc(100vw - 32px))" destroy-on-close :show-close="false" class="detail-dialog" align-center>
			<template v-if="detailPost">
				<div class="detail-banner detail-banner--community">
					<div class="detail-banner__main">
						<div class="detail-banner__eyebrow">
							<el-tag size="small" effect="dark" :type="detailPost.status === 'PASSED' ? 'success' : detailPost.status === 'REJECTED' ? 'danger' : 'warning'">
								{{ detailPost.status === 'PASSED' ? '已通过' : detailPost.status === 'REJECTED' ? '已拒绝' : '待审核' }}
							</el-tag>
							<span>社区内容详情 · #{{ detailPost.id }}</span>
						</div>
						<h2 class="detail-banner__title">{{ detailPost.title }}</h2>
						<div class="detail-banner__meta">
							<span class="detail-banner__author">
								<span class="detail-banner__avatar">{{ detailPost.authorName.charAt(0) }}</span>
								{{ detailPost.authorName }}
							</span>
							<el-tag v-if="detailPost.topic" size="small" effect="plain" class="detail-banner__topic">{{ detailPost.topic }}</el-tag>
							<span v-if="detailPost.place" class="detail-banner__place">
								<el-icon><Location /></el-icon> {{ detailPost.place }}
							</span>
							<span>发布于 {{ formatTime(detailPost.publishedAt) }}</span>
						</div>
					</div>
					<div class="detail-banner__status-panel">
						<span>审核状态</span>
						<strong>{{ detailPost.status === 'PASSED' ? '内容已发布' : detailPost.status === 'REJECTED' ? '内容已拦截' : '等待审核决策' }}</strong>
					</div>
				</div>

				<div class="detail-stats">
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--red"><el-icon><Pointer /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailPost.likes }}</span>
							<span class="detail-stats__label">点赞数</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--yellow"><el-icon><Star /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailPost.collects }}</span>
							<span class="detail-stats__label">收藏数</span>
						</div>
					</div>
					<div class="detail-stats__item">
						<div class="detail-stats__icon detail-stats__icon--blue"><el-icon><View /></el-icon></div>
						<div class="detail-stats__info">
							<span class="detail-stats__value">{{ detailPost.views }}</span>
							<span class="detail-stats__label">浏览量</span>
						</div>
					</div>
					<div class="detail-stats__item detail-stats__item--engagement">
						<div class="detail-stats__icon detail-stats__icon--green"><el-icon><ChatDotRound /></el-icon></div>
						<div class="detail-stats__info"><span class="detail-stats__value">{{ engagementRate(detailPost) }}</span><span class="detail-stats__label">互动率</span></div>
					</div>
				</div>

				<div class="detail-layout">
				<div class="detail-main">
				<div v-if="detailPost.images && detailPost.images.length" class="detail-images">
					<div class="detail-section-title"><span>内容媒体</span><small>{{ detailPost.images.length }} 张图片</small></div>
					<div class="detail-images__grid">
					<el-image
						v-for="(img, i) in detailPost.images"
						:key="i"
						:src="img"
						:preview-src-list="detailPost.images"
						fit="cover"
						class="detail-images__item"
					/>
					</div>
				</div>

				<div class="detail-content">
					<div class="detail-card">
						<div class="detail-card__header">
							<span class="detail-card__icon"><el-icon><Reading /></el-icon></span>
							<span class="detail-card__title">帖子正文</span>
						</div>
						<div class="detail-card__body detail-card__body--content">
							{{ detailPost.content }}
						</div>
					</div>
				</div>
				</div>
				<aside class="detail-aside">
					<div class="detail-aside__section">
						<div class="detail-section-title"><span>发布信息</span></div>
						<div class="detail-facts">
							<div><span>内容编号</span><strong>#{{ detailPost.id }}</strong></div>
							<div><span>作者编号</span><strong>#{{ detailPost.userId }}</strong></div>
							<div><span>创建时间</span><strong>{{ formatTime(detailPost.createdAt) }}</strong></div>
						</div>
					</div>
					<div class="detail-aside__hint"><el-icon><InfoFilled /></el-icon><span>审核通过后，内容会在社区广场对游客可见。</span></div>
				</aside>
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
import { Search as SearchIcon, Location, Pointer, Star, View, Reading, ChatDotRound, InfoFilled, Edit, Delete, CircleCheck, CircleClose } from '@element-plus/icons-vue';
import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { ossImage } from '../../utils/oss-image';

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
	const imageFiles = [
		'109_sea-of-clouds-mountain-sunrise_c1b39d04.jpg',
		'112_silversmith-crafting-silver-workshop_748d05e3.jpg',
		'114_long-outdoor-table-banquet-feast_a067861e.jpg',
		'121_traditional-chinese-village-street_e5458950.jpg',
		'126_misty-forest-hiking-trail_641f9d68.jpg'
	];

	const list: PostItem[] = [];
	for (let i = 1; i <= 48; i++) {
		const d = new Date(Date.now() - i * 3600 * 1000 * 6);
		const image = ossImage(imageFiles[i % imageFiles.length]);
		list.push({
			id: 1000 + i,
			userId: 2000 + (i % 6),
			authorName: authors[i % authors.length],
			title: `乌东游记 ${String(i).padStart(2, '0')}：${['云海日出', '苗寨夜色', '长桌宴体验', '银饰制作', '山间徒步', '糯米酒香'][i % 6]}`,
			content:
				'这是一篇来自乌东苗寨的真实游记。清晨五点登上观景台，云海在脚下翻涌，远处的苗寨若隐若现。白天体验了银饰制作，老师傅的手艺令人惊叹。晚上的长桌宴上，酸汤鱼和糯米酒让人回味无穷。',
			images: [image],
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
const statusFilterOptions = [{ label: '全部状态', value: '' }, ...statusOptions];

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

function engagementRate(post: PostItem) {
	if (!post.views) return '0.0%';
	return `${(((post.likes + post.collects) / post.views) * 100).toFixed(1)}%`;
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
			width: 196,
			buttons: ({ scope }: { scope: { row: PostItem } }) => [
				{
					label: '',
					type: 'primary',
					props: { icon: View, size: 'small', title: '查看详情', 'aria-label': '查看详情' },
					onClick: ({ scope }: { scope: { row: PostItem } }) => viewDetail(scope.row.id)
				},
				{
					label: '',
					type: 'primary',
					props: { icon: Edit, size: 'small', title: '编辑内容', 'aria-label': '编辑内容' },
					onClick: ({ scope }: { scope: { row: PostItem } }) => Crud.value?.rowEdit(scope.row)
				},
				...(scope.row.status === 'PENDING'
					? [
						{
							label: '', type: 'success', props: { icon: CircleCheck, size: 'small', title: '审核通过', 'aria-label': '审核通过' },
							onClick: ({ scope }: { scope: { row: PostItem } }) => auditPost(scope.row.id, 'PASSED')
						},
						{
							label: '', type: 'danger', props: { icon: CircleClose, size: 'small', title: '审核拒绝', 'aria-label': '审核拒绝' },
							onClick: ({ scope }: { scope: { row: PostItem } }) => auditPost(scope.row.id, 'REJECTED')
						}
					]
					: []),
				{
					label: '',
					type: 'danger',
					props: { icon: Delete, size: 'small', title: '删除内容', 'aria-label': '删除内容' },
					confirm: '确认删除该帖子？删除后不可恢复。'
				}
			]
		}
	]
});

// ==================== cl-upsert（管理员编辑帖子） ====================
const Upsert = useUpsert({
	dialog: {
		width: '760px',
		height: '74vh',
		class: 'community-upsert-dialog'
	},
	props: {
		labelPosition: 'top'
	},
	op: {
		saveButtonText: '保存内容',
		closeButtonText: '暂不保存'
	},
	items: [
		{
			type: 'tabs',
			props: {
				justify: 'left',
				labels: [
					{ label: '内容编辑', value: '内容编辑' },
					{ label: '内容分发', value: '内容分发' }
				]
			}
		},
		{
			prop: 'title',
			label: '内容标题',
			group: '内容编辑',
			span: 24,
			component: { name: 'el-input', props: { maxlength: 60, showWordLimit: true, placeholder: '用清晰的标题概括本条内容' } },
			required: true
		},
		{
			prop: 'topic',
			label: '关联话题',
			group: '内容编辑',
			span: 12,
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
			label: '发布地点',
			group: '内容编辑',
			span: 12,
			component: { name: 'el-input', props: { placeholder: '例如：苗寨中心' } }
		},
		{
			prop: 'content',
			label: '正文内容',
			group: '内容编辑',
			span: 24,
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 8,
					maxlength: 1000,
					showWordLimit: true,
					placeholder: '填写游记、体验或社区动态正文...'
				}
			},
			required: true
		},
		{
			prop: 'images',
			label: '内容图片',
			group: '内容编辑',
			span: 24,
			component: { name: 'cl-upload', props: { multiple: true, limit: 9, draggable: true } }
		},
		{
			prop: 'status',
			label: '审核状态',
			group: '内容分发',
			span: 24,
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
				options: statusFilterOptions,
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
	.el-dialog { overflow: hidden; border-radius: 12px; }
	.el-dialog__body { padding: 0; background: #f7f8f5; }
	.el-dialog__footer { padding: 0; border-top: 1px solid #dce1da; background: #fff; }
}

:deep(.community-upsert-dialog) {
	.el-dialog { border-radius: 12px; overflow: hidden; }
	.el-dialog__header { margin-right: 0; padding: 22px 28px; border-bottom: 1px solid #e3e7e0; background: #fbfcf9; }
	.el-dialog__title { color: #19362d; font-size: 18px; font-weight: 700; }
	.el-dialog__body { padding: 26px 28px 8px; }
	.el-form-item__label { color: #53645d; font-weight: 600; }
	.el-textarea__inner, .el-input__wrapper { box-shadow: 0 0 0 1px #d9e1d8 inset; }
	.el-textarea__inner:focus, .el-input__wrapper.is-focus { box-shadow: 0 0 0 1px #287a5a inset; }
	.el-dialog__footer { border-top: 1px solid #e3e7e0; padding: 16px 28px; }
}

.detail-banner {
	display: flex;
	align-items: end;
	justify-content: space-between;
	gap: 24px;
	padding: 34px 40px 30px;
	color: #fff;
	position: relative;
	overflow: hidden;

	&--community {
		background: #173d32;
		background-image: linear-gradient(120deg, rgba(22, 57, 47, 0.96), rgba(42, 100, 75, 0.91)), repeating-linear-gradient(90deg, transparent 0, transparent 24px, rgba(255, 255, 255, 0.035) 25px);
	}

	&::after {
		content: '';
		position: absolute;
		right: 12%;
		top: -92px;
		width: 280px;
		height: 280px;
		border-radius: 50%;
		background: rgba(235, 190, 101, 0.12);
	}

	&__main { position: relative; z-index: 1; }
	&__eyebrow { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; color: rgba(255, 255, 255, 0.72); font-size: 12px; letter-spacing: 0; }
	&__title { max-width: 720px; margin: 0 0 14px; font-size: clamp(23px, 3vw, 32px); font-weight: 700; line-height: 1.35; letter-spacing: 0; }
	&__meta {
		margin: 0;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.82);
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
		background: #e8bb63;
		color: #1d3b31;
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

	&__topic { --el-tag-border-color: rgba(255,255,255,.35); --el-tag-text-color: #fff; --el-tag-bg-color: rgba(255,255,255,.1); }
	&__status-panel { position: relative; z-index: 1; min-width: 154px; padding: 14px 16px; border: 1px solid rgba(255,255,255,.2); background: rgba(11, 35, 27, .3); }
	&__status-panel span { display: block; margin-bottom: 7px; color: rgba(255,255,255,.62); font-size: 12px; }
	&__status-panel strong { display: block; font-size: 15px; line-height: 1.35; }
}

.detail-stats {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0;
	padding: 0 40px;
	background: #fff;
	border-bottom: 1px solid #e2e7df;

	&__item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 19px 16px;
		border-right: 1px solid #e7ebe5;
		&:last-child { border-right: 0; }
	}

	&__icon {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		&--red { background: #fcebe5; color: #b8492d; }
		&--yellow { background: #f9efd7; color: #a76e0a; }
		&--blue { background: #e5eff1; color: #216272; }
		&--green { background: #e6f0e8; color: #287a5a; }
	}

	&__info { display: flex; flex-direction: column; }
	&__value { font-size: 20px; font-weight: 700; color: #1e332b; line-height: 1.2; }
	&__label { font-size: 12px; color: #728078; margin-top: 3px; }
}

.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 235px; gap: 0; }
.detail-main { min-width: 0; padding: 28px 32px 32px 40px; background: #fff; }
.detail-aside { padding: 28px 24px; border-left: 1px solid #e2e7df; background: #f7f8f5; }
.detail-aside__section { padding-bottom: 24px; }
.detail-aside__hint { display: flex; align-items: flex-start; gap: 8px; padding: 13px; color: #56665d; font-size: 12px; line-height: 1.65; border-left: 3px solid #d6a947; background: #fffdf6; }
.detail-aside__hint .el-icon { margin-top: 3px; color: #a76e0a; }
.detail-section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; color: #25473b; font-size: 14px; font-weight: 700; }
.detail-section-title small { color: #89948e; font-size: 12px; font-weight: 400; }
.detail-facts { display: grid; gap: 15px; }
.detail-facts div { display: grid; gap: 4px; }
.detail-facts span { color: #829087; font-size: 12px; }
.detail-facts strong { color: #30463b; font-size: 12px; font-weight: 600; line-height: 1.45; word-break: break-word; }

.detail-images {
	margin-bottom: 26px;
	&__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(144px, 1fr)); grid-auto-flow: dense; gap: 8px; }

	&__item {
		width: 100%;
		height: 130px;
		border-radius: 6px;
		cursor: pointer;
		overflow: hidden;
		transition: transform .28s ease, filter .28s ease;
		&:hover { transform: translateY(-3px); filter: saturate(1.1) contrast(1.05); }
	}
}

.detail-content {
	padding: 0;
}

.detail-card {
	background: #fff;
	border: 1px solid #dfe6dc;
	border-radius: 6px;
	overflow: hidden;

	&__header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 13px 17px;
		background: #f7f9f5;
		border-bottom: 1px solid #e3e8e1;
	}

	&__icon { font-size: 18px; }
	&__title { font-size: 14px; font-weight: 700; color: #25473b; }

	&__body {
		padding: 20px;
		line-height: 1.8;
		color: #506158;
		font-size: 14px;

		&--content {
			white-space: pre-wrap;
			color: #30453b;
			font-size: 15px;
			line-height: 2;
		}
	}
}

.detail-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 40px;

	:deep(.el-button--success) { --el-button-bg-color: #287a5a; --el-button-border-color: #287a5a; --el-button-hover-bg-color: #21684d; }
}

:deep(.cl-table .cl-table__op) { display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; margin-bottom: 0; }
:deep(.cl-table .cl-table__op .el-button) { margin-bottom: 0; }
:deep(.cl-table .cl-table__op .el-button + .el-button) { margin-left: 0; }

@media (max-width: 720px) {
	.detail-banner { display: block; padding: 27px 24px 24px; }
	.detail-banner__status-panel { margin-top: 20px; width: fit-content; }
	.detail-banner__title { font-size: 23px; }
	.detail-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 0 16px; }
	.detail-stats__item { border-bottom: 1px solid #e7ebe5; }
	.detail-stats__item:nth-child(2n) { border-right: 0; }
	.detail-layout { grid-template-columns: 1fr; }
	.detail-main { padding: 24px 20px; }
	.detail-aside { padding: 20px; border-left: 0; border-top: 1px solid #e2e7df; }
	.detail-facts { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
	.detail-footer { padding: 14px 20px; }
}
</style>
