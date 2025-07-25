#!/bin/bash

# PanSou UI和搜索问题修复脚本
echo "🛠️  PanSou 全面修复脚本"
echo "===================="
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

# 1. 确保使用正确的UI文件
log_info "修复UI文件..."

# 检查并使用demo-improved.html作为主页
if [ -f "web/demo-improved.html" ]; then
    log_info "使用优化版本的UI文件..."
    cp web/demo-improved.html web/index.html
    log_success "已将demo-improved.html设置为主页"
else
    log_warning "demo-improved.html 不存在，检查其他优化文件..."
    if [ -f "web/demo-desktop.html" ]; then
        cp web/demo-desktop.html web/index.html
        log_info "使用demo-desktop.html作为主页"
    fi
fi

# 2. 修复JavaScript API配置
log_info "修复前端API配置..."

# 备份原文件
cp web/script.js web/script.js.backup 2>/dev/null

# 确保API调用使用正确的相对路径
sed -i 's|http://localhost:8888/api|/api|g' web/script.js
sed -i 's|http://127.0.0.1:8888/api|/api|g' web/script.js
sed -i 's|http://.*:8888/api|/api|g' web/script.js

log_success "已更新JavaScript API地址为相对路径"

# 3. 重启容器以应用更改
log_info "重启容器应用更改..."
docker-compose restart

# 等待服务启动
log_info "等待服务重新启动..."
sleep 15

# 4. 验证修复
log_info "验证修复结果..."

# 检查前端页面
if curl -s http://localhost:8888/ | grep -q "search-header"; then
    log_success "✅ UI界面已修复 - 发现优化版本结构"
else
    log_warning "⚠️  UI可能还有问题，继续检查..."
fi

# 检查API连接
if curl -s http://localhost:8888/api/health >/dev/null 2>&1; then
    log_success "✅ API连接正常"
else
    log_error "❌ API连接失败"
    
    # 尝试修复API问题
    log_info "尝试修复API问题..."
    
    # 检查后端容器
    if ! docker ps | grep -q pansou-api; then
        log_warning "后端API容器未运行，重启..."
        docker-compose up -d pansou-api
        sleep 10
    fi
    
    # 再次测试
    if curl -s http://localhost:8888/api/health >/dev/null 2>&1; then
        log_success "✅ API修复成功"
    else
        log_error "❌ API仍然有问题，需要深度诊断"
    fi
fi

# 5. 测试搜索功能
log_info "测试搜索功能..."
search_result=$(curl -s "http://localhost:8888/api/search?keyword=test" 2>/dev/null)
if [ -n "$search_result" ] && ! echo "$search_result" | grep -q "404\|error\|Error"; then
    log_success "✅ 搜索功能正常"
else
    log_error "❌ 搜索功能异常"
    echo "搜索响应: $search_result"
fi

# 6. 显示修复结果
echo
echo "🎯 修复完成！请重新访问："
echo "   http://您的服务器IP:8888/"
echo
echo "📋 如果还有问题，请运行诊断："
echo "   ./debug-issues.sh"
echo
echo "🔧 手动检查命令："
echo "   docker-compose ps                    # 检查容器状态"
echo "   docker-compose logs -f pansou-web    # 查看前端日志"
echo "   docker-compose logs -f pansou-api    # 查看后端日志"
echo
