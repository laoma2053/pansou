# PanSou Vercel 部署指南

## 🌐 Vercel 前端部署

### 注意事项
- Vercel 主要适用于前端项目部署
- 您的Go后端需要单独部署到云服务器
- 这里提供前端页面的Vercel部署方案

## 📁 准备前端文件

### 1. 创建独立的前端项目结构
```
pansou-frontend/
├── index.html          # 主页
├── demo-improved.html  # 改进版演示页面  
├── demo-desktop.html   # 桌面端预览
├── demo-mobile.html    # 移动端预览
├── style.css          # 样式文件
├── script.js          # JavaScript文件
├── favicon.ico        # 网站图标
└── vercel.json        # Vercel配置文件
```

### 2. 修改API端点

需要将前端的API调用指向您的云服务器后端：

**修改 script.js 中的API地址：**
```javascript
// 将本地API地址改为云服务器地址
const API_BASE_URL = 'https://your-server-domain.com/api';
// 或者使用IP地址
// const API_BASE_URL = 'http://your-server-ip:8080/api';
```

## 🚀 部署步骤

### 方法1: GitHub + Vercel 自动部署

1. **创建GitHub仓库**
```bash
# 创建前端专用目录
mkdir pansou-frontend
cd pansou-frontend

# 复制前端文件
cp ../web/* .

# 初始化Git仓库
git init
git add .
git commit -m "Initial frontend commit"

# 关联GitHub仓库
git remote add origin https://github.com/您的用户名/pansou-frontend.git
git push -u origin main
```

2. **Vercel 部署**
- 访问 [vercel.com](https://vercel.com)
- 使用GitHub账号登录
- 点击 "New Project"
- 选择您的 `pansou-frontend` 仓库
- 点击 "Deploy"

### 方法2: Vercel CLI 部署

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录并部署**
```bash
cd pansou-frontend
vercel login
vercel --prod
```

## ⚙️ Vercel配置文件

创建 `vercel.json` 配置文件：

```json
{
  "version": 2,
  "name": "pansou-frontend",
  "builds": [
    {
      "src": "*.html",
      "use": "@vercel/static"
    },
    {
      "src": "*.css",
      "use": "@vercel/static"
    },
    {
      "src": "*.js",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/index.html"
    },
    {
      "src": "/demo",
      "dest": "/demo-improved.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

## 🔗 完整部署架构

### 推荐架构：
```
用户访问
    ↓
Vercel (前端静态页面)
    ↓ API调用
云服务器 (Go后端 + Docker)
    ↓
各种搜索插件
```

### 域名配置：
- 前端：`https://pansou.vercel.app` (Vercel自动域名)
- 后端：`https://api.your-domain.com` (您的云服务器)

## 📝 部署后配置

### 1. 更新前端API配置
```javascript
// script.js 中修改
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

### 2. 后端CORS配置
确保Go后端支持跨域请求：
```go
// 在您的Go项目中添加CORS中间件
router.Use(func(c *gin.Context) {
    c.Header("Access-Control-Allow-Origin", "https://pansou.vercel.app")
    c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    
    if c.Request.Method == "OPTIONS" {
        c.AbortWithStatus(204)
        return
    }
    
    c.Next()
})
```

## 🎯 部署检查清单

- [ ] 云服务器Go后端部署完成
- [ ] 前端文件准备完成
- [ ] API地址配置正确
- [ ] CORS跨域配置完成
- [ ] Vercel项目部署成功
- [ ] 域名解析配置（如有）
- [ ] HTTPS证书配置
- [ ] 测试所有功能正常

## 💡 优化建议

1. **CDN加速**：Vercel自带CDN，前端访问会很快
2. **缓存策略**：合理设置静态资源缓存
3. **压缩优化**：启用Gzip压缩
4. **监控告警**：设置Vercel和云服务器监控

这样您就有了一个完整的前后端分离部署方案！
