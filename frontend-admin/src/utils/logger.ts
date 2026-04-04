/**
 * 日志记录工具
 * 
 * 提供统一的日志记录机制，支持不同级别的日志输出，
 * 便于开发调试和生产环境问题排查。
 * 
 * 使用示例：
 *   logger.info('用户登录', { username: 'admin' })
 *   logger.error('登录失败', error)
 *   logger.warn('验证码即将过期')
 *   logger.debug('调试信息', data)
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 日志条目接口
export interface LogEntry {
  timestamp: string
  level: keyof typeof LogLevel
  message: string
  data?: unknown
  source?: string
}

// 日志配置接口
interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  maxStorageEntries: number
  prefix: string
}

// 默认配置
const defaultConfig: LoggerConfig = {
  // 开发环境显示所有日志，生产环境只显示警告和错误
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 100,
  prefix: '[OTP-Admin]'
}

// 当前配置
let config: LoggerConfig = { ...defaultConfig }

// 存储的日志条目
const logStorage: LogEntry[] = []

// 存储键名
const LOG_STORAGE_KEY = 'app_logs'

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  const now = new Date()
  return now.toISOString()
}

/**
 * 获取日志级别对应的控制台方法和样式
 */
function getLogStyle(level: keyof typeof LogLevel): { method: 'log' | 'info' | 'warn' | 'error'; color: string } {
  switch (level) {
    case 'DEBUG':
      return { method: 'log', color: '#9CA3AF' }
    case 'INFO':
      return { method: 'info', color: '#3B82F6' }
    case 'WARN':
      return { method: 'warn', color: '#F59E0B' }
    case 'ERROR':
      return { method: 'error', color: '#EF4444' }
    default:
      return { method: 'log', color: '#6B7280' }
  }
}

/**
 * 输出日志到控制台
 */
function outputToConsole(entry: LogEntry): void {
  if (!config.enableConsole) return

  const { method, color } = getLogStyle(entry.level)
  const prefix = `%c${config.prefix} [${entry.level}] ${entry.timestamp}`
  const style = `color: ${color}; font-weight: bold;`

  if (entry.data !== undefined) {
    console[method](prefix, style, entry.message, entry.data)
  } else {
    console[method](prefix, style, entry.message)
  }
}

/**
 * 存储日志条目
 */
function storeLogEntry(entry: LogEntry): void {
  if (!config.enableStorage) return

  logStorage.push(entry)

  // 限制存储数量
  while (logStorage.length > config.maxStorageEntries) {
    logStorage.shift()
  }

  // 同步到 localStorage（仅在开发环境）
  if (import.meta.env.DEV) {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logStorage))
    } catch {
      // 存储失败时忽略（可能是存储空间不足）
    }
  }
}

/**
 * 创建日志条目
 */
function createLogEntry(level: keyof typeof LogLevel, message: string, data?: unknown, source?: string): LogEntry {
  return {
    timestamp: formatTimestamp(),
    level,
    message,
    data,
    source
  }
}

/**
 * 记录日志的核心方法
 */
function log(level: keyof typeof LogLevel, message: string, data?: unknown, source?: string): void {
  // 检查日志级别
  if (LogLevel[level] < config.level) return

  const entry = createLogEntry(level, message, data, source)
  outputToConsole(entry)
  storeLogEntry(entry)
}

/**
 * 日志记录器对象
 */
export const logger = {
  /**
   * 调试级别日志 - 用于开发调试信息
   * @param message 日志消息
   * @param data 附加数据（可选）
   * @param source 日志来源（可选）
   */
  debug(message: string, data?: unknown, source?: string): void {
    log('DEBUG', message, data, source)
  },

  /**
   * 信息级别日志 - 用于一般性信息记录
   * @param message 日志消息
   * @param data 附加数据（可选）
   * @param source 日志来源（可选）
   */
  info(message: string, data?: unknown, source?: string): void {
    log('INFO', message, data, source)
  },

  /**
   * 警告级别日志 - 用于潜在问题警告
   * @param message 日志消息
   * @param data 附加数据（可选）
   * @param source 日志来源（可选）
   */
  warn(message: string, data?: unknown, source?: string): void {
    log('WARN', message, data, source)
  },

  /**
   * 错误级别日志 - 用于错误信息记录
   * @param message 日志消息
   * @param data 附加数据（可选，通常是 Error 对象）
   * @param source 日志来源（可选）
   */
  error(message: string, data?: unknown, source?: string): void {
    log('ERROR', message, data, source)
  },

  /**
   * 配置日志记录器
   * @param newConfig 新的配置项（部分）
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig }
    logger.debug('日志配置已更新', config, 'Logger')
  },

  /**
   * 获取当前配置
   */
  getConfig(): LoggerConfig {
    return { ...config }
  },

  /**
   * 获取存储的日志条目
   * @param count 获取的条目数量（默认全部）
   */
  getLogs(count?: number): LogEntry[] {
    if (count === undefined) {
      return [...logStorage]
    }
    return logStorage.slice(-count)
  },

  /**
   * 清空存储的日志
   */
  clearLogs(): void {
    logStorage.length = 0
    try {
      localStorage.removeItem(LOG_STORAGE_KEY)
    } catch {
      // 忽略错误
    }
    logger.debug('日志已清空', undefined, 'Logger')
  },

  /**
   * 导出日志为 JSON 字符串
   */
  exportLogs(): string {
    return JSON.stringify(logStorage, null, 2)
  },

  /**
   * 创建带有固定来源标识的子日志记录器
   * @param source 日志来源标识
   */
  createLogger(source: string) {
    return {
      debug: (message: string, data?: unknown) => logger.debug(message, data, source),
      info: (message: string, data?: unknown) => logger.info(message, data, source),
      warn: (message: string, data?: unknown) => logger.warn(message, data, source),
      error: (message: string, data?: unknown) => logger.error(message, data, source)
    }
  }
}

// 初始化时记录
logger.info('日志系统初始化完成', { 
  level: LogLevel[config.level],
  environment: import.meta.env.DEV ? 'development' : 'production'
}, 'Logger')

export default logger
