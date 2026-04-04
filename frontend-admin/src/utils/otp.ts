import { logger } from './logger'
import { handleError, withTimeout, ErrorType, type ErrorResult } from './error-handler'
import { api } from './api'
import type { UserInfo } from '@/types'

const otpLogger = logger.createLogger('OTP')

const DEFAULT_TIMEOUT_MS = 10000

export interface OtpVerifyResult {
  valid: boolean
  message: string
  errorType?: ErrorType
  token?: string
  user?: UserInfo
}

export interface VerifyOtpResponse {
  token: string
  expiresIn: string
  user: UserInfo
}

export function validateOtpFormat(code: string): boolean {
  const isValid = /^\d{6}$/.test(code)
  otpLogger.debug(`OTP 格式验证: ${isValid ? '通过' : '失败'}`, { code: code.replace(/./g, '*') })
  return isValid
}

export async function verifyOtp(username: string, code: string): Promise<OtpVerifyResult> {
  otpLogger.info('开始 OTP 验证', { username, codeLength: code.length })
  
  try {
    return await withTimeout(
      performOtpVerification(username, code),
      DEFAULT_TIMEOUT_MS,
      'OTP 验证请求超时'
    )
  } catch (error) {
    const errorResult = handleError(error, 'OTP验证')
    otpLogger.error('OTP 验证过程发生错误', { error, errorResult })
    
    return {
      valid: false,
      message: errorResult.message,
      errorType: errorResult.type
    }
  }
}

async function performOtpVerification(username: string, code: string): Promise<OtpVerifyResult> {
  if (!validateOtpFormat(code)) {
    otpLogger.warn('OTP 验证失败: 格式错误', { username })
    return {
      valid: false,
      message: 'OTP验证码格式不正确，请输入6位数字',
      errorType: ErrorType.VALIDATION
    }
  }

  otpLogger.debug('调用后端 API 进行 OTP 验证', { username })

  const response = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
    username,
    code
  })

  if (!response.success) {
    otpLogger.warn('OTP 验证失败', { username, message: response.message })
    return {
      valid: false,
      message: response.message,
      errorType: ErrorType.BUSINESS
    }
  }

  if (!response.data) {
    otpLogger.error('OTP 验证成功但返回数据为空', { username })
    return {
      valid: false,
      message: '验证响应数据异常',
      errorType: ErrorType.SERVER
    }
  }

  otpLogger.info('OTP 验证成功', { username })

  return {
    valid: true,
    message: '验证成功',
    token: response.data.token,
    user: response.data.user
  }
}

export function generateMockSecret(): string {
  otpLogger.warn('generateMockSecret 已废弃，生产环境应使用后端生成的密钥')
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return secret
}

export function getMockConfig(): null {
  otpLogger.debug('getMockConfig 已废弃，生产环境不使用 Mock 配置')
  return null
}
