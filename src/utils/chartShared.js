import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { getRealTimeData, checkReconnectState } from '@/utils/getRealTimeData';
import { fetchHistoricalData } from '@/utils/getHistoryData';

Chart.register(...registerables, zoomPlugin);                     // 注册Chart.js插件和缩放插件

const realtimeData = getRealTimeData();														// 获取实时数据
const reconnectTrigger = checkReconnectState();										// 检查是否重连完成

// 窗口大小变化时调整图表大小
const handleResize = (chartInstance) => {
  chartInstance.options.aspectRatio = window.innerWidth < 500 ? 3 / 2 : 2;
  chartInstance.options.scales.x.ticks.autoSkipPadding = window.innerWidth < 500 ? 25 : 40;
  chartInstance.resize();
};

// 设置缩放
const zoomSet = (chartInstance, value) => {
  chartInstance.options.plugins.zoom.pan.enabled = value;
  chartInstance.options.plugins.zoom.zoom.wheel.enabled = value;
  chartInstance.options.plugins.zoom.zoom.pinch.enabled = value;
};

// 调整曲线颜色透明度
const adjustColorAlpha = (isDarkMode, color) => {
  const alpha = isDarkMode ? '0.8' : '1';
  const [, r, g, b] = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[0-9.]+)?\)/);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 调整缩放范围
const adjustScale = (chartInstance, timeframe) => {
  let minRange = 120000;
  switch (timeframe) {
    case 'lastHour':
      minRange = 120000;
      break;
    case 'lastDay':
      minRange = 1800000;
      break;
    case 'lastWeek':
      minRange = 7200000;
      break;
    case 'lastMonth':
      minRange = 28800000;
      break;
  }
  chartInstance.options.plugins.zoom.limits.x.minRange = minRange;
}

export {
  ref,
  onMounted,
  onUnmounted,
  watch,
  Chart,
  realtimeData,
  reconnectTrigger,
  fetchHistoricalData,
  zoomSet,
  handleResize,
  adjustColorAlpha,
  adjustScale
}