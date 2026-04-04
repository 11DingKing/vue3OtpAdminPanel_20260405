import { totp } from 'otplib'

totp.options = {
  digits: 6,
  step: 30,
  window: 1
}

export interface TotpVerifyResult {
  valid: boolean
  message: string
}

export function generateTotpSecret(): string {
  return totp.generateSecret()
}

export function generateTotpToken(secret: string): string {
  return totp.generate(secret)
}

export function verifyTotpToken(secret: string, token: string): TotpVerifyResult {
  if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
    return {
      valid: false,
      message: 'OTP验证码格式不正确，请输入6位数字'
    }
  }

  try {
    const isValid = totp.check(token, secret)
    
    if (isValid) {
      return {
        valid: true,
        message: '验证成功'
      }
    } else {
      return {
        valid: false,
        message: 'OTP验证码错误'
      }
    }
  } catch (error) {
    return {
      valid: false,
      message: 'OTP验证过程中发生错误'
    }
  }
}

export function getTotpRemainingTime(): number {
  const now = Date.now()
  const step = 30 * 1000
  return step - (now % step)
}
