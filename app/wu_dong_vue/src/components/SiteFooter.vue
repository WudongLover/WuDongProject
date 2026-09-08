<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="pattern-line" aria-hidden="true"></div>
    <div class="container footer-grid">
      <div class="brand">
        <h3>乌东文旅</h3>
        <p class="slogan">云上苗寨 · 衣食住行</p>
        <p class="desc">
          贵州省黔东南苗族侗族自治州雷山县乌东村
          <br />一座藏在雷公山褶皱里的苗寨，等你慢下来。
        </p>
      </div>
      <div class="col">
        <h4>漫游乌东</h4>
        <router-link to="/goods">非遗好物</router-link>
        <router-link to="/food">苗家风味</router-link>
        <router-link to="/stay">山居民宿</router-link>
        <router-link to="/trip">门票路线</router-link>
      </div>
      <div class="col">
        <h4>社区</h4>
        <router-link to="/community">游记瀑布流</router-link>
        <router-link to="/community?topic=非遗体验">非遗体验</router-link>
        <router-link to="/community?topic=美食攻略">美食攻略</router-link>
      </div>
      <div class="col">
        <h4>服务</h4>
        <router-link to="/user">个人中心</router-link>
        <router-link to="/orders">我的订单</router-link>
        <router-link to="/login">商家入驻（演示）</router-link>
        <a href="javascript:;">客服电话 0855-0000000</a>
      </div>
    </div>
    <div class="container foot-note">
      <span>© {{ year }} 乌东文旅「衣食住行」综合服务平台 · 课程设计演示项目</span>
      <span>数据均为演示用 Mock 数据</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 72px;
  background: var(--indigo-night);
  color: rgba(215, 224, 230, 0.82);
}

.pattern-line {
  height: 7px;
  background-image: radial-gradient(circle at 4px -2px, transparent 5px, rgba(215, 224, 230, 0.28) 5px, rgba(215, 224, 230, 0.28) 6.5px, transparent 6.5px);
  background-size: 14px 9px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 36px;
  padding: 44px 0 30px;
}

.brand h3 {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.3em;
  color: var(--silver-light);
}

.slogan {
  margin: 6px 0 12px;
  font-size: 13px;
  letter-spacing: 0.4em;
  color: var(--amber);
}

.desc {
  font-size: 13px;
  line-height: 1.9;
  color: rgba(215, 224, 230, 0.55);
}

.col {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.col h4 {
  font-size: 14px;
  letter-spacing: 0.2em;
  color: var(--silver-light);
  margin-bottom: 4px;
  font-weight: 500;
}

.col a {
  font-size: 13px;
  color: rgba(215, 224, 230, 0.6);
  transition: color 0.2s;
}

.col a:hover {
  color: var(--amber);
}

.foot-note {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 0 22px;
  border-top: 1px solid rgba(215, 224, 230, 0.12);
  font-size: 12px;
  color: rgba(215, 224, 230, 0.4);
  letter-spacing: 0.05em;
}

@media (max-width: 767px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }

  .brand {
    grid-column: 1 / -1;
  }
}
</style>
