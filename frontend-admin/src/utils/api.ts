import { logger } from './logger'
import { handleError, ErrorType } from './error-handler'

const apiLogger = logger.createLogger('API')

const API_BASE_URL = '/api'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
}

const DEFAULT_TIMEOUT = 10000

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, timeout = DEFAULT_TIMEOUT } = options

  const url = `${API_BASE_URL}${endpoint}`

  apiLogger.debug(`发起请求`, { method, url })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include'
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      apiLogger.warn(`请求失败`, { 
        status: response.status, 
        statusText: response.statusText,
        message: data.message 
      })
      
      return {
        success: false,
        message: data.message || `请求失败: ${response.status}`
      }
    }

    apiLogger.debug(`请求成功`, { method, url })
    return data as ApiResponse<T>

  } catch (error) {
    clearTimeout(timeoutId)

    const errorResult = handleError(error, 'API请求')
    
    apiLogger.error(`请求异常`, { 
      error, 
      errorType: errorResult.type,
      message: errorResult.message 
    })

    let message = errorResult.message
    if (errorResult.type === ErrorType.TIMEOUT) {
      message = '请求超时，请稍后重试'
    } else if (errorResult.type === ErrorType.NETWORK) {
      message = '网络连接失败，请检查网络设置'
    }

    return {
      success: false,
      message
    }
  }
}

export const api = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'GET' })
  },

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) {
    return request<T>(endpoint, { ...options, method: 'POST', body })
  },

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) {
    return request<T>(endpoint, { ...options, method: 'PUT', body })
  },

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
