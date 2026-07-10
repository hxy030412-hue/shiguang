import app from '../server/app.js'
import { initDB } from '../server/db.js'

// Vercel serverless: 初始化数据库（只执行一次）
let dbReady = false

export default async function handler(req, res) {
  if (!dbReady) {
    await initDB()
    dbReady = true
  }
  return app(req, res)
}
