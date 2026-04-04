// 用户信息类型
export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  email?: string
  role: 'admin' | 'user'
  permissions: string[]
}

// 登录表单类型
export interface LoginForm {
  username: string
  otpCode: string
}

// 登录响应类型
export interface LoginResponse {
  success: boolean
  message: string
  data?: {
    token: string
    user: UserInfo
  }
}

// 菜单项类型
export interface MenuItem {
  path: string
  title: string
  icon?: string
  children?: MenuItem[]
  permission?: string
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// OTP 验证类型
export interface OtpVerifyRequest {
  username: string
  code: string
}

export interface OtpVerifyResponse {
  valid: boolean
  message: string
}

