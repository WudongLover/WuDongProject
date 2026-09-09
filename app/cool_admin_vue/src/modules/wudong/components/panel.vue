<template>
	<div class="wd-panel">
		<div v-if="title" class="wd-panel__head">
			<div class="wd-panel__title">
				<span class="dot"></span>
				<span>{{ title }}</span>
			</div>

			<div class="wd-panel__extra">
				<slot name="extra"></slot>
			</div>
		</div>

		<div class="wd-panel__body">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wd-panel'
});

withDefaults(
	defineProps<{
		title?: string;
	}>(),
	{
		title: ''
	}
);
</script>

<style lang="scss" scoped>
.wd-panel {
	display: flex;
	flex-direction: column;
	height: 100%;
	box-sizing: border-box;
	border: 1px solid var(--el-border-color-extra-light);
	border-radius: 10px;
	background-color: var(--el-bg-color);
	overflow: hidden;

	&__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 52px;
		padding: 0 18px;
		border-bottom: 1px solid var(--el-border-color-extra-light);
	}

	&__title {
		display: inline-flex;
		align-items: center;
		font-size: 15px;
		font-weight: 600;
		color: var(--el-text-color-primary);

		.dot {
			width: 4px;
			height: 14px;
			border-radius: 2px;
			background-color: var(--el-color-primary);
			margin-right: 8px;
		}
	}

	&__body {
		flex: 1;
		min-height: 0;
		padding: 12px 18px 16px;
		overflow: auto;
	}
}
</style>
