import jwt from 'jsonwebtoken'
import type { User } from '../data/users.js'

const JWT_SECRET = process.env.JWT_SECRET || 'otp-admin-panel-secret-key-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export interface JwtPayload {
  userId: string
  username: string
  role: string
  iat?: number
  exp?: number
}

export interface TokenResult {
  token: string
  expiresIn: string
}

export function generateToken(user: User): TokenResult {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role
  }

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })

  return {
    token,
    expiresIn: JWT_EXPIRES_IN
  }
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch (error) {
    return null
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload
    return decoded
  } catch (error) {
    return null
  }
}
