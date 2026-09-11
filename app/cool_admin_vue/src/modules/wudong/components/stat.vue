<template>
	<div class="wd-stat">
		<div class="wd-stat__head">
			<span class="label">{{ label }}</span>

			<div v-if="icon" class="icon" :style="{ color, backgroundColor: `${color}1a` }">
				<cl-svg :name="icon" :size="22" />
			</div>
		</div>

		<div class="wd-stat__value">
			<span class="num">{{ text }}</span>
			<span v-if="unit" class="unit">{{ unit }}</span>
		</div>

		<div class="wd-stat__footer">
			<span v-if="trend" class="trend" :class="trendType">
				<el-icon>
					<top-right v-if="trendType == 'up'" />
					<bottom-right v-else />
				</el-icon>
				{{ trend }}
			</span>
			<span class="desc">{{ desc }}</span>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { BottomRight, TopRight } from '@element-plus/icons-vue';
import { money as formatMoney, number as formatNumber } from '../utils/demo';

defineOptions({
	name: 'wd-stat'
});

const props = withDefaults(
	defineProps<{
		label: string;
		value: string | number;
		unit?: string;
		icon?: string;
		color?: string;
		trend?: string;
		trendType?: 'up' | 'down';
		desc?: string;
		money?: boolean;
	}>(),
	{
		unit: '',
		icon: '',
		color: '#23456b',
		trend: '',
		trendType: 'up',
		desc: '',
		money: false
	}
);

const text = computed(() => {
	if (props.money) {
		return formatMoney(props.value);
	}
	return formatNumber(props.value);
});
</script>

<style lang="scss" scoped>
.wd-stat {
	height: 100%;
	box-sizing: border-box;
	padding: 18px 20px 14px;
	border: 1px solid var(--el-border-color-extra-light);
	border-radius: 10px;
	background-color: var(--el-bg-color);
	user-select: none;

	&__head {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.label {
			font-size: 14px;
			color: var(--el-text-color-regular);
		}

		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 38px;
			height: 38px;
			border-radius: 9px;
		}
	}

	&__value {
		margin-top: 14px;
		line-height: 1;

		.num {
			font-size: 28px;
			font-weight: 700;
			color: var(--el-text-color-primary);
			letter-spacing: 0.5px;
		}

		.unit {
			margin-left: 5px;
			font-size: 12px;
			color: var(--el-text-color-secondary);
		}
	}

	&__footer {
		display: flex;
		align-items: center;
		margin-top: 12px;
		min-height: 20px;

		.trend {
			display: inline-flex;
			align-items: center;
			font-size: 12px;
			margin-right: 8px;

			&.up {
				color: var(--el-color-danger);
			}

			&.down {
				color: var(--el-color-success);
			}
		}

		.desc {
			font-size: 12px;
			color: var(--el-text-color-secondary);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}
</style>
