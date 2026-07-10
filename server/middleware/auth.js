import jwt from 'jsonwebtoken'

export const SECRET = process.env.JWT_SECRET || 'travel-diary-secret-key'

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    const decoded = jwt.verify(token, SECRET)
    req.userId = decoded.id
    next()
  } catch {
    res.status(401).json({ error: '登录已过期' })
  }
}
