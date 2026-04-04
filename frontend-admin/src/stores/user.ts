import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const username = computed(() => userInfo.value?.username || '')
  const nickname = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  
  // 方法
  function setToken(newToken: string) {
    token.value = newToken
  }
  
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }
  
  function login(loginToken: string, info: UserInfo) {
    token.value = loginToken
    userInfo.value = info
  }
  
  function logout() {
    token.value = ''
    userInfo.value = null
  }
  
  function hasPermission(permission: string): boolean {
    if (!userInfo.value) return false
    if (userInfo.value.role === 'admin') return true
    return userInfo.value.permissions.includes(permission)
  }
  
  return {
    // 状态
    token,
    userInfo,
    // 计算属性
    isLoggedIn,
    username,
    nickname,
    isAdmin,
    // 方法
    setToken,
    setUserInfo,
    login,
    logout,
    hasPermission
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'userInfo']
  }
})

