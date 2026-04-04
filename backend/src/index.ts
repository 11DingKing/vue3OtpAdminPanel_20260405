import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OTP Auth Backend is running',
    timestamp: new Date().toISOString()
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 OTP Auth Backend running on http://localhost:${PORT}`)
  console.log(`📚 API Documentation:`)
  console.log(`   - GET  /api/health          - 健康检查`)
  console.log(`   - POST /api/auth/verify-otp - OTP验证登录`)
  console.log(`   - GET  /api/auth/test-otp/:username - 获取测试用OTP`)
  console.log('')
  console.log(`🔑 Test Users:`)
  console.log(`   - admin (管理员)`)
  console.log(`   - user (普通用户)`)
  console.log('')
  console.log(`💡 Tips: 访问 GET /api/auth/test-otp/admin 获取当前有效的OTP验证码`)
})
