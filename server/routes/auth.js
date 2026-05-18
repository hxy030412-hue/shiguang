import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { SECRET } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare('INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)').run(username, hash, username)

  const token = jwt.sign({ id: result.lastInsertRowid }, SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: result.lastInsertRowid, username, nickname: username } })
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' })
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(400).json({ error: '用户名或密码错误' })
  }

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' })
  res.json({
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, bio: user.bio }
  })
})

export default router
