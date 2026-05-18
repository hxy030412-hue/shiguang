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
  const userId = result.lastInsertRowid

  // 为新用户填充示例照片
  const demoPhotos = [
    ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', '阿尔卑斯山的日出', '2024年7月15日', '瑞士·少女峰', 46.5587, 7.9960, '小明、小红', '凌晨四点出发，徒步两个小时到达观景台。当第一缕阳光穿透云层照在雪峰上时，所有的疲惫都值了。'],
    ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', '马尔代夫的星空海滩', '2024年1月20日', '马尔代夫·马累', 4.1755, 73.5093, '独自一人', '赤脚走在荧光海滩上，抬头是满天繁星，低头是发光的浮游生物。'],
    ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600', '京都的秋日红叶', '2024年11月8日', '日本·京都·清水寺', 34.9949, 135.7850, '家人', '和爸妈一起赏枫，妈妈一直在拍照，爸爸假装嫌弃但笑得最开心。'],
    ['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600', '迪拜的沙漠黄昏', '2024年3月5日', '阿联酋·迪拜', 25.2048, 55.2708, '同事们', '公司团建去沙漠冲沙，车子在沙丘上飞驰的时候所有人都在尖叫。'],
    ['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600', '新西兰的蒂卡波湖', '2024年2月14日', '新西兰·蒂卡波', -44.0047, 170.4769, '女朋友', '情人节的特别旅行，湖水蓝得不像话。晚上去天文台看银河。'],
    ['https://images.unsplash.com/photo-1528164344705-47542687000d?w=600', '圣托里尼的白房子', '2024年9月12日', '希腊·圣托里尼', 36.3932, 25.4615, '大学室友', '毕业旅行的最后一站，四个大男生在蓝顶教堂前合影，约定十年后再来。'],
    ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600', '冰岛的极光之夜', '2024年12月3日', '冰岛·雷克雅未克', 64.1466, -21.9426, '摄影团的朋友们', '等了三个小时，手都冻僵了。当绿色的光带开始在天空舞动的时候，所有人都安静了。'],
    ['https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600', '托斯卡纳的田园风光', '2024年5月18日', '意大利·佛罗伦萨', 43.7696, 11.2558, '和爸妈', '自驾穿越托斯卡纳，路两边是金色的麦田和丝柏树。'],
    ['https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=600', '摩洛哥的蓝色小镇', '2024年4月22日', '摩洛哥·舍夫沙万', 35.1714, -5.2697, '旅途中认识的朋友', '迷路在蓝色的小巷里，遇到了一只懒洋洋的猫。当地老人请我们喝薄荷茶。'],
    ['https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600', '挪威的峡湾', '2024年8月9日', '挪威·卑尔根', 60.3913, 5.3221, '独自一人', '一个人坐邮轮穿越峡湾，两岸是陡峭的山壁和瀑布。'],
    ['https://images.unsplash.com/photo-1502301103665-0b95cc738daf?w=600', '土耳其的热气球', '2024年6月1日', '土耳其·卡帕多奇亚', 38.6431, 34.8293, '女朋友', '清晨五点坐上热气球，看着上百个热气球同时升空。'],
    ['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600', '云南的梯田日落', '2024年10月15日', '中国·云南·元阳', 23.0843, 102.8440, '摄影俱乐部', '为了拍到最好的光线，在田埂上蹲了两个小时。梯田在夕阳下像一面面镜子。']
  ]
  const insert = db.prepare('INSERT INTO photos (user_id, url, title, date, location, lat, lng, people, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertMany = db.transaction((photos) => {
    for (const p of photos) insert.run(userId, ...p)
  })
  insertMany(demoPhotos)

  const token = jwt.sign({ id: userId }, SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: userId, username, nickname: username } })
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
