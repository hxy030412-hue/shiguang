import express from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  const photos = db.prepare('SELECT * FROM photos WHERE user_id = ? ORDER BY id DESC').all(req.userId)
  res.json(photos)
})

router.get('/:id', authMiddleware, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!photo) return res.status(404).json({ error: '照片不存在' })
  res.json(photo)
})

router.post('/', authMiddleware, (req, res) => {
  const { url, title, date, location, lat, lng, people, story } = req.body
  if (!url || !title || !date) {
    return res.status(400).json({ error: 'url、title、date 不能为空' })
  }
  const result = db.prepare(
    'INSERT INTO photos (user_id, url, title, date, location, lat, lng, people, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, url, title, date, location || '', lat || 0, lng || 0, people || '', story || '')

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid)
  res.json(photo)
})

router.put('/:id', authMiddleware, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!photo) return res.status(404).json({ error: '照片不存在' })

  const { url, title, date, location, lat, lng, people, story } = req.body
  db.prepare(
    'UPDATE photos SET url=?, title=?, date=?, location=?, lat=?, lng=?, people=?, story=? WHERE id=? AND user_id=?'
  ).run(
    url || photo.url, title || photo.title, date || photo.date,
    location ?? photo.location, lat ?? photo.lat, lng ?? photo.lng,
    people ?? photo.people, story ?? photo.story,
    req.params.id, req.userId
  )

  const updated = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id)
  res.json(updated)
})

router.delete('/:id', authMiddleware, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!photo) return res.status(404).json({ error: '照片不存在' })

  db.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  res.json({ success: true })
})

export default router
