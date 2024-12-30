<template>
  <div v-if="isScreenTooSmall" class="small-screen-warning">
    <p>屏幕较小，无法正常显示网页</p>
  </div>
  <div v-else class="home-page">
    <Home />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Home from './views/HomeView.vue'

const isScreenTooSmall = ref(window.innerWidth < 330)

// 屏幕宽度较小时显示警告
const updateScreenSize = () => {
  isScreenTooSmall.value = window.innerWidth < 330
}

onMounted(() => {
  window.addEventListener('resize', updateScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize)
})
</script>

<style scoped>
.small-screen-warning {
  position: absolute;
  width: 100%;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

/* 大屏适配 */
@media (min-width: 1200px) {
  .home-page {
    width: 85%;
  }
}
</style>
