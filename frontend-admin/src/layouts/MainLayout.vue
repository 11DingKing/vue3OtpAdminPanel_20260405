<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Fold,
  Expand,
  User,
  SwitchButton,
  ArrowDown
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import SideMenu from '@/components/SideMenu.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 当前路由标题
const currentTitle = computed(() => {
  return route.meta.title as string || '首页'
})

// 切换侧边栏
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

// 退出登录
async function handleLogout() {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <!-- Logo区域 -->
      <div class="sidebar-header">
        <div class="logo">
          <el-icon :size="28" color="#409eff">
            <component :is="'Lock'" />
          </el-icon>
          <transition name="fade">
            <span v-if="!isCollapsed" class="logo-text">OTP管理系统</span>
          </transition>
        </div>
      </div>
      
      <!-- 菜单 -->
      <div class="sidebar-menu">
        <SideMenu :collapse="isCollapsed" />
      </div>
      
      <!-- 侧边栏底部 -->
      <div class="sidebar-footer">
        <el-button
          :icon="isCollapsed ? Expand : Fold"
          text
          @click="toggleSidebar"
          class="collapse-btn"
        />
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <header class="main-header">
        <div class="header-left">
          <h1 class="page-title">{{ currentTitle }}</h1>
        </div>
        
        <div class="header-right">
          <!-- 用户信息 -->
          <el-dropdown trigger="click" @command="(cmd: string) => cmd === 'logout' ? handleLogout() : null">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon :size="18"><User /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userStore.nickname }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <!-- 页面内容 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

// 侧边栏
.sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  
  &.is-collapsed {
    width: 64px;
  }
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  
  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    overflow: hidden;
    
    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
    }
  }
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-md) 0;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  
  .collapse-btn {
    width: 100%;
    justify-content: center;
    color: var(--text-secondary);
    
    &:hover {
      color: var(--primary-color);
      background: rgba(59, 130, 246, 0.1);
    }
  }
}

// 主容器
.main-container {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition-normal);
  
  .is-collapsed + & {
    margin-left: 64px;
  }
}

// 顶部导航
.main-header {
  height: 64px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: 99;
}

.header-left {
  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  
  &:hover {
    background: var(--bg-tertiary);
  }
  
  .user-avatar {
    background: linear-gradient(135deg, #409eff 0%, #6366f1 100%);
  }
  
  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .dropdown-arrow {
    font-size: 12px;
    color: var(--text-secondary);
    transition: transform var(--transition-fast);
  }
}

// 主内容
.main-content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

// 页面过渡动画
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 文字淡入淡出
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

