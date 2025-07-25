# 🚀 PanSou 1Panel集成部署方案

## 📋 利用现有1Panel + OpenResty环境

由于您已经有1Panel面板和OpenResty，我们可以更优雅地集成：

### 🎯 方案A：Docker独立部署（推荐）
- 使用独立的Docker Nginx容器
- 端口8888，不与现有服务冲突
- 完全隔离，易于管理

### 🎯 方案B：1Panel集成部署
- 利用现有OpenResty
- 只部署后端API容器
- 通过1Panel管理静态站点

## 🚀 方案A：Docker独立部署

### 优势：
- ✅ 不影响现有1Panel配置
- ✅ 完全隔离的环境
- ✅ 一键部署和卸载
- ✅ 端口分离（8888 vs 80/443）

### 部署步骤：
```bash
# 直接运行终极方案即可
chmod +x deploy-ultimate.sh
./deploy-ultimate.sh
```

访问地址：`http://您的服务器IP:8888`

## 🚀 方案B：1Panel集成部署

### 步骤1：只部署PanSou API
```bash
cat > docker-compose-api-only.yml << 'EOF'
version: '3.8'

services:
  pansou-api:
    image: ghcr.io/fish2018/pansou:latest
    container_name: pansou-api
    restart: unless-stopped
    ports:
      - "8889:8888"
    environment:
      - PORT=8888
      - CHANNELS=tgsearchers2,SharePanBaidu,yunpanxunlei,tianyifc,BaiduCloudDisk
      - CACHE_ENABLED=true
      - CACHE_PATH=/app/cache
      - CACHE_MAX_SIZE=100
      - CACHE_TTL=60
    volumes:
      - pansou-cache:/app/cache
    networks:
      - pansou-network

volumes:
  pansou-cache:
    driver: local

networks:
  pansou-network:
    driver: bridge
EOF

# 启动API服务
docker-compose -f docker-compose-api-only.yml up -d
```

### 步骤2：在1Panel中创建网站
1. 登录1Panel面板
2. 网站 → 创建网站
3. 选择"静态网站"
4. 域名：您的域名或IP
5. 网站目录：选择一个目录（如 `/opt/pansou-web`）

### 步骤3：上传您的前端文件
```bash
# 复制前端文件到1Panel网站目录
sudo cp -r ./web/* /opt/pansou-web/

# 修改API地址
sudo sed -i 's|http://localhost:8888/api|/api|g' /opt/pansou-web/script.js
```

### 步骤4：配置OpenResty反向代理
在1Panel中为您的网站添加反向代理配置：

```nginx
# API代理配置
location /api/ {
    proxy_pass http://localhost:8889;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS设置
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
}
```

## 🎯 推荐选择

**我建议选择方案A（Docker独立部署）**，原因：

1. **简单快速** - 一键部署，5分钟搞定
2. **不影响现有环境** - 与1Panel完全隔离
3. **易于维护** - 独立的容器环境
4. **易于卸载** - 一键清理，不留痕迹

## 🚀 立即开始

```bash
# 推荐：直接运行Docker方案
./deploy-ultimate.sh

# 访问地址
http://您的服务器IP:8888
```

如果您想要集成到1Panel中，可以后续再迁移。现在先用Docker方案快速验证功能！
