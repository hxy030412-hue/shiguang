# 拾光 — 数字回忆馆

> 记录值得被记住的瞬间，让未来的自己回来翻阅。

一个精心设计的全栈照片回忆应用，采用电影感设计语言，让每一张照片都成为珍贵的记忆片段。

## ✨ 特性

### 🎬 电影感设计
- Quiet Luxury 美学 + Apple 极简风格
- 温暖琥珀色调，胶片质感
- 相机对焦环光标，快门反馈动画
- 三层背景氛围系统（暖色光带 + 尘埃粒子 + 胶片纹理）

### 📸 记忆墙
- 响应式散乱布局，真实照片墙体验
- 拖拽排列，布局自动持久化
- 编辑模式 / 浏览模式切换
- 光晕跟随鼠标，营造聚光灯效果

### 🗺️ 人生地图
- Leaflet 地图集成
- 照片地理位置标记
- 发光路线连接回忆轨迹

### ⏳ 时光盒
- 归档系统，整理回忆
- 淡出动画，优雅的交互体验
- 随时恢复珍贵记忆

### 👤 个人空间
- 头像上传（点击/拖拽）
- 用户系统 + JWT 认证
- 个人回忆专属空间

## 🛠️ 技术栈

**前端**
- Vue 3 + Vite
- Vue Router
- Leaflet（地图）
- CSS3 动画 + Canvas

**后端**
- Node.js + Express 5
- better-sqlite3
- JWT 认证
- Multer（文件上传）

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动后端服务（端口 3000）
npm run server

# 启动前端开发（端口 5173）
npm run dev
```

## 📁 项目结构

```
├── src/
│   ├── components/
│   │   ├── HomeView.vue          # 首页 Hero
│   │   ├── ScatterLayout.vue     # 记忆墙
│   │   ├── PhotoModal.vue        # 回忆查看器
│   │   ├── MapView.vue           # 人生地图
│   │   ├── TimeBoxView.vue       # 时光盒
│   │   ├── CustomCursor.vue      # 对焦环光标
│   │   └── InteractiveParticles.vue # 背景氛围
│   ├── App.vue
│   └── main.js
├── server/
│   ├── routes/
│   │   ├── auth.js               # 认证 API
│   │   ├── photos.js             # 照片 API
│   │   └── layouts.js            # 布局 API
│   ├── db.js                     # 数据库
│   └── index.js                  # 服务入口
└── index.html
```

## 💡 设计理念

拾光不是社交媒体，不是相册网站。它是一个**数字回忆馆**——

在这里，照片不是用来分享的，而是用来珍藏的。每一次打开，都是与过去的自己重逢。

---

**设计语言**：Warm beige & amber palette · Cinematic lighting · Film grain texture · Apple-inspired minimalism
