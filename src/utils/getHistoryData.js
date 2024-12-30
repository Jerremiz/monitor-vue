let cache = {};

export async function fetchHistoricalData(cardId, timeframe) {
	const now = Date.now();

	// 检查缓存是否有效（1分钟内）
	if (cache['totalMem'] && timeframe === 'totalMem' && now - cache['totalMem'].timestamp < 60000) {
		return cache['totalMem'];
	}
	if (cache[cardId] && now - cache[cardId].timestamp < 60000) {
		return cache[cardId].data[timeframe];
	}

	const apiUrl = `https://monitor.jeremiz.com/api/${cardId}`;

	try {
		const response = await fetch(apiUrl);
		const apiData = await response.json();

		// 缓存当前cardId的所有数据
		const processedData = {};
		for (const timeframeKey in apiData) {
			if (timeframe === 'totalMem'&& timeframeKey === 'totalMem') {
				cache['totalMem'] = {
					data: apiData[timeframeKey],
					timestamp: now,
				}
				return cache['totalMem'];
			} else if (timeframeKey !== 'totalMem') {
				processedData[timeframeKey] = {
					labels: apiData[timeframeKey].labels.map(label => formatTimestamp(label)),
					data: apiData[timeframeKey].data,
				};
			}
		}

		// 更新缓存
		cache[cardId] = {
			data: processedData,
			timestamp: now,
		};

		return cache[cardId].data[timeframe];
	} catch (error) {
		console.error('Failed to fetch historical data:', error);
	}
}

// 时间格式化函数
function formatTimestamp(utcTimeStr) {
	const isoString = utcTimeStr.replace(' ', 'T') + 'Z';
	const localDate = new Date(isoString);
	return localDate.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).replace(/\//g, '-');
}