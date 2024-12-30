import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import { connectWebSocket } from '@/utils/getRealTimeData';

connectWebSocket();

createApp(App).mount('#app')
