<template>
	<div class="wd-page-head">
		<div class="info">
			<h3>{{ title }}</h3>
			<p v-if="desc">{{ desc }}</p>
		</div>

		<div class="extra">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wd-page-head'
});

withDefaults(
	defineProps<{
		title: string;
		desc?: string;
	}>(),
	{
		desc: ''
	}
);
</script>

<style lang="scss" scoped>
.wd-page-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 2px 2px 14px;

	h3 {
		margin: 0;
		font-size: 20px;
		color: var(--el-text-color-primary);
	}

	p {
		margin: 6px 0 0;
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}
}
</style>
