/**
 * 统一错误处理机制
 * 
 * 提供完善的错误处理能力，包括：
 * - 网络错误处理
 * - 服务器错误处理
 * - 业务逻辑错误处理
 * - 认证错误处理
 * - 超时错误处理
 * 
 * 使用示例：
 *   try {
 *     await someAsyncOperation()
 *   } catch (error) {
 *     const result = handleError(error)
 *     ElMessage.error(result.message)
 *   }
 */

import { ElMessage, ElMessageBox } from 'element-plus'
import { logger } from './logger'
import router from '@/router'

// 错误类型枚举
export enum ErrorType {
  // 网络相关错误
  NETWORK = 'NETWORK',           // 网络连接错误
  TIMEOUT = 'TIMEOUT',           // 请求超时
  
  // 服务器相关错误
  SERVER = 'SERVER',             // 服务器内部错误 (5xx)
  BAD_REQUEST = 'BAD_REQUEST',   // 请求参数错误 (400)
  NOT_FOUND = 'NOT_FOUND',       // 资源不存在 (404)
  
  // 认证相关错误
  UNAUTHORIZED = 'UNAUTHORIZED', // 未授权 (401)
  FORBIDDEN = 'FORBIDDEN',       // 禁止访问 (403)
  TOKEN_EXPIRED = 'TOKEN_EXPIRED', // Token 过期
  
  // 业务相关错误
  BUSINESS = 'BUSINESS',         // 业务逻辑错误
  VALIDATION = 'VALIDATION',     // 数据验证错误
  
  // 其他错误
  UNKNOWN = 'UNKNOWN'            // 未知错误
}

// 错误处理结果接口
export interface ErrorResult {
  type: ErrorType
  code?: string | number
  message: string
  originalError?: unknown
  handled: boolean
}

// HTTP 状态码到错误类型的映射
const HTTP_STATUS_ERROR_MAP: Record<number, { type: ErrorType; message: string }> = {
  400: { type: ErrorType.BAD_REQUEST, message: '请求参数错误，请检查输入' },
  401: { type: ErrorType.UNAUTHORIZED, message: '登录状态已失效，请重新登录' },
  403: { type: ErrorType.FORBIDDEN, message: '您没有权限执行此操作' },
  404: { type: ErrorType.NOT_FOUND, message: '请求的资源不存在' },
  408: { type: ErrorType.TIMEOUT, message: '请求超时，请稍后重试' },
  429: { type: ErrorType.BAD_REQUEST, message: '请求过于频繁，请稍后再试' },
  500: { type: ErrorType.SERVER, message: '服务器内部错误，请稍后重试' },
  502: { type: ErrorType.SERVER, message: '网关错误，请稍后重试' },
  503: { type: ErrorType.SERVER, message: '服务暂时不可用，请稍后重试' },
  504: { type: ErrorType.TIMEOUT, message: '网关超时，请稍后重试' }
}

// 错误消息映射
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查您的网络设置',
  [ErrorType.TIMEOUT]: '请求超时，请稍后重试',
  [ErrorType.SERVER]: '服务器错误，请稍后重试',
  [ErrorType.BAD_REQUEST]: '请求参数错误，请检查输入',
  [ErrorType.NOT_FOUND]: '请求的资源不存在',
  [ErrorType.UNAUTHORIZED]: '登录状态已失效，请重新登录',
  [ErrorType.FORBIDDEN]: '您没有权限执行此操作',
  [ErrorType.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorType.BUSINESS]: '操作失败，请稍后重试',
  [ErrorType.VALIDATION]: '数据验证失败，请检查输入',
  [ErrorType.UNKNOWN]: '发生未知错误，请稍后重试'
}

// 创建错误处理日志记录器
const errorLogger = logger.createLogger('ErrorHandler')

/**
 * 判断是否为网络错误
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return true
  }
  if (error instanceof Error && error.message.includes('Network')) {
    return true
  }
  // 检查是否为 fetch AbortError
  if (error instanceof DOMException && error.name === 'AbortError') {
    return false // AbortError 是超时或取消，不是网络错误
  }
  return false
}

/**
 * 判断是否为超时错误
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
    return true
  }
  return false
}

/**
 * 从 HTTP 响应中解析错误
 */
function parseHttpError(response: Response): ErrorResult {
  const statusConfig = HTTP_STATUS_ERROR_MAP[response.status]
  
  if (statusConfig) {
    return {
      type: statusConfig.type,
      code: response.status,
      message: statusConfig.message,
      handled: false
    }
  }
  
  // 处理其他 4xx 和 5xx 错误
  if (response.status >= 400 && response.status < 500) {
    return {
      type: ErrorType.BAD_REQUEST,
      code: response.status,
      message: `请求错误 (${response.status})`,
      handled: false
    }
  }
  
  if (response.status >= 500) {
    return {
      type: ErrorType.SERVER,
      code: response.status,
      message: `服务器错误 (${response.status})`,
      handled: false
    }
  }
  
  return {
    type: ErrorType.UNKNOWN,
    code: response.status,
    message: `未知错误 (${response.status})`,
    handled: false
  }
}

