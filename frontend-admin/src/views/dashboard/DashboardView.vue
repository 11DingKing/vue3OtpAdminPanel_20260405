<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  User,
  Document,
  DataLine,
  Timer
} from '@element-plus/icons-vue'

const userStore = useUserStore()

// 统计数据
const statistics = ref([
  {
    title: '用户总数',
    value: 1258,
    icon: User,
    color: '#409eff',
    bgColor: 'rgba(64, 158, 255, 0.1)',
    trend: '+12%',
    trendUp: true
  },
  {
    title: '今日访问',
    value: 386,
    icon: DataLine,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    trend: '+8%',
    trendUp: true
  },
  {
    title: '文档数量',
    value: 2847,
    icon: Document,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    trend: '+24%',
    trendUp: true
  },
  {
    title: '运行时间',
    value: '99.9%',
    icon: Timer,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    trend: 'Stable',
    trendUp: true
  }
])

// 最近活动
const recentActivities = ref([
  { time: '10:30', content: '用户 admin 登录系统', type: 'login' },
  { time: '10:15', content: '数据备份完成', type: 'backup' },
  { time: '08:00', content: '系统启动成功', type: 'system' }
])

// 格式化数字
function formatNumber(num: number | string): string {
  if (typeof num === 'string') return num
  return num.toLocaleString()
}

// 模拟数据加载
const loading = ref(true)
onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<template>
  <div class="dashboard-container" v-loading="loading">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h2 class="welcome-title">
          欢迎回来，{{ userStore.nickname }}！
        </h2>
        <p class="welcome-subtitle">
          今天是 {{ new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          }) }}
        </p>
      </div>
      <div class="welcome-decoration">
        <div class="deco-circle"></div>
        <div class="deco-circle"></div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        v-for="stat in statistics"
        :key="stat.title"
        class="stat-card"
      >
        <div class="stat-icon" :style="{ background: stat.bgColor }">
          <el-icon :size="24" :color="stat.color">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-title">{{ stat.title }}</p>
          <h3 class="stat-value">{{ formatNumber(stat.value) }}</h3>
          <span class="stat-trend" :class="{ 'trend-up': stat.trendUp }">
            {{ stat.trend }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 最近活动 -->
      <div class="card activity-card">
        <h3 class="card-title">最近活动</h3>
        <div class="activity-list">
          <div
            v-for="(activity, index) in recentActivities"
            :key="index"
            class="activity-item"
          >
            <div class="activity-time">{{ activity.time }}</div>
            <div class="activity-dot"></div>
            <div class="activity-content">{{ activity.content }}</div>
          </div>
        </div>
      </div>
      
      <!-- 系统信息 -->
      <div class="card system-info-card">
        <h3 class="card-title">系统信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">系统版本</span>
            <span class="info-value">v1.0.0</span>
          </div>
          <div class="info-item">
            <span class="info-label">框架版本</span>
            <span class="info-value">Vue 3.4 + Element Plus</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前用户</span>
            <span class="info-value">{{ userStore.username }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

// 欢迎区域
.welcome-section {
  position: relative;
  background: linear-gradient(135deg, #409eff 0%, #6366f1 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  overflow: hidden;
}

.welcome-content {
  position: relative;
  z-index: 1;
  
  .welcome-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 var(--spacing-sm);
  }
  
  .welcome-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
}

.welcome-decoration {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  
  .deco-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    
    &:first-child {
      width: 200px;
      height: 200px;
      right: -50px;
      top: -50px;
    }
    
    &:last-child {
      width: 150px;
      height: 150px;
      right: 50px;
      bottom: -30px;
    }
  }
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  
  .stat-title {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-xs);
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs);
    line-height: 1.2;
  }
  
  .stat-trend {
    font-size: 12px;
    color: #10b981;
    
    &.trend-up::before {
      content: '↑ ';
    }
  }
}

// 内容网格
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 卡片样式
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
  }
}

// 快捷操作
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  text-decoration: none;
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-title {
    font-size: 13px;
    color: var(--text-primary);
  }
}

// 活动列表
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  
  .activity-time {
    width: 50px;
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  
  .activity-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
    flex-shrink: 0;
  }
  
  .activity-content {
    font-size: 13px;
    color: var(--text-secondary);
  }
}

// 系统信息
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  
  .info-label {
    font-size: 12px;
    color: var(--text-muted);
  }
  
  .info-value {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }
}
</style>

