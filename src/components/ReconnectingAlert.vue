<template>
  <transition name="slide">
    <div v-if="props.isReconnecting" class="reconnecting-alert">
      <div class="spinner"></div>
      <span>正在连接服务器...</span>
    </div>
  </transition>
</template>

<script setup>

const props = defineProps({
  isReconnecting: Boolean,
});

</script>

<style scoped>
.reconnecting-alert {
  position: fixed;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-tip);
  padding: 12px 20px;
  font-size: 15px;
  z-index: 1000;
  border-radius: 1rem;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  min-width: 185px;
  border: 1px solid var(--color-border);
  transition:
    box-shadow 0.3s,
    border 1s,
    background 0.5s;
}

.reconnecting-alert:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.spinner {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.slide-enter-active{
  transition: transform 0.3s ease-out;
}
.slide-leave-active {
  transition: transform 0.3s ease-in;
}
.slide-enter-from {
  transform: translate(-50%, -100%);
}
.slide-enter-to {
  transform: translate(-50%, 0);
}
.slide-leave-from {
  transform: translate(-50%, 0);
}
.slide-leave-to {
  transform: translate(-50%, -100%);
}
</style>