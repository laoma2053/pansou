#!/bin/bash

# PanSou 终极解决方案
# 使用Nginx + 后端API的完整架构

echo "🔧 PanSou 终极解决方案"
echo "====================="
echo "架构：Nginx(前端) + PanSou API(后端)"
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
if [ ! -f "go.mod" ] || [ ! -d "web" ]; then
    log_error "请在PanSou项目根目录运行此脚本"
    exit 1
fi

if [ ! -f "web/index.html" ]; then
    log_error "web/index.html 不存在"
    exit 1
fi

# 2. 先运行深度诊断（可选）
read -p "是否先运行深度诊断了解问题原因？(y/N): " RUN_DIAG
if [[ $RUN_DIAG =~ ^[Yy]$ ]]; then
    log_info "运行深度诊断..."
    chmod +x deep-diagnose.sh
    ./deep-diagnose.sh
    echo
    read -p "按回车键继续部署..." 
fi

# 3. 清理环境
log_info "清理旧的部署..."
docker-compose down 2>/dev/null || true
docker stop pansou pansou-api pansou-web 2>/dev/null || true
docker rm pansou pansou-api pansou-web 2>/dev/null || true

# 4. 检查nginx配置目录
if [ ! -d "nginx" ]; then
    log_error "nginx配置目录不存在，请确保所有文件都已创建"
    exit 1
fi

# 5. 修复文件权限
log_info "修复文件权限..."
chmod -R 755 ./web/
chmod -R 644 ./nginx/
chown -R $USER:$USER ./web/ ./nginx/ 2>/dev/null || true

# 6. 修改前端API地址为相对路径
log_info "配置前端API地址..."
# 备份原文件
cp web/script.js web/script.js.backup 2>/dev/null || true

# 确保API调用使用相对路径
if grep -q "localhost:8888" web/script.js; then
    sed -i 's|http://localhost:8888/api|/api|g' web/script.js
    log_success "已更新API地址为相对路径"
fi

# 7. 使用Nginx方案部署
log_info "使用Nginx + 后端API方案部署..."
cp docker-compose-nginx.yml docker-compose.yml

# 8. 启动服务
log_info "启动服务..."
docker-compose pull
docker-compose up -d

# 9. 等待服务启动
log_info "等待服务启动..."
sleep 20

# 10. 检查服务状态
log_info "检查服务状态..."

# 检查容器状态
if docker ps | grep -q pansou-web && docker ps | grep -q pansou-api; then
    log_success "所有容器启动成功"
else
    log_error "部分容器启动失败"
    docker-compose ps
    exit 1
fi

# 11. 验证部署
log_info "验证部署..."

# 测试Nginx
sleep 5
if curl -s http://localhost:8888/health | grep -q "healthy"; then
    log_success "Nginx健康检查通过"
else
    log_warning "Nginx健康检查失败"
fi

# 测试前端页面
if curl -s http://localhost:8888/ | grep -q "PanSou"; then
    log_success "前端页面正常"
else
    log_warning "前端页面可能有问题"
    echo "前端页面响应："
    curl -s http://localhost:8888/ | head -5
fi

# 测试API代理
if curl -s http://localhost:8888/api/health >/dev/null 2>&1; then
    log_success "API代理正常"
else
    log_warning "API代理可能有问题"
    echo "API响应："
    curl -I http://localhost:8888/api/health 2>/dev/null || echo "无响应"
fi

# 12. 显示架构信息
echo
echo "🏗️  部署架构："
echo "  用户请求 → Nginx(8888端口) → 静态文件 或 API代理 → PanSou后端(8889端口)"
echo

# 13. 配置防火墙提醒
log_info "防火墙配置提醒..."
if command -v ufw &> /dev/null; then
    if ! ufw status | grep -q "8888"; then
        log_warning "需要开放8888端口"
        echo "执行: sudo ufw allow 8888/tcp"
    fi
fi

# 14. 显示结果
echo
echo "=================================="
log_success "🎉 终极方案部署完成！"
echo "=================================="
echo
log_info "访问信息:"
log_info "  主页: http://localhost:8888/"
log_info "  主页: http://$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP"):8888/"
log_info "  API: http://localhost:8888/api/search"
log_info "  健康检查: http://localhost:8888/health"
echo
log_info "架构组件:"
log_info "  前端服务: Nginx (端口8888)"
log_info "  后端API: PanSou (内部端口8889)"
echo
log_info "管理命令:"
log_info "  查看所有日志: docker-compose logs -f"
log_info "  查看前端日志: docker-compose logs -f pansou-web"
log_info "  查看后端日志: docker-compose logs -f pansou-api"
log_info "  重启服务: docker-compose restart"
log_info "  停止服务: docker-compose down"
echo
log_info "文件位置:"
log_info "  前端文件: ./web/"
log_info "  Nginx配置: ./nginx/"
log_info "  Docker配置: docker-compose.yml"
echo
if [ -f "web/script.js.backup" ]; then
    log_warning "已备份原始script.js为script.js.backup"
fi
echo
log_success "现在访问 http://您的服务器IP:8888/ 应该可以看到您的UI界面了！"
