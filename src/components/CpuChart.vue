<template>
  <canvas ref="chartCanvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, Chart } from '@/utils/chartShared';
import { realtimeData, reconnectTrigger, fetchHistoricalData } from '@/utils/chartShared';
import { handleResize, zoomSet, adjustColorAlpha, adjustScale } from '@/utils/chartShared';

const props = defineProps({
	timeframe: String,
	isDarkMode: Boolean,
});

const chartCanvas = ref(null);																		// 图表画布
let chartInstance = null;																					// 图表实例
let onResize = null;																							// 窗口大小变化监听
let stopWatching = null;																					// 停止监听数据变化

const chartLabels = Array.from({ length: 61 }, (_, i) => i); 			// 实时数据的横坐标
const chartData = Array(61).fill(null);														// 实时数据的初始化
let isUpdating = false; 																					// 是否正在更新数据
let lastTimeFrame = 'realtime';																					// 即将更新的时间段（防抖）
let currentTimeFrame = 'realtime';																// 当前选中的时间段

// 图表坐标轴配置
const chartAxisConfigs = ref({
	x: {
		type: 'time',
		time: {
			tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
		},
		title: { display: true, text: '时间/s' },
		ticks: {
			source: 'auto',
      callback: (value) => {
        // 当刻度轴为 timeseries 时才执行日期转换
        if (chartInstance?.options?.scales?.x?.title?.display === false) {
          const dateStr = new Date(value).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).replace(/\//g, '-');
          const [dayPart, timePart] = dateStr.split(' ');
          return [dayPart, timePart];
        }
        // 实时模式直接返回数值
        return 60 - value;
      },
			maxRotation: 0,
			minRotation: 0,
			autoSkipPadding: window.innerWidth < 500 ? 25 : 40,					// 适配移动端
		}
	},
	yLeft: {
		id: 'yLeft',
		position: 'left',
		max: 100,
		ticks: {
			callback: (value) => Number.isInteger(value) ? `${value}%` : ''
		}																															// y轴标签显示百分比
	}
});

// 初始化图表
const initializeChart = () => {
	const ctx = chartCanvas.value.getContext('2d');									// 设置画布

	// 创建图表实例
	chartInstance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: chartLabels,
			datasets: [{
				label: '利用率/%',
				borderColor: adjustColorAlpha(props.isDarkMode, 'rgba(75, 192, 192, 1)'),
				borderWidth: 2.5,
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				data: [...chartData],																			// 初始化数据
				fill: true,
				yAxisID: 'yLeft',
			}],
		},
		options: {
			responsive: true,																						// 响应式图表大小
			aspectRatio: window.innerWidth < 500 ? 3 / 2 : 2, 					// 图表宽高比适配移动端
			transitions: {
				zoom: {
					animation: {
						duration: 250,
						easing: 'easeOutCubic'
					}
				}
			},
			plugins: {
				zoom: {
					pan: {
						enabled: true,
						mode: 'xy',
						threshold: 0,
					},
					limits: {
						x: {min: 'original', max: 'original', minRange: 120000},
						y: {min: 'original', max: 'original', minRange: 2},
					},
					zoom: {
						wheel: {
							enabled: true,
						},
						pinch: {
							enabled: true
						},
						mode: 'xy',
					}
				},
				legend: {
					labels: {
						usePointStyle: true,
						pointStyle: 'circle',																	// 图例样式
						boxHeight: 10,
					}
				}, 
				tooltip: {
					usePointStyle: true,
					interaction: {
						mode: 'index',																				// 交互模式
						intersect: false,
					},
					position: 'nearest',																		// 交互位置
					backgroundColor: 'rgba(46, 48, 62, 0.8)',
					callbacks: {
						title: (title) => {
							if (currentTimeFrame === 'realtime') {
								return `${60 - title[0].parsed.x}`;
							}
						},
						label: (context) => {
							if (context.datasetIndex === 0) {
								return `CPU利用率: ${context.parsed.y.toFixed(2)}%`;
							}
							return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
						},
						labelPointStyle: function() {
							return { pointStyle: 'circle'};
						}
					}
				}
			},
			elements: {
				point: { pointStyle: false },															// 禁用点样式
				line: { cubicInterpolationMode: 'monotone' }							// 曲线插值模式
			},
			scales: {
				x: { grid: { display: false }, ...chartAxisConfigs.value.x },
				yLeft: {
					beginAtZero: true,
					grid: { display: false },
					...chartAxisConfigs.value.yLeft													// 左y轴配置
				},
			},
		},
	});
};

// 组件挂载时初始化图表
onMounted(() => {
	initializeChart();																							// 初始化图表
	zoomSet(chartInstance, false);																	// 禁用缩放
	updateChartRealtime();																					// 更新实时数据
	onResize = () => handleResize(chartInstance); 									// 动态调整图表比例
  window.addEventListener('resize', onResize); 										// 监听窗口大小变化
});

