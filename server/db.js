import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
})

// 初始化数据库 schema
async function initDB() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT DEFAULT '',
      lat REAL DEFAULT 0,
      lng REAL DEFAULT 0,
      people TEXT DEFAULT '',
      story TEXT DEFAULT '',
      archived INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS photo_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      photo_id INTEGER NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      rotate REAL DEFAULT 0,
      z_index INTEGER DEFAULT 1,
      scale REAL DEFAULT 1,
      is_pinned INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, photo_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    )`,
  ])
}

export { db, initDB }
