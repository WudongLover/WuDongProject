<template>
	<scene-dashboard
		scene="community"
		title="社区数据看板"
		desc="乌东游客游记、照片与短视频内容社区监控"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-community'
});

import SceneDashboard from '../../components/scene-dashboard.vue';
</script>
