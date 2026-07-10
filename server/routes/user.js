import express from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/profile', authMiddleware, async (req, res) => {
  const result = await db.execute({ sql: 'SELECT id, username, nickname, avatar, bio FROM users WHERE id = ?', args: [req.userId] })
  const user = result.rows[0]
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json(user)
})

router.put('/profile', authMiddleware, async (req, res) => {
  const { nickname, avatar, bio } = req.body
  await db.execute({
    sql: 'UPDATE users SET nickname = ?, avatar = ?, bio = ? WHERE id = ?',
    args: [nickname || '', avatar || '', bio || '', req.userId]
  })
  const result = await db.execute({ sql: 'SELECT id, username, nickname, avatar, bio FROM users WHERE id = ?', args: [req.userId] })
  res.json(result.rows[0])
})

export default router
