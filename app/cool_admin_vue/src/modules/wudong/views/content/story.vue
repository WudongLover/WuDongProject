<template>
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 -->
			<cl-add-btn />
			<!-- 删除按钮 -->
			<cl-multi-delete-btn />
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

		<!-- 新增、编辑 -->
		<cl-upsert ref="Upsert" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-content-story'
});

import { useCrud, useSearch, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { reactive } from 'vue';
import LinksEditor from '../../components/links-editor.vue';

const { service } = useCool();

const options = reactive({
	module: [
		{ label: '衣 · 非遗', value: 'YI', type: 'primary' },
		{ label: '食 · 风味', value: 'SHI', type: 'success' },
		{ label: '住 · 山居', value: 'ZHU', type: 'warning' },
		{ label: '行 · 山水', value: 'XING', type: 'info' }
	],
	status: [
		{ label: '草稿', value: 'DRAFT', type: 'info' },
		{ label: '已发布', value: 'PUBLISHED', type: 'success' },
		{ label: '已下线', value: 'OFFLINE', type: 'danger' }
	]
});

// cl-table
const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{
			label: '模块',
			prop: 'module',
			dict: options.module,
			width: 110
		},
		{
			label: '封面',
			prop: 'cover',
			width: 90,
			component: { name: 'cl-avatar', props: { shape: 'square' } }
		},
		{
			label: '标题',
			prop: 'title',
			minWidth: 200,
			showOverflowTooltip: true
		},
		{
			label: '状态',
			prop: 'status',
			dict: options.status,
			width: 100
		},
		{
			label: '排序',
			prop: 'sort',
			width: 80,
			sortable: 'asc'
		},
		{
			label: '发布时间',
			prop: 'published_at',
			width: 170,
			sortable: 'desc'
		},
		{ type: 'op', width: 160 }
	]
});

// 新增时自动生成 slug（唯一性由后端 modifyBefore 兜底查重）
function genSlug(form: any) {
	return `${(form.module || 'story').toLowerCase()}-${Date.now().toString(36)}`;
}

// 表单标签：主文案 + 弱化说明（弹窗被 teleport 到 body，样式只能用行内）
function label(main: string, hint?: string) {
	return ({ h }: any) =>
		h('span', { style: 'display:inline-flex;align-items:baseline;gap:6px' }, [
			main,
			hint
				? h(
						'em',
						{
							style:
								'font-style:normal;font-weight:400;font-size:12px;color:var(--el-text-color-placeholder)'
						},
						hint
					)
				: null
		]);
}

// cl-upsert
const Upsert = useUpsert({
	// 固定弹窗尺寸，内容在弹窗内滚动，避免整页被表单撑高
	dialog: {
		width: '960px',
		height: '74vh'
	},

	// 标签统一在字段上方，配合分栏栅格阅读
	props: {
		labelPosition: 'top'
	},

	items: [
		{
			label: '标题',
			prop: 'title',
			span: 24,
			component: {
				name: 'el-input',
				props: { placeholder: '一句话说清这篇推文讲的是什么' }
			},
			required: true,
			hook: {
				// 新增时：slug 为空则自动生成；导语为空则取正文首段
				// 注意此时 paragraphs 尚未经过自身 submit hook，仍是空行分段的字符串
				submit: (value: any, { form }: any) => {
					if (!form.id) {
						if (!form.slug) {
							form.slug = genSlug(form);
						}
						if (!form.summary) {
							const first = Array.isArray(form.paragraphs)
								? form.paragraphs[0] || ''
								: String(form.paragraphs || '').split(/\n+/)[0] || '';
							form.summary = first.trim().slice(0, 80);
						}
					}
					return value;
				}
			}
		},
		{
			label: '所属模块',
			prop: 'module',
			value: 'YI',
			span: 12,
			component: { name: 'cl-select', props: { options: options.module } },
			required: true
		},
		{
			label: '状态',
			prop: 'status',
			value: 'PUBLISHED',
			span: 12,
			component: { name: 'cl-select', props: { options: options.status } },
			required: true
		},
		{
			label: '正文',
			renderLabel: label('正文', '段落之间空一行'),
			prop: 'paragraphs',
			span: 16,
			hook: {
				bind: (value: any) => (Array.isArray(value) ? value.join('\n\n') : value || ''),
				submit: (value: any) =>
					typeof value === 'string'
						? value
								.split(/\n+/)
								.map(e => e.trim())
								.filter(Boolean)
						: value
			},
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					autosize: { minRows: 9, maxRows: 18 },
					placeholder: '写下这篇推文的内容'
				}
			}
		},
		{
			label: '封面图',
			renderLabel: label('封面图', '建议 3:2 横图'),
			prop: 'cover',
			span: 8,
			component: {
				name: 'cl-upload',
				props: {
					// [高, 宽]，与正文框高度接近，视觉上对齐
					size: [176, 264],
					text: '选择封面',
					showTag: false
				}
			}
		},
		{
			label: '尾部导流链接',
			prop: 'links',
			span: 24,
			hook: {
				// 兜底：保证进入编辑器的是数组
				bind: (value: any) => (Array.isArray(value) ? value : []),
				// 提交前过滤空白行并去首尾空格
				submit: (value: any) =>
					Array.isArray(value)
						? value
								.filter((e: any) => (e?.label || '').trim() || (e?.to || '').trim())
								.map((e: any) => ({
									label: (e.label || '').trim(),
									to: (e.to || '').trim()
								}))
						: []
			},
			component: {
				name: 'cl-links-editor',
				vm: LinksEditor
			}
		}
	]
});

// cl-search
const Search = useSearch({
	items: [
		{
			label: '模块',
			prop: 'module',
			component: { name: 'cl-select', props: { options: options.module } }
		},
		{
			label: '状态',
			prop: 'status',
			component: { name: 'cl-select', props: { options: options.status } }
		},
		{
			label: '关键字',
			prop: 'keyWord',
			component: {
				name: 'el-input',
				props: { placeholder: '搜索标题、slug、导语', clearable: true }
			}
		}
	]
});

// cl-crud
const Crud = useCrud(
	{
		service: service.common.story
	},
	app => {
		app.refresh();
	}
);
</script>
