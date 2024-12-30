import { reactive, ref } from 'vue';

const socket = ref(null);           					// WebSocket 实例
const realtimeData = reactive({});  					// 实时数据
let reconnectTimer = null;          					// 重连定时器
const reconnectInterval = 3000;     					// 重连间隔/ms
const reconnectTrigger = ref(false); 					// 重连完成触发器
const wsUrl = 'wss://monitor.jeremiz.com/ws'; // WebSocket URL

export function connectWebSocket() {
	if (socket.value) return; // 防止重复连接

	socket.value = new WebSocket(wsUrl);

	// 监听 WebSocket 事件
	socket.value.onmessage = (event) => {
		const messageData = JSON.parse(event.data);
		// 更新实时数据
		for (const key in messageData) {
			realtimeData[key] = messageData[key];
		}
	};

	// 连接建立时触发
	socket.value.onopen = () => {
		console.log('WebSocket connection established');

		if (reconnectTimer) {
			reconnectTrigger.value = false; // 重连完成
			clearTimeout(reconnectTimer);
			reconnectTimer = null; // 清除重连定时器
		}
	};

	// 连接关闭时触发
	socket.value.onclose = () => {
		console.log('WebSocket closed, attempting to reconnect');
		socket.value = null;
		attemptReconnect(); // 尝试重连
	};

	// 连接出错时触发
	socket.value.onerror = (error) => {
		console.log('WebSocket error occurred', error);
	};
}

// 尝试重连
export function attemptReconnect() {
	reconnectTimer = setTimeout(() => {
		reconnectTrigger.value = true; // 重连中
		console.log('Reconnecting...');
		connectWebSocket();
	}, reconnectInterval);
}

// 断开 WebSocket 连接
export function disconnectWebSocket() {
	if (socket.value) {
		socket.value.close();
		socket.value = null;
	}
	// 清除重连定时器
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
}

// 获取实时数据
export function getRealTimeData() {
	return realtimeData;
}

// 获取重连状态
export function checkReconnectState() {
	return reconnectTrigger;
}