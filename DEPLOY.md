# Gamilist Deployment Guide

本指南将帮助你将 Gamilist 项目部署到 Render。

## 📋 准备工作

在开始部署前，确保你有：

1. ✅ [Render](https://render.com) 账号（可以用 GitHub 登录）
2. ✅ Twitch Developer 账号（用于 IGDB API）
3. ✅ GitHub OAuth App（可选，用于 GitHub 登录）
4. ✅ 本地项目代码已推送到 GitHub

---

## 🗄️ 步骤 1: 部署 PostgreSQL 数据库

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 点击 **"New +"** → 选择 **"PostgreSQL"**
3. 配置数据库：
   - **Name**: `gamilist-db`（或你喜欢的名字）
   - **Database**: `gamilist`
   - **User**: `gamilist_user`
   - **Region**: 选择离你最近的区域
   - **PostgreSQL Version**: 选择最新版本
   - **Plan**: 选择 **Free**
4. 点击 **"Create Database"**
5. ⏳ 等待数据库创建完成（约 1-2 分钟）
6. 📝 **重要**: 复制 **Internal Database URL**（后面会用到）
   - 格式类似: `postgresql://user:password@host/database`

---

## 🚀 步骤 2: 部署后端（Express API）

### 2.1 创建 Web Service

1. 在 Render Dashboard，点击 **"New +"** → 选择 **"Web Service"**
2. 连接你的 GitHub 仓库
3. 配置 Web Service：
   - **Name**: `gamilist-api`
   - **Region**: 与数据库相同的区域
   - **Branch**: `main` 或 `DJ`（选择你要部署的分支）
   - **Root Directory**: `gamilist_code`
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: 选择 **Free**

### 2.2 配置环境变量

在 **Environment** 部分，添加以下环境变量：

```
DATABASE_URL=<你在步骤1复制的 Internal Database URL>
TWITCH_CLIENT_ID=<你的 Twitch Client ID>
TWITCH_CLIENT_SECRET=<你的 Twitch Client Secret>
SESSION_SECRET=<随机生成的密钥，例如：your_super_secret_session_key_12345>
NODE_VERSION=20.11.0
```

#### 可选：如果使用 GitHub OAuth

```
GITHUB_CLIENT_ID=<你的 GitHub OAuth Client ID>
GITHUB_CLIENT_SECRET=<你的 GitHub OAuth Client Secret>
GITHUB_CALLBACK_URL=https://gamilist-api.onrender.com/api/auth/github/callback
```

**注意**: 将 `gamilist-api` 替换成你实际的 Render 服务名称！

### 2.3 部署

4. 点击 **"Create Web Service"**
5. ⏳ Render 会自动开始构建和部署（约 5-10 分钟）
6. 等待显示 **"Live"** 状态
7. 📝 复制你的后端 URL（例如：`https://gamilist-api.onrender.com`）

### 2.4 初始化数据库

部署完成后，访问以下 URL 来初始化数据库：

```
https://gamilist-api.onrender.com/api/reset
```

你应该看到：`{"ok":true,"message":"Database reset & seeded."}`

---

## 🎨 步骤 3: 部署前端（React/Vite）

### 3.1 更新前端配置

在本地项目中，更新前端的 API URL：

1. 打开 `gamilist_code/src/database/api.js`
2. 修改第一行：
   ```javascript
   const API = import.meta.env.VITE_API_URL || 'https://gamilist-api.onrender.com';
   ```
   **注意**: 将 URL 替换成你的后端 URL！

3. 提交并推送更改：
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

### 3.2 创建前端 Web Service

1. 在 Render Dashboard，再次点击 **"New +"** → 选择 **"Web Service"**
2. 选择同一个 GitHub 仓库
3. 配置：
   - **Name**: `gamilist-frontend`
   - **Region**: 与后端相同
   - **Branch**: `main` 或 `DJ`
   - **Root Directory**: `gamilist_code`
   - **Runtime**: **Node**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**

### 3.3 配置环境变量

```
VITE_API_URL=<你的后端 URL，例如：https://gamilist-api.onrender.com>
NODE_VERSION=20.11.0
```

### 3.4 部署

4. 点击 **"Create Web Service"**
5. ⏳ 等待构建完成（约 5-10 分钟）
6. 🎉 部署完成！

---

## 🔧 步骤 4: 配置 GitHub OAuth（如果使用）

如果你的应用使用 GitHub OAuth 登录：

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 找到你的 OAuth App
3. 更新 **Authorization callback URL** 为：
   ```
   https://gamilist-api.onrender.com/api/auth/github/callback
   ```
   **注意**: 使用你的实际后端 URL！

---

## ✅ 步骤 5: 测试部署

访问你的前端 URL（例如：`https://gamilist-frontend.onrender.com`）

测试以下功能：
- ✅ 首页能正常显示游戏
- ✅ 可以登录/注册
- ✅ 可以添加游戏到列表
- ✅ 可以写评论
- ✅ 可以查看推荐
- ✅ 可以发布论坛帖子
- ✅ 可以解锁成就

---

## 🐛 常见问题

### 问题 1: 数据库连接失败

**解决方法**:
- 确认 `DATABASE_URL` 使用的是 **Internal Database URL**（不是 External）
- 检查数据库和后端是否在同一个 region

### 问题 2: 前端无法连接后端

**解决方法**:
- 检查 `VITE_API_URL` 环境变量是否设置正确
- 确认后端 URL 使用 `https://`（不是 `http://`）
- 检查后端是否处于 "Live" 状态

### 问题 3: GitHub OAuth 登录失败

**解决方法**:
- 检查 GitHub OAuth App 的 callback URL 是否正确
- 确认 `GITHUB_CALLBACK_URL` 环境变量使用了正确的后端 URL

### 问题 4: IGDB API 错误

**解决方法**:
- 检查 `TWITCH_CLIENT_ID` 和 `TWITCH_CLIENT_SECRET` 是否正确
- 访问 [Twitch Developer Console](https://dev.twitch.tv/console) 确认你的 app 状态

### 问题 5: Free plan 服务休眠

**注意**: Render 的 Free plan 会在 15 分钟不活动后让服务休眠。第一次访问可能需要等待 30-60 秒启动。

---

## 🔄 更新部署

当你更新代码后：

1. 推送到 GitHub：
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Render 会**自动检测更改并重新部署**

或者手动触发：
- 访问 Render Dashboard
- 选择你的服务
- 点击 **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📝 更新 README

部署完成后，记得更新 `README.md` 中的部署链接：

```markdown
🔗 Link to deployed app: https://gamilist-frontend.onrender.com
```

---

## 🎉 完成！

恭喜！你的 Gamilist 应用已经成功部署到 Render！

如果遇到问题，可以查看 Render 的 Logs：
- Dashboard → 选择服务 → **Logs** 标签

---

## 📚 有用的链接

- [Render Documentation](https://render.com/docs)
- [Render Free Plan Limits](https://render.com/docs/free)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Express on Render](https://render.com/docs/deploy-node-express-app)

