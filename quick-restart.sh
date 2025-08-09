#!/bin/bash

# PanSou 快速重启脚本 (Linux/Ubuntu)
# 使用方法: ./quick-restart.sh

set -e

echo "==============================================="
echo "        PanSou 快速重启脚本 (Ubuntu)"
echo "==============================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[1/5]${NC} 停止现有服务..."
docker compose -f docker-compose-nginx.yml down
echo -e "${GREEN}✅ 服务已停止${NC}"

echo -e "${BLUE}[2/5]${NC} 强制刷新 Docker 缓存..."
docker system prune -f --volumes > /dev/null 2>&1 || true
echo -e "${GREEN}✅ 缓存已清理${NC}"

echo -e "${BLUE}[3/5]${NC} 重建并启动服务..."
docker compose -f docker-compose-nginx.yml up -d --force-recreate
echo -e "${GREEN}✅ 服务已启动${NC}"

echo -e "${BLUE}[4/5]${NC} 等待服务启动..."
sleep 10
echo -e "${GREEN}✅ 等待完成${NC}"

echo -e "${BLUE}[5/5]${NC} 检查服务状态..."
docker compose -f docker-compose-nginx.yml ps

echo ""
echo "==============================================="
echo -e "${GREEN}       重启完成！可以访问新的页面了${NC}"
echo "==============================================="
echo -e "${YELLOW}访问地址: http://your-server-ip:8887${NC}"
echo -e "${YELLOW}健康检查: http://your-server-ip:8887/api/health${NC}"
echo ""
