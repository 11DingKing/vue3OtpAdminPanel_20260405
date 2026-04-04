<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Back, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  router.back()
}

function goHome() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="not-found-container">
    <div class="content-wrapper">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <div class="action-buttons">
        <el-button :icon="Back" @click="goBack">返回上页</el-button>
        <el-button type="primary" :icon="HomeFilled" @click="goHome">返回首页</el-button>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  text-align: center;
  position: relative;
  z-index: 1;
}

.error-code {
  font-size: 150px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-md);
  text-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md);
}

.error-description {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xl);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.2;
  }
  
  .circle-1 {
    width: 400px;
    height: 400px;
    background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
    top: -100px;
    right: -100px;
  }
  
  .circle-2 {
    width: 300px;
    height: 300px;
    background: linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%);
    bottom: -50px;
    left: -50px;
  }
}
</style>

