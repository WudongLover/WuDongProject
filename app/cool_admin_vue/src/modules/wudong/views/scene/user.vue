<template>
	<scene-dashboard scene="user" title="用户数据看板" desc="C 端游客注册、活跃与账号状态监控" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'wudong-user'
});

import SceneDashboard from '../../components/scene-dashboard.vue';
</script>
