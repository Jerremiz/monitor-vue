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

const chartCanvas = ref(null);
let chartInstance = null;
let onResize = null;
let stopWatching = null;

const chartLabels = Array.from({ length: 61 }, (_, i) => i);
const chartData = Array(61).fill(null);
let isUpdating = false;
let lastTimeFrame = 'realtime';
let currentTimeFrame = 'realtime';

const maxMem = ref(null);																						// 最大内存

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
        return 60 - value;
      },
			maxRotation: 0,
			minRotation: 0,
			autoSkipPadding: window.innerWidth < 500 ? 25 : 40
		}
	},
	y: {
		max: maxMem,
		ticks: {
			callback: (value) => Number.isInteger(value) ? `${value}` : ''
		}
	}
});

const initializeChart = () => {
	const ctx = chartCanvas.value.getContext('2d');

	chartInstance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: chartLabels,
			datasets: [{
				label: '内存使用量（MB）',
				borderColor: adjustColorAlpha(props.isDarkMode, 'rgba(75, 192, 192, 1)'),
				borderWidth: 2.5,
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				data: [...chartData],
				fill: true,
			}],
		},
		options: {
			responsive: true,
			aspectRatio: window.innerWidth < 500 ? 3 / 2 : 2,
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
						pointStyle: 'circle',
						boxHeight: 10,
					}
				}, 
				tooltip: {
					usePointStyle: true,
					interaction: {
						mode: 'index',
						intersect: false,
					},
					position: 'nearest',
					backgroundColor: 'rgba(46, 48, 62, 0.8)',
					callbacks: {
						title: (title) => {
							if (currentTimeFrame === 'realtime') {
								return `${60 - title[0].parsed.x}`;
							}
						},
						label: (context) => {
							return `内存使用量: ${context.parsed.y.toFixed(2)} MB`;
						},
						labelPointStyle: function() {
							return { pointStyle: 'circle'};
						}
					}
				}
			},
			elements: {
				point: { pointStyle: false },
				line: { cubicInterpolationMode: 'monotone' }
			},
			scales: {
				x: { grid: { display: false }, ...chartAxisConfigs.value.x },
				y: {
					beginAtZero: true,
					grid: { display: false },
					...chartAxisConfigs.value.y
				},
			},
		},
	});
};

onMounted(async () => {
	await getMaxMem();																// 获取最大内存
	initializeChart();
	zoomSet(chartInstance, false);
	updateChartRealtime();
	onResize = () => handleResize(chartInstance);
  window.addEventListener('resize', onResize);
});

watch(() => props.isDarkMode, () => {
	chartInstance.data.datasets.forEach((dataset) => {
		dataset.borderColor = adjustColorAlpha(props.isDarkMode, dataset.borderColor);
	});
	chartInstance.update();
});

// 获取最大内存
async function getMaxMem() {
	try {
    const response = await fetchHistoricalData('mem_usage', 'totalMem');
		maxMem.value = Math.round(response.data);
	} catch (error) {
		console.error(error);
	}
}

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

async function update() {
	isUpdating = true;
	currentTimeFrame = lastTimeFrame;
	chartInstance.resetZoom();

	adjustScale(chartInstance, currentTimeFrame);

	if (stopWatching) {
		await stopWatching();
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
}

const preupdateChartRealtime = async () => {
	zoomSet(chartInstance, false);
	chartInstance.data.labels = chartLabels;
	chartInstance.options.scales.x.title.display = true;
	chartInstance.data.datasets.forEach(dataset => {
		dataset.data = Array(dataset.data.length).fill(0);
	});
	chartInstance.update();		// 注意labels和data匹配才能update
	chartInstance.data.datasets[0].data = [...chartData];
	await new Promise(resolve => setTimeout(resolve, 800));
	chartInstance.update();
};

const updateChartRealtime = () => {
	stopWatching = watch(
	() => realtimeData['timestamp'], () => {
		chartInstance.data.datasets[0].data.shift();
		chartInstance.data.datasets[0].data.push(realtimeData['mem_usage']);
		chartInstance.update();
	});
};

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

const updateChartHistorical = async () => {
	zoomSet(chartInstance, true);
	const historicalData = await fetchHistoricalData('mem_usage', currentTimeFrame);
	chartInstance.data.labels = historicalData['labels'];
	chartInstance.data.datasets[0].data = historicalData['data'];
	chartInstance.options.scales.x.title.display = false;
	chartInstance.update();
	chartInstance.reset();
  chartInstance.update();
};

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
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