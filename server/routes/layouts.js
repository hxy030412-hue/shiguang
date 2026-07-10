import express from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 获取用户所有布局
router.get('/', authMiddleware, async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT photo_id, x, y, rotate, z_index, scale, is_pinned FROM photo_layouts WHERE user_id = ?',
    args: [req.userId]
  })
  res.json({ layouts: result.rows })
})

// 批量保存布局（upsert）
router.put('/', authMiddleware, async (req, res) => {
  const { layouts } = req.body
  if (!Array.isArray(layouts) || layouts.length === 0) {
    return res.status(400).json({ error: 'layouts 不能为空' })
  }

  let count = 0
  for (const item of layouts) {
    await db.execute({
      sql: `INSERT INTO photo_layouts (user_id, photo_id, x, y, rotate, z_index, scale, is_pinned, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, photo_id)
            DO UPDATE SET x=excluded.x, y=excluded.y, rotate=excluded.rotate,
              z_index=excluded.z_index, scale=excluded.scale, is_pinned=excluded.is_pinned,
              updated_at=datetime('now')`,
      args: [
        req.userId, item.photo_id, item.x, item.y,
        item.rotate ?? 0, item.z_index ?? 1, item.scale ?? 1, item.is_pinned ?? 0
      ]
    })
    count++
  }

  res.json({ saved: count })
})

// 重置用户所有布局（清空）
router.delete('/', authMiddleware, async (req, res) => {
  await db.execute({ sql: 'DELETE FROM photo_layouts WHERE user_id = ?', args: [req.userId] })
  res.json({ success: true })
})

// 切换置顶状态
router.put('/:photoId/pin', authMiddleware, async (req, res) => {
  const { is_pinned } = req.body
  const existing = await db.execute({
    sql: 'SELECT * FROM photo_layouts WHERE user_id = ? AND photo_id = ?',
    args: [req.userId, req.params.photoId]
  })

  if (existing.rows.length === 0) {
    return res.status(404).json({ error: '布局不存在' })
  }

  await db.execute({
    sql: `UPDATE photo_layouts SET is_pinned = ?, updated_at = datetime('now') WHERE user_id = ? AND photo_id = ?`,
    args: [is_pinned ? 1 : 0, req.userId, req.params.photoId]
  })

  res.json({ success: true, is_pinned: is_pinned ? 1 : 0 })
})

export default router
