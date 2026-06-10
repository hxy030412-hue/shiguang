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
const PORT = 3000

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/layouts', layoutsRoutes)

// 托管前端打包文件
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
