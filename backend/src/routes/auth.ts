import { Router, Request, Response } from 'express'
import { findUserByUsername } from '../data/users.js'
import { verifyTotpToken, generateTotpToken } from '../services/totpService.js'
import { generateToken } from '../services/jwtService.js'

const router = Router()

interface VerifyOtpRequest {
  username: string
  code: string
}

interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

router.post('/verify-otp', (req: Request, res: Response) => {
  const { username, code } = req.body as VerifyOtpRequest

  if (!username || !code) {
    const response: ApiResponse = {
      success: false,
      message: '用户名和验证码不能为空'
    }
    return res.status(400).json(response)
  }

  const user = findUserByUsername(username)

  if (!user) {
    const response: ApiResponse = {
      success: false,
      message: '用户名不存在'
    }
    return res.status(401).json(response)
  }

  const totpResult = verifyTotpToken(user.totpSecret, code)

  if (!totpResult.valid) {
    const response: ApiResponse = {
      success: false,
      message: totpResult.message
    }
    return res.status(401).json(response)
  }

  const tokenResult = generateToken(user)

  const response: ApiResponse<{
    token: string
    expiresIn: string
    user: {
      id: string
      username: string
      nickname: string
      email: string
      role: string
      permissions: string[]
    }
  }> = {
    success: true,
    message: '验证成功',
    data: {
      token: tokenResult.token,
      expiresIn: tokenResult.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    }
  }

  res.json(response)
})

router.get('/test-otp/:username', (req: Request, res: Response) => {
  const { username } = req.params
  const user = findUserByUsername(username)

  if (!user) {
    const response: ApiResponse = {
      success: false,
      message: '用户名不存在'
    }
    return res.status(404).json(response)
  }

  const currentOtp = generateTotpToken(user.totpSecret)

  const response: ApiResponse<{
    username: string
    currentOtp: string
    secret: string
  }> = {
    success: true,
    message: '获取成功',
    data: {
      username: user.username,
      currentOtp,
      secret: user.totpSecret
    }
  }

  res.json(response)
})

export default router
