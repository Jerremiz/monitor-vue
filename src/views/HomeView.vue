<template>
  <div class="home">
    <header class="header">
      <ReconnectingAlert :isReconnecting="isReconnecting" />
      <h1>Perf Metrics</h1>
      <p>Ver. 1.0</p>
      <div class="toggle-mode" title="切换主题" @click="toggleTheme">
        <svg class="light-icon" viewBox="0 0 32 32" v-show="!isDarkMode">
          <path d="M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6z" fill="currentColor"></path>
          <path d="M5.394 6.813l1.414-1.415l3.506 3.506L8.9 10.318z" fill="currentColor"></path>
          <path d="M2 15.005h5v2H2z" fill="currentColor"></path>
          <path d="M5.394 25.197L8.9 21.691l1.414 1.415l-3.506 3.505z" fill="currentColor"></path>
          <path d="M15 25.005h2v5h-2z" fill="currentColor"></path>
          <path d="M21.687 23.106l1.414-1.415l3.506 3.506l-1.414 1.414z" fill="currentColor"></path>
          <path d="M25 15.005h5v2h-5z" fill="currentColor"></path>
          <path d="M21.687 8.904l3.506-3.506l1.414 1.415l-3.506 3.505z" fill="currentColor"></path>
          <path d="M15 2.005h2v5h-2z" fill="currentColor"></path>
        </svg>
        <svg class="dark-icon" viewBox="0 0 32 32" v-show="isDarkMode">
          <path d="M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3z" fill="currentColor"></path>
        </svg>
      </div>
    </header>
    <main class="main-content">
      <div class="card-container">
        <Card v-for="card in cards" :key="card.id" :card="card" :isDarkMode="isDarkMode"/>
      </div>
    </main>
    <footer class="footer">
      <p>Copyright © 2024-2025 Jeremy Zhao</p>
      <a href="https://beian.miit.gov.cn/" target="_blank">粤ICP备2024179484号-1</a>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { checkReconnectState } from '@/utils/getRealTimeData';
import Card from '@/components/MetricsCard.vue';
import ReconnectingAlert from '@/components/ReconnectingAlert.vue';

// 获取用户原本设定的主题
const isDarkMode = ref(localStorage.getItem('isDarkMode') === 'true');
const isReconnecting = checkReconnectState();

const cards = ref([
  { id: 'cpu_usage', title: 'CPU' },
  { id: 'mem_usage', title: '内存' },
  { id: 'disk_usage', title: '磁盘IO' },
  { id: 'network_usage', title: '网络IO' },
]);

// 初始化主题
onMounted(() => {
  document.body.classList.toggle('dark-theme', isDarkMode.value);
});

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark-theme', isDarkMode.value);
  localStorage.setItem('isDarkMode', isDarkMode.value);
};
</script>

<style scoped>
.home {
  display: flex;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.header {
  position: relative;
  text-align: center;
  width: 75%;
}

.header h1 {
  font-size: 2.5rem;
}

.header p {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(100%);
  margin-left: 4.5rem;
}

.toggle-mode {
  position: absolute;
  right: 3rem;
  bottom: 0;
  cursor: pointer; /* 鼠标显示手型 */
  -webkit-tap-highlight-color: transparent; /* 移除移动端蓝色高亮 */
}

.light-icon,
.dark-icon {
  width: 24px;
  height: 24px;
  fill: var(--color-text); /* 跟随文字颜色 */
}

.main-content {
  width: 100%;
}

.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer {
  text-align: center;
  -webkit-tap-highlight-color: transparent; /* 移除移动端蓝色高亮 */
}

/* 移动端适配 */
@media (max-width: 750px) {
  .header p {
    display: none;
  }
}

@media (max-width: 550px) {
  .header {
    width: 100%;
  }
  .header h1 {
    font-size: 2.25rem;
  }
  .toggle-mode {
    right: 1.5rem;
  }
}

@media (max-width: 360px) {
  .toggle-mode {
    display: none;
  }
}

/* 大屏适配 */
@media (min-width: 2160px) {
  .card-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>