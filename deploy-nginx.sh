#!/bin/bash

# PanSou Nginx版本部署脚本
# 使用方法: ./deploy-nginx.sh

set -e

echo "🚀 开始部署 PanSou (Nginx版本)..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/home/panso"  # 请修改为你的实际路径
COMPOSE_FILE="docker-compose-nginx.yml"

# 检查文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ 错误: $COMPOSE_FILE 文件不存在${NC}"
    exit 1
fi

echo "📁 项目目录: $PROJECT_DIR"
echo "📄 配置文件: $COMPOSE_FILE"

# 步骤1: 停止现有服务
echo -e "${YELLOW}📦 停止现有服务...${NC}"
if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}✅ 现有服务已停止${NC}"
else
    echo -e "${YELLOW}ℹ️  没有运行中的服务${NC}"
fi

# 步骤2: 拉取最新镜像
echo -e "${YELLOW}🔄 拉取最新镜像...${NC}"
docker pull fish2018/pansou:latest
docker pull nginx:alpine
echo -e "${GREEN}✅ 镜像拉取完成${NC}"

# 步骤3: 清理悬挂镜像
echo -e "${YELLOW}🧹 清理悬挂镜像...${NC}"
docker image prune -f || true
echo -e "${GREEN}✅ 清理完成${NC}"

# 步骤4: 启动新服务
echo -e "${YELLOW}🚀 启动新服务...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 步骤5: 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
docker-compose -f $COMPOSE_FILE ps

# 步骤6: 健康检查
echo -e "${YELLOW}🩺 执行健康检查...${NC}"

# 检查API服务
echo "检查API服务 (端口8888)..."
if curl -s http://localhost:8888/api/health > /dev/null; then
    echo -e "${GREEN}✅ API服务正常 (http://localhost:8888)${NC}"
else
    echo -e "${RED}❌ API服务异常${NC}"
fi

# 检查Nginx代理服务
echo "检查Nginx代理服务 (端口8887)..."
if curl -s http://localhost:8887/api/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx代理服务正常 (http://localhost:8887)${NC}"
else
    echo -e "${RED}❌ Nginx代理服务异常${NC}"
fi

# 显示服务信息
echo -e "\n${GREEN}🎉 部署完成！${NC}"
echo -e "${YELLOW}📋 服务信息:${NC}"
echo "  🔗 API服务直接访问:  http://localhost:8888"
echo "  🔗 Web界面(推荐):    http://localhost:8887"
echo "  🔗 健康检查:         http://localhost:8887/api/health"
echo "  📊 查看日志:         docker-compose -f $COMPOSE_FILE logs -f"
echo "  🔧 重启服务:         docker-compose -f $COMPOSE_FILE restart"
echo "  🛑 停止服务:         docker-compose -f $COMPOSE_FILE down"

echo -e "\n${YELLOW}💡 提示:${NC}"
echo "  - 推荐使用 http://localhost:8887 访问，享受完整的Web界面"
echo "  - API端点: http://localhost:8887/api/search?kw=关键词"
echo "  - 如有问题，请查看日志: docker-compose -f $COMPOSE_FILE logs"
