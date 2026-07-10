import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import photosRoutes from './routes/photos.js'
import uploadRoutes from './routes/upload.js'
import layoutsRoutes from './routes/layouts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const uploadsDir = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsDir))

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/layouts', layoutsRoutes)

// 托管前端打包文件
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

// SPA 回退 — Express 4 兼容写法
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// 全局错误处理 — 确保所有响应都是 JSON
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
