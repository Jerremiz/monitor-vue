<template>
  <div class="card">
    <div class="card-header">
      <h2>{{ card.title }}</h2>
      <select v-model="timeframe">
        <option v-for="option in timeframeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <component :is="getCurrentComponent" :timeframe="timeframe" :isDarkMode="props.isDarkMode"></component>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CpuChart from './CpuChart.vue';
import MemChart from './MemChart.vue';
import DiskChart from './DiskChart.vue';
import NetChart from './NetChart.vue';

const props = defineProps({
  card: Object,
  isDarkMode: Boolean,
});

const timeframe = ref('realtime');

const timeframeOptions = [
  { value: 'realtime', label: '实时' },
  { value: 'lastHour', label: '一小时' },
  { value: 'lastDay', label: '最近一天' },
  { value: 'lastWeek', label: '最近七天' },
  { value: 'lastMonth', label: '最近一月' },
];

const getCurrentComponent = computed(() => {
  switch (props.card.id) {
    case 'cpu_usage':
      return CpuChart;
    case 'mem_usage':
      return MemChart;
    case 'disk_usage':
      return DiskChart;
    case 'network_usage':
      return NetChart;
    default:
      return null;
  }
});

</script>

<style scoped>
.card {
  background: var(--color-card);
  padding: 1.5rem;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  margin: 1.25rem 1.25rem;
  width: 75%;
  transition:
    box-shadow 0.3s,
    border 1s,
    background 0.5s;
}

.card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 0.5rem;
}

.card-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.card-header select {
  position: absolute;
  right: 0;
  bottom: 0;
  border-radius: 0.5rem;
  background: var(--color-card);
  padding: 0.25rem;
  color: var(--color-text);
  transition:
    background 0.5s;
}

.card-header select:focus {
  outline: none;
}

/* 适配移动端 */
@media (max-width: 550px) {
  .card {
    width: 100%;
    padding: 0.75rem;
  }

  .card-header h2 {
    font-size: 1.25rem;
  }

  .card-header select {
    font-size: 0.75rem;
  }
}

/* 大屏适配 */
@media (min-width: 2160px) {
  .card {
    margin: 2rem auto;
    width: 90%;
  }
}
</style>