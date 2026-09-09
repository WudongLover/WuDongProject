<template>
	<div class="wd-pie" :style="{ height }">
		<v-chart :option="option" autoresize />
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDark } from '@vueuse/core';

defineOptions({
	name: 'wd-pie'
});

const props = withDefaults(
	defineProps<{
		rows: {
			name: string;
			value: number;
		}[];
		height?: string;
		unit?: string;
		center?: boolean;
	}>(),
	{
		height: '260px',
		unit: '',
		center: true
	}
);

const isDark = useDark();
const textColor = computed(() => (isDark.value ? '#d8dce5' : '#667085'));
const palette = ['#4165d7', '#e6a23c', '#67c23a', '#f56c6c', '#9b59b6', '#2fb8ac', '#8e7cc3'];

const option = computed(() => ({
	color: palette,
	legend: {
		bottom: 0,
		icon: 'circle',
		itemWidth: 8,
		itemHeight: 8,
		textStyle: {
			color: textColor.value
		}
	},
	tooltip: {
		trigger: 'item',
		backgroundColor: isDark.value ? 'rgba(30,34,46,0.95)' : 'rgba(255,255,255,0.96)',
		textStyle: {
			color: textColor.value
		},
		formatter: (param: any) => {
			return `${param.marker} ${param.name}<br/>${param.value.toLocaleString('zh-CN')}${
				props.unit
			} · ${param.percent}%`;
		}
	},
	series: [
		{
			type: 'pie',
			radius: props.center ? ['46%', '68%'] : '68%',
			center: ['50%', '45%'],
			padAngle: 2,
			avoidLabelOverlap: true,
			itemStyle: {
				borderRadius: 6,
				borderColor: 'transparent'
			},
			label: {
				show: false
			},
			emphasis: {
				label: {
					show: true,
					fontSize: 14,
					fontWeight: 600,
					color: textColor.value,
					formatter: '{b}\n{d}%'
				}
			},
			data: props.rows
		}
	]
}));
</script>

<style lang="scss" scoped>
.wd-pie {
	width: 100%;
}
</style>
