#!/bin/bash

# PanSou 正确部署脚本 v2.0
# 解决端口配置混乱问题

echo "🚀 PanSou 正确部署脚本 v2.0"
echo "=========================="
echo "⚠️  重要：统一使用8888端口，不是8080！"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. 环境检查
log_info "检查环境..."
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose 未安装"
    exit 1
fi

# 2. 检查项目目录
if [ ! -f "go.mod" ] || [ ! -d "web" ]; then
    log_error "请在PanSou项目根目录运行此脚本"
    exit 1
fi

if [ ! -f "web/index.html" ]; then
    log_error "web/index.html 不存在"
    exit 1
fi

log_success "环境检查通过"

# 3. 清理旧配置
log_info "清理旧的配置和容器..."
docker-compose down 2>/dev/null || true
docker stop pansou 2>/dev/null || true
docker rm pansou 2>/dev/null || true

# 4. 选择部署方案
echo
log_info "选择部署方案:"
echo "1) 使用原作者镜像 + 挂载您的UI（推荐，快速）"
echo "2) 构建自定义镜像（包含您的UI，较慢）"
read -p "请选择 (1-2, 默认: 1): " DEPLOY_METHOD
DEPLOY_METHOD=${DEPLOY_METHOD:-1}

# 5. 创建配置文件
log_info "创建配置文件..."

if [ "$DEPLOY_METHOD" = "1" ]; then
    log_info "使用原作者镜像方案..."
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  pansou:
    image: ghcr.io/fish2018/pansou:latest
    container_name: pansou
    restart: unless-stopped
    ports:
      - "8888:8888"
    environment:
      - PORT=8888
      - CHANNELS=tgsearchers2,SharePanBaidu,yunpanxunlei,tianyifc,BaiduCloudDisk
      - CACHE_ENABLED=true
      - CACHE_PATH=/app/cache
      - CACHE_MAX_SIZE=100
      - CACHE_TTL=60
      - ASYNC_PLUGIN_ENABLED=true
      - ASYNC_RESPONSE_TIMEOUT=4
      - ASYNC_MAX_BACKGROUND_WORKERS=20
      - ASYNC_MAX_BACKGROUND_TASKS=100
      - ASYNC_CACHE_TTL_HOURS=1
    volumes:
      - pansou-cache:/app/cache
      - ./web:/app/web:ro
    networks:
      - pansou-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8888"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  pansou-cache:
    driver: local

networks:
  pansou-network:
    driver: bridge
EOF

else
    log_info "使用自定义镜像方案..."
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  pansou:
    build: .
    container_name: pansou
    restart: unless-stopped
    ports:
      - "8888:8888"
    environment:
      - PORT=8888
      - CHANNELS=tgsearchers2,SharePanBaidu,yunpanxunlei,tianyifc,BaiduCloudDisk
      - CACHE_ENABLED=true
      - CACHE_PATH=/app/cache
      - CACHE_MAX_SIZE=100
      - CACHE_TTL=60
      - ASYNC_PLUGIN_ENABLED=true
      - ASYNC_RESPONSE_TIMEOUT=4
      - ASYNC_MAX_BACKGROUND_WORKERS=20
      - ASYNC_MAX_BACKGROUND_TASKS=100
      - ASYNC_CACHE_TTL_HOURS=1
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
fi

# 6. 修复文件权限
log_info "修复文件权限..."
chmod -R 755 ./web/
chown -R $USER:$USER ./web/ 2>/dev/null || true

# 7. 部署服务
if [ "$DEPLOY_METHOD" = "1" ]; then
    log_info "拉取最新镜像..."
    docker-compose pull
else
    log_info "构建自定义镜像..."
    docker-compose build
fi

log_info "启动服务..."
docker-compose up -d

# 8. 等待启动
log_info "等待服务启动..."
sleep 30

# 9. 验证部署
log_info "验证部署状态..."

# 检查容器状态
if ! docker ps | grep -q pansou; then
    log_error "容器启动失败"
    log_info "查看错误日志:"
    docker-compose logs
    exit 1
fi

log_success "容器启动成功"

# 检查文件挂载（仅方案1）
if [ "$DEPLOY_METHOD" = "1" ]; then
    log_info "检查文件挂载..."
    if docker exec pansou ls /app/web/index.html > /dev/null 2>&1; then
        log_success "UI文件挂载成功"
    else
        log_warning "UI文件挂载可能有问题"
        docker exec pansou ls -la /app/web/ 2>/dev/null || log_error "无法访问容器内web目录"
    fi
fi

# 测试服务
log_info "测试服务连接..."
sleep 10

# 测试API
if curl -s http://localhost:8888/api/health > /dev/null 2>&1; then
    log_success "API服务正常"
elif curl -s http://localhost:8888/ > /dev/null 2>&1; then
    log_success "Web服务正常"
else
    log_warning "服务可能还在启动中，请稍后测试"
fi

# 测试前端页面
log_info "测试前端页面..."
if curl -s http://localhost:8888/ | grep -q "PanSou" > /dev/null 2>&1; then
    log_success "前端页面正常，发现PanSou内容"
else
    log_warning "前端页面可能还在加载，请手动测试"
fi

# 10. 配置防火墙提醒
log_info "检查防火墙配置..."
if command -v ufw &> /dev/null; then
    if ! ufw status | grep -q "8888"; then
        log_warning "防火墙可能未开放8888端口"
        echo "建议执行: sudo ufw allow 8888/tcp"
    fi
fi

# 11. 显示结果
echo
echo "=================================="
log_success "🎉 部署完成！"
echo "=================================="
echo
log_info "访问信息:"
log_info "  本地访问: http://localhost:8888/"
log_info "  服务器访问: http://$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP"):8888/"
log_info "  API接口: http://localhost:8888/api/search"
echo
log_info "管理命令:"
log_info "  查看日志: docker-compose logs -f"
log_info "  重启服务: docker-compose restart"
log_info "  停止服务: docker-compose down"
log_info "  查看状态: docker ps | grep pansou"
echo
log_warning "重要提醒: 使用8888端口访问，不是8080！"
echo
