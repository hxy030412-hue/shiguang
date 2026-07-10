import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import photosRoutes from './routes/photos.js'
import uploadRoutes from './routes/upload.js'
import layoutsRoutes from './routes/layouts.js'

const app = express()

app.use(cors())
app.use(express.json())

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/layouts', layoutsRoutes)

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

export default app
