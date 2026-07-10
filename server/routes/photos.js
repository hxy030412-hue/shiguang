import express from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const offset = parseInt(req.query.offset) || 0
  const archived = req.query.archived === '1' ? 1 : 0

  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM photos WHERE user_id = ? AND archived = ?',
    args: [req.userId, archived]
  })
  const total = countResult.rows[0].count

  const photosResult = await db.execute({
    sql: 'SELECT * FROM photos WHERE user_id = ? AND archived = ? ORDER BY id DESC LIMIT ? OFFSET ?',
    args: [req.userId, archived, limit, offset]
  })
  res.json({ photos: photosResult.rows, total, hasMore: offset + limit < total })
})

router.get('/:id', authMiddleware, async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM photos WHERE id = ? AND user_id = ?',
    args: [req.params.id, req.userId]
  })
  if (result.rows.length === 0) return res.status(404).json({ error: '照片不存在' })
  res.json(result.rows[0])
})

router.post('/', authMiddleware, async (req, res) => {
  const { url, title, date, location, lat, lng, people, story } = req.body
  if (!url || !title || !date) {
    return res.status(400).json({ error: 'url、title、date 不能为空' })
  }
  const result = await db.execute({
    sql: 'INSERT INTO photos (user_id, url, title, date, location, lat, lng, people, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [req.userId, url, title, date, location || '', lat || 0, lng || 0, people || '', story || '']
  })

  const photo = await db.execute({ sql: 'SELECT * FROM photos WHERE id = ?', args: [Number(result.lastInsertRowid)] })
  res.json(photo.rows[0])
})

router.put('/:id', authMiddleware, async (req, res) => {
  const existing = await db.execute({
    sql: 'SELECT * FROM photos WHERE id = ? AND user_id = ?',
    args: [req.params.id, req.userId]
  })
  if (existing.rows.length === 0) return res.status(404).json({ error: '照片不存在' })
  const photo = existing.rows[0]

  const { url, title, date, location, lat, lng, people, story } = req.body
  await db.execute({
    sql: 'UPDATE photos SET url=?, title=?, date=?, location=?, lat=?, lng=?, people=?, story=? WHERE id=? AND user_id=?',
    args: [
      url || photo.url, title || photo.title, date || photo.date,
      location ?? photo.location, lat ?? photo.lat, lng ?? photo.lng,
      people ?? photo.people, story ?? photo.story,
      req.params.id, req.userId
    ]
  })

  const updated = await db.execute({ sql: 'SELECT * FROM photos WHERE id = ?', args: [req.params.id] })
  res.json(updated.rows[0])
})

// 归档/恢复
router.put('/:id/archive', authMiddleware, async (req, res) => {
  const existing = await db.execute({
    sql: 'SELECT * FROM photos WHERE id = ? AND user_id = ?',
    args: [req.params.id, req.userId]
  })
  if (existing.rows.length === 0) return res.status(404).json({ error: '照片不存在' })

  const archived = req.body.archived ? 1 : 0
  await db.execute({
    sql: 'UPDATE photos SET archived = ? WHERE id = ? AND user_id = ?',
    args: [archived, req.params.id, req.userId]
  })
  res.json({ success: true, archived })
})

router.delete('/:id', authMiddleware, async (req, res) => {
  const existing = await db.execute({
    sql: 'SELECT * FROM photos WHERE id = ? AND user_id = ?',
    args: [req.params.id, req.userId]
  })
  if (existing.rows.length === 0) return res.status(404).json({ error: '照片不存在' })

  await db.execute({ sql: 'DELETE FROM photos WHERE id = ? AND user_id = ?', args: [req.params.id, req.userId] })
  res.json({ success: true })
})

export default router