/**
 * 核心错误处理函数
 * 
 * @param error 原始错误对象
 * @param context 错误上下文信息（可选）
 * @returns 标准化的错误处理结果
 */
export function handleError(error: unknown, context?: string): ErrorResult {
  let result: ErrorResult

  // 1. 网络错误
  if (isNetworkError(error)) {
    result = {
      type: ErrorType.NETWORK,
      message: ERROR_MESSAGES[ErrorType.NETWORK],
      originalError: error,
      handled: false
    }
  }
  // 2. 超时错误
  else if (isTimeoutError(error)) {
    result = {
      type: ErrorType.TIMEOUT,
      message: ERROR_MESSAGES[ErrorType.TIMEOUT],
      originalError: error,
      handled: false
    }
  }
  // 3. HTTP Response 错误
  else if (error instanceof Response) {
    result = parseHttpError(error)
    result.originalError = error
  }
  // 4. 业务错误（带有 code 属性的对象）
  else if (typeof error === 'object' && error !== null && 'code' in error) {
    const errorObj = error as { code: string | number; message?: string }
    result = {
      type: ErrorType.BUSINESS,
      code: errorObj.code,
      message: errorObj.message || ERROR_MESSAGES[ErrorType.BUSINESS],
      originalError: error,
      handled: false
    }
  }
  // 5. 标准 Error 对象
  else if (error instanceof Error) {
    result = {
      type: ErrorType.UNKNOWN,
      message: error.message || ERROR_MESSAGES[ErrorType.UNKNOWN],
      originalError: error,
      handled: false
    }
  }
  // 6. 字符串错误
  else if (typeof error === 'string') {
    result = {
      type: ErrorType.UNKNOWN,
      message: error,
      originalError: error,
      handled: false
    }
  }
  // 7. 未知错误
  else {
    result = {
      type: ErrorType.UNKNOWN,
      message: ERROR_MESSAGES[ErrorType.UNKNOWN],
      originalError: error,
      handled: false
    }
  }

  // 记录错误日志
  errorLogger.error(
    context ? `[${context}] ${result.message}` : result.message,
    {
      type: result.type,
      code: result.code,
      originalError: result.originalError
    }
  )

  return result
}

/**
 * 处理错误并显示消息提示
 * 
 * @param error 原始错误对象
 * @param context 错误上下文信息（可选）
 * @returns 标准化的错误处理结果
 */
export function handleErrorWithMessage(error: unknown, context?: string): ErrorResult {
  const result = handleError(error, context)
  
  if (!result.handled) {
    ElMessage.error(result.message)
    result.handled = true
  }
  
  return result
}

/**
 * 处理认证错误（401/Token过期）
 * 会弹出确认框并跳转到登录页
 */
export async function handleAuthError(): Promise<void> {
  errorLogger.warn('检测到认证错误，即将跳转到登录页')
  
  try {
    await ElMessageBox.alert(
      '您的登录状态已失效，请重新登录',
      '认证失败',
      {
        confirmButtonText: '去登录',
        type: 'warning',
        showClose: false
      }
    )
  } catch {
    // 用户关闭弹框
  }
  
  // 清除存储的登录信息
  localStorage.removeItem('user-store')
  
  // 跳转到登录页，携带当前路径作为 redirect 参数
  const currentPath = router.currentRoute.value.fullPath
  router.push({
    path: '/login',
    query: currentPath !== '/login' ? { redirect: currentPath } : undefined
  })
}

/**
 * 创建带有超时的 Promise
 * 
 * @param promise 原始 Promise
 * @param timeoutMs 超时时间（毫秒）
 * @param timeoutMessage 超时错误消息
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = '请求超时'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}

/**
 * 重试机制包装器
 * 
 * @param fn 需要执行的异步函数
 * @param retries 重试次数
 * @param delay 重试延迟（毫秒）
 * @param context 操作上下文（用于日志）
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  context?: string
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt < retries) {
        errorLogger.warn(
          `${context || '操作'} 失败，第 ${attempt}/${retries} 次重试`,
          { error, delay }
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  errorLogger.error(`${context || '操作'} 在 ${retries} 次重试后仍然失败`, lastError)
  throw lastError
}

/**
 * 全局错误处理器 - 用于捕获未处理的 Promise 错误
 */
export function setupGlobalErrorHandler(): void {
  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error('未处理的 Promise 错误', event.reason)
    event.preventDefault()
    
    // 对于认证错误，自动处理
    const result = handleError(event.reason)
    if (result.type === ErrorType.UNAUTHORIZED || result.type === ErrorType.TOKEN_EXPIRED) {
      handleAuthError()
    }
  })
  
  // 捕获全局 JavaScript 错误
  window.addEventListener('error', (event) => {
    errorLogger.error('全局 JavaScript 错误', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })
  
  errorLogger.info('全局错误处理器已安装')
}

export default {
  handleError,
  handleErrorWithMessage,
  handleAuthError,
  withTimeout,
  withRetry,
  setupGlobalErrorHandler,
  ErrorType
}
