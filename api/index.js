import { initDB } from '../server/db.js'
import app from '../server/app.js'

// Vercel serverless: 初始化数据库
let dbReady = false

export default async function handler(req, res) {
  if (!dbReady) {
    await initDB()
    dbReady = true
  }
  return app(req, res)
}
