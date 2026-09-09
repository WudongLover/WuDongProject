<template>
	<div v-if="rows.length" class="wd-rank">
		<div v-for="(row, index) in rows" :key="row.name" class="wd-rank__item">
			<span
				class="idx"
				:class="{
					'is-1': index === 0,
					'is-2': index === 1,
					'is-3': index === 2
				}"
			>
				{{ index + 1 }}
			</span>

			<div class="main">
				<div class="name">
					<span class="text">{{ row.name }}</span>
					<el-tag
						v-if="row.status"
						:type="row.status.type || 'info'"
						size="small"
						effect="light"
						class="tag"
					>
						{{ row.status.label }}
					</el-tag>
				</div>
				<div v-if="row.desc" class="desc">{{ row.desc }}</div>
			</div>

			<div class="value">
				<span class="num">{{ row.value }}</span>
				<span v-if="row.unit" class="unit">{{ row.unit }}</span>

				<span v-if="row.trend" class="trend" :class="row.trendType || 'up'">
					{{ row.trend }}
				</span>
			</div>
		</div>
	</div>

	<el-empty v-else :description="empty" :image-size="60" />
</template>

<script lang="ts" setup>
import type { WdRankRow } from '../types';

defineOptions({
	name: 'wd-rank'
});

withDefaults(
	defineProps<{
		rows: WdRankRow[];
		empty?: string;
	}>(),
	{
		rows: () => [],
		empty: '暂无数据'
	}
);
</script>

<style lang="scss" scoped>
.wd-rank {
	&__item {
		display: flex;
		align-items: center;
		padding: 10px 2px;
		border-bottom: 1px dashed var(--el-border-color-extra-light);

		&:last-child {
			border-bottom: 0;
		}

		.idx {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			height: 20px;
			border-radius: 6px;
			font-size: 12px;
			flex-shrink: 0;
			background-color: var(--el-fill-color-light);
			color: var(--el-text-color-secondary);

			&.is-1 {
				background-color: #f6e8c9;
				color: #b7811d;
			}

			&.is-2 {
				background-color: #e8eef6;
				color: #5b7ba6;
			}

			&.is-3 {
				background-color: #f4e4dc;
				color: #a2663f;
			}
		}

		.main {
			flex: 1;
			min-width: 0;
			margin-left: 10px;

			.name {
				display: flex;
				align-items: center;
				min-width: 0;

				.text {
					font-size: 14px;
					color: var(--el-text-color-primary);
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.tag {
					margin-left: 8px;
				}
			}

			.desc {
				margin-top: 3px;
				font-size: 12px;
				color: var(--el-text-color-secondary);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.value {
			margin-left: 12px;
			text-align: right;
			flex-shrink: 0;

			.num {
				font-size: 15px;
				font-weight: 600;
				color: var(--el-text-color-primary);
			}

			.unit {
				margin-left: 3px;
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}

			.trend {
				display: block;
				margin-top: 2px;
				font-size: 12px;

				&.up {
					color: var(--el-color-danger);
				}

				&.down {
					color: var(--el-color-success);
				}
			}
		}
	}
}
</style>