// 监听深色模式变化
watch(() => props.isDarkMode, () => {
	chartInstance.data.datasets.forEach((dataset) => {
		dataset.borderColor = adjustColorAlpha(props.isDarkMode, dataset.borderColor);
	});
	chartInstance.update();
});

// 监听时间段变化
watch(() => props.timeframe, async (newTimeframe) => {
	lastTimeFrame = newTimeframe;
	if (!isUpdating) {
		try {
			await update();
		} catch (error) {
			console.error(error);
		} finally {
			isUpdating = false;
		}
	}
});

// 更新数据
async function update() {
	isUpdating = true;
	currentTimeFrame = lastTimeFrame;
	chartInstance.resetZoom();

	adjustScale(chartInstance, currentTimeFrame);											// 调整图表缩放范围

	if (stopWatching) {
		await stopWatching();																						// 停止监听数据变化
	}

	if (currentTimeFrame === 'realtime') {
		await preupdateChartRealtime();
		updateChartRealtime();
	} else {
		await updateChartHistorical();
	}
	if (lastTimeFrame !== currentTimeFrame) {
		await update();
	}
	isUpdating = false;
}

// 更新实时数据预处理
const preupdateChartRealtime = async () => {
	zoomSet(chartInstance, false);																		// 禁用缩放
	chartInstance.data.labels = chartLabels;
	chartInstance.options.scales.x.title.display = true;							// 显示x轴标题
	chartInstance.data.datasets.forEach(dataset => {
		dataset.data = Array(dataset.data.length).fill(0);
	});
	chartInstance.options.plugins.tooltip.enabled = false;	// 防止删除数据集tooltip获取不到数据
	chartInstance.update();
	chartInstance.data.datasets = chartInstance.data.datasets.slice(0, 1);
	chartInstance.data.datasets[0].data = [...chartData];
	delete chartInstance.options.scales.yRight;
	await new Promise(resolve => setTimeout(resolve, 800)); 					// 确保动画完整
	chartInstance.update();
	chartInstance.options.plugins.tooltip.enabled = true;
};

// 更新实时数据
const updateChartRealtime = () => {
	stopWatching = watch(
	() => realtimeData['timestamp'], () => {
		chartInstance.data.datasets[0].data.shift();
		chartInstance.data.datasets[0].data.push(realtimeData['cpu_usage']);
		chartInstance.update();
	});
};

// 重连后更新
watch(() => reconnectTrigger.value, async (value) => {
	if (!isUpdating && !value) {
		try {
			await update();
		} catch (error) {
			console.error(error);
		} finally {
			isUpdating = false;
		}
	}
});

// 更新历史数据
const updateChartHistorical = async () => {
	zoomSet(chartInstance, true);																				// 启用缩放
	const [cpuUsageData, load1Data, load5Data, load15Data] = await Promise.all([
		fetchHistoricalData('cpu_usage', currentTimeFrame),
		fetchHistoricalData('sys_load_1', currentTimeFrame),
		fetchHistoricalData('sys_load_5', currentTimeFrame),
		fetchHistoricalData('sys_load_15', currentTimeFrame),
	]);
	chartInstance.data.labels = cpuUsageData['labels'];
	chartInstance.data.datasets[0].data = cpuUsageData['data'];
	chartInstance.options.scales.yRight = {
		id: 'yRight',
		position: 'right',
		beginAtZero: true,
		grid: { display: false },
	};
	if (chartInstance.data.datasets.length > 1) {
		chartInstance.data.datasets[1].data = load1Data['data'];
		chartInstance.data.datasets[2].data = load5Data['data'];
		chartInstance.data.datasets[3].data = load15Data['data'];
	} else {
		chartInstance.data.datasets.push(
			{
				label: '1分钟负载',
				borderColor: adjustColorAlpha(props.isDarkMode, 'rgba(54, 162, 235, 1)'),
				borderWidth: 2.5,
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				data: load1Data['data'],
				fill: true,
				yAxisID: 'yRight',
			},
			{
				label: '5分钟负载',
				borderColor: adjustColorAlpha(props.isDarkMode, 'rgba(255, 99, 132, 1)'),
				borderWidth: 2.5,
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				data: load5Data['data'],
				fill: true,
				yAxisID: 'yRight',
			},
			{
				label: '15分钟负载',
				borderColor: adjustColorAlpha(props.isDarkMode, 'rgba(255, 159, 64, 1)'),
				borderWidth: 2.5,
				backgroundColor: 'rgba(255, 159, 64, 0.2)',
				data: load15Data['data'],
				fill: true,
				yAxisID: 'yRight',
			}
		);
	}
	chartInstance.options.scales.x.title.display = false;
	chartInstance.update();
	chartInstance.reset();
  chartInstance.update();
};

// 组件销毁时销毁图表实例
onUnmounted(() => {
  window.removeEventListener('resize', onResize); // 移除事件监听器
	if (stopWatching) {
		stopWatching();
	}
	if (chartInstance) {
		chartInstance.destroy();
	}
});
</script>

<style scoped>
canvas {
	width: 100% !important;
	height: 100% !important;
}
</style>