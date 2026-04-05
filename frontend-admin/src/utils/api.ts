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

function getStatusMessage(status: number): string {
  const statusMessages: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    405: '请求方法不允许',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  }
  return statusMessages[status] || `请求失败 (${status})`
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!isJson) {
    const text = await response.text()
    apiLogger.warn('响应不是 JSON 格式', { 
      status: response.status, 
      contentType,
      textPreview: text.substring(0, 200)
    })

    return {
      success: false,
      message: getStatusMessage(response.status)
    }
  }

  try {
    const data = await response.json()
    return data as ApiResponse<T>
  } catch (error) {
    apiLogger.error('JSON 解析失败', { error })
    return {
      success: false,
      message: '响应数据格式错误'
    }
  }
}

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

    const data = await parseResponse<T>(response)

    if (!response.ok) {
      apiLogger.warn(`请求失败`, { 
        status: response.status, 
        statusText: response.statusText,
        message: data.message 
      })
      
      return {
        success: false,
        message: data.message || getStatusMessage(response.status)
      }
    }

    apiLogger.debug(`请求成功`, { method, url })
    return data

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
      message = '网络连接失败，请检查网络设置或后端服务是否启动'
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
