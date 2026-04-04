import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import './styles/index.scss'

// 导入日志和错误处理工具
import { logger } from './utils/logger'
import { setupGlobalErrorHandler } from './utils/error-handler'

const app = createApp(App)

// 安装全局错误处理器（捕获未处理的 Promise 错误和 JavaScript 错误）
setupGlobalErrorHandler()
logger.info('应用启动中...', { environment: import.meta.env.MODE }, 'App')

// Pinia 状态管理
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 路由
app.use(router)

app.mount('#app')
logger.info('应用已挂载完成', undefined, 'App')

