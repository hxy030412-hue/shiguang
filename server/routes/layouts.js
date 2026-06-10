import express from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 获取用户所有布局
router.get('/', authMiddleware, (req, res) => {
  const layouts = db.prepare(
    'SELECT photo_id, x, y, rotate, z_index, scale, is_pinned FROM photo_layouts WHERE user_id = ?'
  ).all(req.userId)
  res.json({ layouts })
})

// 批量保存布局（upsert）
router.put('/', authMiddleware, (req, res) => {
  const { layouts } = req.body
  if (!Array.isArray(layouts) || layouts.length === 0) {
    return res.status(400).json({ error: 'layouts 不能为空' })
  }

  const upsert = db.prepare(`
    INSERT INTO photo_layouts (user_id, photo_id, x, y, rotate, z_index, scale, is_pinned, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, photo_id)
    DO UPDATE SET x=excluded.x, y=excluded.y, rotate=excluded.rotate,
      z_index=excluded.z_index, scale=excluded.scale, is_pinned=excluded.is_pinned,
      updated_at=datetime('now')
  `)

  const insertMany = db.transaction((items) => {
    let count = 0
    for (const item of items) {
      upsert.run(
        req.userId,
        item.photo_id,
        item.x,
        item.y,
        item.rotate ?? 0,
        item.z_index ?? 1,
        item.scale ?? 1,
        item.is_pinned ?? 0
      )
      count++
    }
    return count
  })

  const saved = insertMany(layouts)
  res.json({ saved })
})

// 重置用户所有布局（清空）
router.delete('/', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM photo_layouts WHERE user_id = ?').run(req.userId)
  res.json({ success: true })
})

// 切换置顶状态
router.put('/:photoId/pin', authMiddleware, (req, res) => {
  const { is_pinned } = req.body
  const layout = db.prepare(
    'SELECT * FROM photo_layouts WHERE user_id = ? AND photo_id = ?'
  ).get(req.userId, req.params.photoId)

  if (!layout) {
    return res.status(404).json({ error: '布局不存在' })
  }

  db.prepare(
    'UPDATE photo_layouts SET is_pinned = ?, updated_at = datetime(\'now\') WHERE user_id = ? AND photo_id = ?'
  ).run(is_pinned ? 1 : 0, req.userId, req.params.photoId)

  res.json({ success: true, is_pinned: is_pinned ? 1 : 0 })
})

export default router
