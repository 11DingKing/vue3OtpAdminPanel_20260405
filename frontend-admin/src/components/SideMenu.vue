<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

defineProps<{
  collapse: boolean
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 菜单项配置
const menuItems = computed(() => {
  const items = [
    {
      index: '/dashboard',
      title: '控制台',
      icon: 'Odometer',
      permission: 'dashboard'
    }
  ]
  
  // 根据权限过滤菜单
  return items.filter(item => userStore.hasPermission(item.permission))
})

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 菜单点击处理
function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapse"
    :collapse-transition="false"
    background-color="transparent"
    text-color="#475569"
    active-text-color="#409eff"
    @select="handleMenuSelect"
    class="side-menu"
  >
    <el-menu-item
      v-for="item in menuItems"
      :key="item.index"
      :index="item.index"
    >
      <el-icon>
        <component :is="item.icon" />
      </el-icon>
      <template #title>
        <span>{{ item.title }}</span>
      </template>
    </el-menu-item>
  </el-menu>
</template>

<style lang="scss" scoped>
.side-menu {
  border: none;
  
  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    
    &:hover {
      background: rgba(64, 158, 255, 0.05) !important;
    }
    
    &.is-active {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%) !important;
      color: #409eff !important;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 24px;
        background: linear-gradient(180deg, #409eff 0%, #6366f1 100%);
        border-radius: 0 2px 2px 0;
      }
    }
    
    .el-icon {
      font-size: 18px;
      margin-right: 10px;
    }
  }
  
  // 折叠状态样式
  &.el-menu--collapse {
    :deep(.el-menu-item) {
      margin: 4px;
      padding: 0 !important;
      justify-content: center;
      
      .el-icon {
        margin-right: 0;
      }
      
      &.is-active::before {
        left: 0;
        width: 3px;
      }
    }
  }
}
</style>

