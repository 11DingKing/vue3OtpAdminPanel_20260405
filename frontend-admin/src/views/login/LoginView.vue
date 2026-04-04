<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Key, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { verifyOtp, validateOtpFormat } from '@/utils/otp'
import { logger } from '@/utils/logger'
import { handleError, ErrorType } from '@/utils/error-handler'
import type { FormInstance, FormRules } from 'element-plus'

const loginLogger = logger.createLogger('Login')

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  otpCode: ''
})

const loading = ref(false)

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

onMounted(() => {
  loginLogger.info('登录页面已加载')
})

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
      const result = await verifyOtp(loginForm.username, loginForm.otpCode)
      
      if (!result.valid) {
        loginLogger.warn('OTP 验证失败', { 
          username: loginForm.username, 
          message: result.message,
          errorType: result.errorType 
        })
        
        if (result.errorType === ErrorType.NETWORK) {
          ElMessage.error('网络连接失败，请检查网络设置')
        } else if (result.errorType === ErrorType.TIMEOUT) {
          ElMessage.error('验证请求超时，请稍后重试')
        } else {
          ElMessage.error(result.message)
        }
        return
      }
      
      if (!result.token || !result.user) {
        loginLogger.error('OTP 验证成功但缺少必要数据', { 
          username: loginForm.username,
          hasToken: !!result.token,
          hasUser: !!result.user
        })
        ElMessage.error('登录响应数据异常，请稍后重试')
        return
      }
      
      loginLogger.info('OTP 验证通过，保存登录状态', { 
        username: result.user.username,
        role: result.user.role
      })
      
      userStore.login(result.token, result.user)
      
      loginLogger.info('登录成功', { 
        username: result.user.username, 
        role: result.user.role 
      })
      
      ElMessage.success('登录成功')
      
      const redirect = route.query.redirect as string
      const targetPath = redirect || '/dashboard'
      loginLogger.debug('准备跳转到目标页面', { targetPath })
      router.push(targetPath)
      
    } catch (error) {
      const errorResult = handleError(error, '登录')
      loginLogger.error('登录过程发生异常', { 
        error, 
        errorType: errorResult.type,
        message: errorResult.message 
      })
      
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

function resetForm() {
  formRef.value?.resetFields()
  loginLogger.debug('登录表单已重置')
}
</script>

<template>
  <div class="login-container">
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48" color="#409eff">
            <Lock />
          </el-icon>
        </div>
        <h1 class="title">OTP管理系统</h1>
        <p class="subtitle">使用动态密码安全登录</p>
      </div>
      
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
