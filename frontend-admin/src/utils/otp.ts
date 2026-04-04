/**
 * OTP 验证工具
 * 
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                              ⚠️ MOCK 实现说明 ⚠️                               ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║ 本文件包含的所有 OTP 验证逻辑均为 MOCK（模拟）实现，仅用于开发和演示目的。      ║
 * ║                                                                              ║
 * ║ 【重要】Mock 数据说明：                                                        ║
 * ║   - 有效用户名：admin, user                                                   ║
 * ║   - 有效 OTP 验证码：123456（固定值）                                          ║
 * ║   - 网络延迟：模拟 800ms                                                      ║
 * ║                                                                              ║
 * ║ 【生产环境注意事项】                                                           ║
 * ║   1. 必须替换为真实的 OTP 服务（如 Google Authenticator, Authy 等）            ║
 * ║   2. 需要实现 TOTP/HOTP 算法或对接第三方服务                                   ║
 * ║   3. 验证码应该是动态生成的，每30秒更新一次                                     ║
 * ║   4. 应该使用安全的后端 API 进行验证，而非前端硬编码                            ║
 * ║   5. 需要实现防暴力破解机制（限制尝试次数、账户锁定等）                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { logger } from './logger'
import { handleError, withTimeout, ErrorType, type ErrorResult } from './error-handler'

// 创建 OTP 模块专用日志记录器
const otpLogger = logger.createLogger('OTP')

// ============================================================================
// MOCK 配置常量
// ============================================================================

/**
 * ⚠️ MOCK: 固定的有效 OTP 验证码
 * 
 * 【注意】这是硬编码的测试值，仅用于开发环境！
 * 生产环境中应该：
 *   1. 从后端 API 验证 OTP
 *   2. 使用 TOTP 算法动态生成
 *   3. 不在前端存储任何验证码
 */
const MOCK_VALID_OTP_CODE = '123456'

/**
 * ⚠️ MOCK: 有效的测试用户列表
 * 
 * 【注意】这是硬编码的测试数据！
 * 生产环境中应该从后端数据库查询用户。
 */
const MOCK_VALID_USERS = ['admin', 'user']

/**
 * ⚠️ MOCK: 模拟的网络延迟时间（毫秒）
 * 用于模拟真实 API 调用的延迟
 */
const MOCK_NETWORK_DELAY_MS = 800

/**
 * 默认请求超时时间（毫秒）
 */
const DEFAULT_TIMEOUT_MS = 10000

// ============================================================================
// OTP 验证函数
// ============================================================================

/**
 * 验证 OTP 码格式
 * 
 * @param code OTP 验证码
 * @returns 是否格式正确（6位数字）
 */
export function validateOtpFormat(code: string): boolean {
  const isValid = /^\d{6}$/.test(code)
  otpLogger.debug(`OTP 格式验证: ${isValid ? '通过' : '失败'}`, { code: code.replace(/./g, '*') })
  return isValid
}

/**
 * OTP 验证结果接口
 */
export interface OtpVerifyResult {
  valid: boolean
  message: string
  errorType?: ErrorType
}

/**
 * 模拟验证 OTP 码
 * 
 * ⚠️ MOCK 实现 - 详细说明：
 * ────────────────────────────────────────────────────────────────────
 * 此函数使用硬编码的值进行验证：
 *   - 用户名必须是 'admin' 或 'user'
 *   - OTP 验证码必须是 '123456'
 * 
 * 这是为了方便开发和测试。在生产环境中，此函数应该：
 *   1. 调用后端 API 进行验证
 *   2. 后端使用 TOTP 算法（RFC 6238）验证码
 *   3. 实现重试限制和账户锁定机制
 * ────────────────────────────────────────────────────────────────────
 * 
 * @param username 用户名
 * @param code OTP 验证码
 * @returns 验证结果
 */
export async function verifyOtp(username: string, code: string): Promise<OtpVerifyResult> {
  otpLogger.info('开始 OTP 验证', { username, codeLength: code.length })
  
  try {
    // 使用超时包装器，防止无限等待
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

/**
 * 执行 OTP 验证的内部函数
 * 
 * @internal
 */
async function performOtpVerification(username: string, code: string): Promise<OtpVerifyResult> {
  // ⚠️ MOCK: 模拟网络延迟
  // 生产环境中这里应该是真实的 API 调用
  otpLogger.debug(`模拟网络延迟: ${MOCK_NETWORK_DELAY_MS}ms`)
  await new Promise(resolve => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))
  
  // 验证格式
  if (!validateOtpFormat(code)) {
    otpLogger.warn('OTP 验证失败: 格式错误', { username })
    return {
      valid: false,
      message: 'OTP验证码格式不正确，请输入6位数字',
      errorType: ErrorType.VALIDATION
    }
  }
  
  // ⚠️ MOCK: 验证用户名是否在测试用户列表中
  // 生产环境应该查询后端数据库
  if (!MOCK_VALID_USERS.includes(username.toLowerCase())) {
    otpLogger.warn('OTP 验证失败: 用户不存在', { username })
    return {
      valid: false,
      message: '用户名不存在',
      errorType: ErrorType.BUSINESS
    }
  }
  
  // ⚠️ MOCK: 验证 OTP 验证码是否等于固定值 '123456'
  // 【重要】这是硬编码的测试值！生产环境必须替换为真实的 TOTP 验证逻辑
  if (code !== MOCK_VALID_OTP_CODE) {
    otpLogger.warn('OTP 验证失败: 验证码错误', { username })
    return {
      valid: false,
      message: 'OTP验证码错误',
      errorType: ErrorType.BUSINESS
    }
  }
  
  // ⚠️ MOCK: 验证通过
  // 生产环境中应该在后端完成验证后返回真实的 token
  otpLogger.info('OTP 验证成功', { username })
  return {
    valid: true,
    message: '验证成功'
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 生成模拟的 OTP 密钥
 * 
 * ⚠️ MOCK 实现 - 仅用于演示！
 * ────────────────────────────────────────────────────────────────────
 * 此函数生成一个随机的 Base32 编码密钥，仅用于演示目的。
 * 
 * 生产环境中应该：
 *   1. 在后端安全地生成密钥
 *   2. 使用加密安全的随机数生成器（如 crypto.getRandomValues）
 *   3. 将密钥安全地存储在后端数据库中
 *   4. 通过安全的方式传输给客户端（如 QR 码）
 * ────────────────────────────────────────────────────────────────────
 * 
 * @returns Base32 编码的密钥
 */
export function generateMockSecret(): string {
  otpLogger.debug('生成模拟 OTP 密钥')
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  otpLogger.info('模拟 OTP 密钥已生成', { secretLength: secret.length })
  return secret
}

/**
 * 获取 Mock 配置信息（仅开发环境可用）
 * 
 * @returns Mock 配置信息，生产环境返回 null
 */
export function getMockConfig(): { validUsers: string[]; validCode: string } | null {
  if (import.meta.env.DEV) {
    otpLogger.debug('获取 Mock 配置信息')
    return {
      validUsers: [...MOCK_VALID_USERS],
      validCode: MOCK_VALID_OTP_CODE
    }
  }
  return null
}

