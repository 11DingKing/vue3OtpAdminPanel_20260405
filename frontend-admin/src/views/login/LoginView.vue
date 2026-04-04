<script setup lang="ts">
/**
 * 登录视图组件
 * 
 * ⚠️ MOCK 实现说明：
 * ────────────────────────────────────────────────────────────────────
 * 本组件使用模拟的 OTP 验证逻辑，仅用于开发和演示。
 * 
 * 测试账号信息：
 *   - 用户名：admin 或 user
 *   - OTP 验证码：123456（固定值）
 * 
 * 生产环境部署前需要：
 *   1. 对接真实的 OTP 验证服务
 *   2. 实现真实的用户认证 API
 *   3. 添加防暴力破解机制
 * ────────────────────────────────────────────────────────────────────
 */

import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Key, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { verifyOtp, validateOtpFormat, getMockConfig } from '@/utils/otp'
import { logger } from '@/utils/logger'
import { handleError, ErrorType } from '@/utils/error-handler'
import type { FormInstance, FormRules } from 'element-plus'
import type { UserInfo } from '@/types'

// 创建登录模块专用日志记录器
const loginLogger = logger.createLogger('Login')

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const loginForm = reactive({
  username: '',
  otpCode: ''
})

// 加载状态
const loading = ref(false)

