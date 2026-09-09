<template>
	<scene-dashboard
		scene="overview"
		title="乌东文旅运营总览"
		desc="衣、食、住、行、社区全业务数据一览"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'overview'
});

import SceneDashboard from '../../components/scene-dashboard.vue';
</script>
