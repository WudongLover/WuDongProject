<template>
	<div class="wd-trend" :style="{ height }">
		<v-chart :option="option" autoresize />
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDark } from '@vueuse/core';
import type { WdTrendSeries } from '../types';

defineOptions({
	name: 'wd-trend'
});

const props = withDefaults(
	defineProps<{
		categories: string[];
		series: WdTrendSeries[];
		height?: string;
		rightName?: string;
	}>(),
	{
		height: '300px',
		rightName: ''
	}
);

const isDark = useDark();

const palette = ['#23456b', '#c08a2d', '#67c23a', '#b5442e', '#7a8b99', '#2fb8ac'];

const colors = computed(() => {
	const hex = getComputedStyle(document.documentElement)
		.getPropertyValue('--el-color-primary')
		.trim();
	return [hex || palette[0], ...palette.slice(1)];
});

const textColor = computed(() => (isDark.value ? '#d8dce5' : '#667085'));
const splitColor = computed(() => (isDark.value ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'));

const option = computed(() => {
	const hasRight = props.series.some(e => e.yAxisIndex === 1);

	function axis(index = 0) {
		return {
			type: 'value',
			...(index === 1
				? {
						name: props.rightName,
						nameTextStyle: {
							color: textColor.value
						}
					}
				: {}),
			axisLabel: {
				color: textColor.value
			},
			splitLine: {
				lineStyle: {
					color: splitColor.value
				}
			}
		};
	}

	return {
		grid: {
			left: 12,
			right: 20,
			top: 42,
			bottom: 4,
			containLabel: true
		},
		legend: {
			top: 8,
			right: 8,
			icon: 'roundRect',
			itemWidth: 14,
			itemHeight: 5,
			textStyle: {
				color: textColor.value
			}
		},
		tooltip: {
			trigger: 'axis',
			backgroundColor: isDark.value ? 'rgba(30,34,46,0.95)' : 'rgba(255,255,255,0.96)',
			borderColor: 'rgba(0,0,0,0.04)',
			textStyle: {
				color: textColor.value
			}
		},
		xAxis: {
			type: 'category',
			data: props.categories,
			boundaryGap: props.series.some(e => e.type === 'bar'),
			axisTick: {
				show: false
			},
			axisLine: {
				lineStyle: {
					color: splitColor.value
				}
			},
			axisLabel: {
				color: textColor.value
			}
		},
		yAxis: [axis(0), ...(hasRight ? [axis(1)] : [])],
		series: props.series.map((item, index) => {
			const color = item.color || colors.value[index % colors.value.length];
			const base: any = {
				name: item.name,
				type: item.type || 'line',
				data: item.data,
				yAxisIndex: item.yAxisIndex || 0,
				smooth: (item.type || 'line') === 'line',
				showSymbol: false,
				itemStyle: {
					color
				}
			};

			if ((item.type || 'line') === 'line') {
				base.lineStyle = {
					width: 2
				};

				if (item.area) {
					base.areaStyle = {
						opacity: 0.14
					};
				}
			} else {
				base.barMaxWidth = 18;
				base.barBorderRadius = [4, 4, 0, 0];
			}

			return base;
		})
	};
});
</script>

<style lang="scss" scoped>
.wd-trend {
	width: 100%;
}
</style>