// 验证规则
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  otpCode: [
    { required: true, message: '请输入OTP验证码', trigger: 'blur' },
    { 
      validator: (_rule, value, callback) => {
        if (!validateOtpFormat(value)) {
          callback(new Error('请输入6位数字验证码'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 组件挂载时记录日志
onMounted(() => {
  loginLogger.info('登录页面已加载')
  
  // 开发环境下输出 Mock 配置信息
  const mockConfig = getMockConfig()
  if (mockConfig) {
    loginLogger.debug('⚠️ Mock 模式已启用', {
      hint: '有效用户名: ' + mockConfig.validUsers.join(', '),
      otpHint: '有效验证码: ' + mockConfig.validCode
    })
  }
})

/**
 * 登录处理函数
 * 
 * 处理流程：
 * 1. 表单验证
 * 2. OTP 验证
 * 3. 生成 Token 和用户信息（⚠️ MOCK）
 * 4. 保存登录状态
 * 5. 跳转到目标页面
 */
async function handleLogin() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      loginLogger.warn('表单验证失败')
      return
    }
    
    loading.value = true
    loginLogger.info('开始登录流程', { username: loginForm.username })
    
    try {
      // 验证 OTP
      const result = await verifyOtp(loginForm.username, loginForm.otpCode)
      
      if (!result.valid) {
        loginLogger.warn('OTP 验证失败', { 
          username: loginForm.username, 
          message: result.message,
          errorType: result.errorType 
        })
        
        // 根据错误类型显示不同的提示
        if (result.errorType === ErrorType.NETWORK) {
          ElMessage.error('网络连接失败，请检查网络设置')
        } else if (result.errorType === ErrorType.TIMEOUT) {
          ElMessage.error('验证请求超时，请稍后重试')
        } else {
          ElMessage.error(result.message)
        }
        return
      }
      
      loginLogger.info('OTP 验证通过，准备生成登录凭证', { username: loginForm.username })
      
      /**
       * ⚠️ MOCK: 模拟生成 token 和用户信息
       * 
       * 【注意】这是硬编码的测试数据！
       * 生产环境中应该：
       *   1. 从后端 API 获取真实的 JWT Token
       *   2. 从后端获取用户信息
       *   3. Token 应该由后端安全签发
       */
      const mockToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const mockUser: UserInfo = {
        id: loginForm.username === 'admin' ? '1' : '2',
        username: loginForm.username,
        nickname: loginForm.username === 'admin' ? '系统管理员' : '普通用户',
        email: `${loginForm.username}@example.com`,
        role: loginForm.username === 'admin' ? 'admin' : 'user',
        permissions: loginForm.username === 'admin' 
          ? ['dashboard', 'users', 'settings', 'profile'] 
          : ['dashboard', 'profile']
      }
      
      // 保存登录状态
      userStore.login(mockToken, mockUser)
      loginLogger.info('登录成功，用户状态已保存', { 
        username: mockUser.username, 
        role: mockUser.role 
      })
      
      ElMessage.success('登录成功')
      
      // 跳转到目标页面
      const redirect = route.query.redirect as string
      const targetPath = redirect || '/dashboard'
      loginLogger.debug('准备跳转到目标页面', { targetPath })
      router.push(targetPath)
      
    } catch (error) {
      // 使用统一的错误处理机制
      const errorResult = handleError(error, '登录')
      loginLogger.error('登录过程发生异常', { 
        error, 
        errorType: errorResult.type,
        message: errorResult.message 
      })
      
      // 根据错误类型显示不同的错误提示
      switch (errorResult.type) {
        case ErrorType.NETWORK:
          ElMessage.error('网络连接失败，请检查您的网络设置后重试')
          break
        case ErrorType.TIMEOUT:
          ElMessage.error('请求超时，服务器响应较慢，请稍后重试')
          break
        case ErrorType.SERVER:
          ElMessage.error('服务器暂时不可用，请稍后重试')
          break
        case ErrorType.UNAUTHORIZED:
        case ErrorType.TOKEN_EXPIRED:
          ElMessage.error('认证失败，请重新登录')
          break
        default:
          ElMessage.error(errorResult.message || '登录失败，请稍后重试')
      }
    } finally {
      loading.value = false
    }
  })
}

/**
 * 重置表单
 */
function resetForm() {
  formRef.value?.resetFields()
  loginLogger.debug('登录表单已重置')
}
</script>

<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48" color="#409eff">
            <Lock />
          </el-icon>
        </div>
        <h1 class="title">OTP管理系统</h1>
        <p class="subtitle">使用动态密码安全登录</p>
      </div>
      
      <!-- 登录表单 -->
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="otpCode">
          <el-input
            v-model="loginForm.otpCode"
            placeholder="请输入6位OTP验证码"
            size="large"
            :prefix-icon="Key"
            maxlength="6"
            clearable
          />
        </el-form-item>
        
        <div class="otp-hint">
          <el-icon><Key /></el-icon>
          <span>请使用动态密码验证器获取验证码</span>
        </div>
        
        <el-form-item class="form-actions">
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '安全登录' }}
          </el-button>
        </el-form-item>
        
        <div class="form-footer">
          <el-button type="text" @click="resetForm">重置表单</el-button>
        </div>
      </el-form>
    </div>
    
    <!-- 版权信息 -->
    <div class="copyright">
      © 2024 OTP管理系统. All rights reserved.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  position: relative;
  overflow: hidden;
  padding: var(--spacing-lg);
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
  }
  
  .circle-1 {
    width: 400px;
    height: 400px;
    background: linear-gradient(180deg, #bfdbfe 0%, #ddd6fe 100%);
    top: -100px;
    right: -100px;
    animation: float 8s ease-in-out infinite;
  }
  
  .circle-2 {
    width: 300px;
    height: 300px;
    background: linear-gradient(180deg, #cffafe 0%, #bfdbfe 100%);
    bottom: -50px;
    left: -50px;
    animation: float 10s ease-in-out infinite reverse;
  }
  
  .circle-3 {
    width: 200px;
    height: 200px;
    background: linear-gradient(180deg, #ddd6fe 0%, #fbcfe8 100%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 6s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.4;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  
  .logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    border-radius: 20px;
    margin-bottom: var(--spacing-md);
    border: 1px solid rgba(64, 158, 255, 0.2);
  }
  
  .title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 var(--spacing-sm);
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: var(--spacing-lg);
  }
  
  :deep(.el-input) {
    --el-input-bg-color: #f8fafc;
    --el-input-border-color: #e2e8f0;
    --el-input-hover-border-color: #409eff;
    --el-input-focus-border-color: #409eff;
    --el-input-text-color: #1e293b;
    --el-input-placeholder-color: #94a3b8;
    
    .el-input__wrapper {
      border-radius: var(--radius-md);
      padding: 4px 16px;
      transition: all var(--transition-normal);
      box-shadow: 0 0 0 1px var(--el-input-border-color) inset !important;
      
      &:hover {
        box-shadow: 0 0 0 1px var(--el-input-hover-border-color) inset !important;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-input-focus-border-color) inset,
                    0 0 10px rgba(64, 158, 255, 0.1) !important;
      }
    }
  }
}

.otp-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(64, 158, 255, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: 12px;
  color: #409eff;
}

.form-actions {
  margin-bottom: var(--spacing-md);
  
  :deep(.el-form-item__content) {
    display: block;
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #409eff 0%, #6366f1 100%);
  border: none;
  transition: all var(--transition-normal);
  color: #fff;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #66b1ff 0%, #818cf8 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(64, 158, 255, 0.2);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.form-footer {
  text-align: center;
  
  :deep(.el-button) {
    color: #64748b;
    font-size: 13px;
    
    &:hover {
      color: #409eff;
    }
  }
}

.copyright {
  position: absolute;
  bottom: var(--spacing-lg);
  font-size: 12px;
  color: #94a3b8;
}
</style>


