// 存储键名常量
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  REMEMBER_USERNAME: 'remember_username'
} as const

// 获取存储项
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

// 设置存储项
export function setStorageItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Storage error:', error)
  }
}

// 移除存储项
export function removeStorageItem(key: string): void {
  localStorage.removeItem(key)
}

// 清空所有存储
export function clearStorage(): void {
  localStorage.clear()
}

