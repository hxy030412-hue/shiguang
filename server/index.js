import app from './app.js'
import { initDB } from './db.js'

const PORT = process.env.PORT || 3000

// 初始化数据库
await initDB()
console.log('Database initialized')

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
