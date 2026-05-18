import express from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, bio FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json(user)
})

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, avatar, bio } = req.body
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, bio = ? WHERE id = ?').run(nickname || '', avatar || '', bio || '', req.userId)
  const user = db.prepare('SELECT id, username, nickname, avatar, bio FROM users WHERE id = ?').get(req.userId)
  res.json(user)
})

export default router
