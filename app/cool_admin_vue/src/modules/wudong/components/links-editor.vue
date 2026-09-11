<template>
	<div class="links-editor">
		<TransitionGroup v-if="rows.length" name="le" tag="div" class="links-editor__list">
			<div v-for="(row, i) in rows" :key="keys[i]" class="links-editor__row">
				<span class="links-editor__index">{{ i + 1 }}</span>

				<el-input
					v-model="row.label"
					class="links-editor__label"
					placeholder="链接文案，如：去看看"
					maxlength="20"
					@input="update"
				/>

				<el-select
					v-model="row.to"
					class="links-editor__path"
					placeholder="从列表中选择跳转页面"
					clearable
					filterable
					:filter-method="onFilter"
					@visible-change="onVisibleChange"
					@change="update"
				>
					<el-option-group
						v-for="g in visibleGroups"
						:key="g.label"
						:label="g.label"
					>
						<el-option
							v-for="o in g.options"
							:key="o.value"
							:label="o.label"
							:value="o.value"
						>
							<div class="links-editor__option">
								<span class="links-editor__option-label">{{ o.label }}</span>
								<span class="links-editor__option-path">{{ o.value }}</span>
							</div>
						</el-option>
					</el-option-group>
				</el-select>

				<el-button
					link
					type="danger"
					:icon="Delete"
					@click="remove(i)"
				/>
			</div>
		</TransitionGroup>

		<div v-else class="links-editor__empty">
			<el-icon><Link /></el-icon>
			<span>暂无导流链接，点击下方按钮添加</span>
		</div>

		<el-button
			class="links-editor__add"
			:icon="Plus"
			dashed
			@click="add"
		>
			添加一条链接
		</el-button>

		<div class="links-editor__tip">
			读者将在推文尾部看到这些链接；每条链接从下拉列表中选择跳转页面（常用页面或其它文化推文）
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { Delete, Link, Plus } from '@element-plus/icons-vue';
import { useCool } from '/@/cool';

defineOptions({
	name: 'ClLinksEditor',
	inheritAttrs: false
});

const props = defineProps<{
	modelValue?: { label: string; to: string }[] | null;
}>();

const emit = defineEmits(['update:modelValue']);

const { service } = useCool();

interface LinkRow {
	label: string;
	to: string;
}

const rows = ref<LinkRow[]>([]);
// 稳定 key，避免输入时行组件重建导致焦点丢失
const keys = ref<string[]>([]);

function normalize(v: any): LinkRow[] {
	return Array.isArray(v)
		? v.map((e: any) => ({ label: e?.label || '', to: e?.to || '' }))
		: [];
}

watch(
	() => props.modelValue,
	(v) => {
		const next = normalize(v);
		if (JSON.stringify(next) !== JSON.stringify(rows.value)) {
			rows.value = next;
			keys.value = next.map(() => Math.random().toString(36).slice(2, 9));
		}
	},
	{ immediate: true, deep: true }
);

function update() {
	emit(
		'update:modelValue',
		rows.value.map((r) => ({ label: r.label, to: r.to }))
	);
}

function add() {
	rows.value.push({ label: '', to: '' });
	keys.value.push(Math.random().toString(36).slice(2, 9));
}

function remove(i: number) {
	rows.value.splice(i, 1);
	keys.value.splice(i, 1);
	update();
}

// 常用页面快捷选项
const pageOptions = [
	{ label: '首页', value: '/' },
	{ label: '商品列表', value: '/goods' },
	{ label: '美食预订', value: '/food' },
	{ label: '高山特产', value: '/food?tab=specialty' },
	{ label: '精选住宿', value: '/stay' },
	{ label: '出行路线', value: '/trip' },
	{ label: '社区广场', value: '/community' }
];

// 文化推文互链选项（读取失败则忽略）
const storyOptions = ref<{ label: string; value: string }[]>([]);

onMounted(async () => {
	try {
		const list = await service.common.story.list({
			page: 1,
			size: 100,
			status: 'PUBLISHED'
		});
		storyOptions.value = (list || []).map((e: any) => ({
			label: e.title,
			value: `/culture/${e.slug}`
		}));
	} catch (e) {
		storyOptions.value = [];
	}
});

const groups = computed(() => {
	const arr = [] as { label: string; options: any[] }[];

	if (storyOptions.value.length) {
		arr.push({ label: '文化推文', options: storyOptions.value });
	}

	arr.push({ label: '常用页面', options: pageOptions });

	return arr;
});

// 下拉检索：同时匹配名称与路径
const query = ref('');

function onFilter(q: string) {
	query.value = q;
}

function onVisibleChange(v: boolean) {
	if (!v) query.value = '';
}

const visibleGroups = computed(() => {
	const q = query.value.trim().toLowerCase();

	if (!q) return groups.value;

	return groups.value
		.map(g => ({
			...g,
			options: g.options.filter(
				o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
			)
		}))
		.filter(g => g.options.length);
});
</script>

<style lang="scss" scoped>
.links-editor {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;

	&__list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	&__row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		background-color: var(--el-fill-color-lighter);
		border: 1px solid transparent;
		border-radius: 8px;
		transition: border-color 0.2s;

		&:hover {
			border-color: var(--el-border-color);
		}
	}

	&__index {
		flex: none;
		width: 20px;
		height: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 12px;
		background-color: var(--el-color-primary-light-9);
		color: var(--el-color-primary);
	}

	&__label {
		width: 36%;
		flex: none;
	}

	&__path {
		flex: 1;
	}

	&__option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	&__option-path {
		font-size: 12px;
		color: var(--el-text-color-placeholder);
	}

	&__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 14px 0;
		border: 1px dashed var(--el-border-color-lighter);
		border-radius: 8px;
		font-size: 13px;
		color: var(--el-text-color-placeholder);
	}

	&__add {
		width: 100%;
		border-style: dashed;
	}

	&__tip {
		font-size: 12px;
		line-height: 1.6;
		color: var(--el-text-color-placeholder);
	}

	:deep(.el-select__popper) {
		.el-select-group__title {
			font-size: 12px;
		}
	}
}

.le-enter-active,
.le-leave-active {
	transition: all 0.25s ease;
}

.le-enter-from,
.le-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}

.le-leave-active {
	position: absolute;
	width: 100%;
}

.le-move {
	transition: transform 0.25s ease;
}
</style>
