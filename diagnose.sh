#!/bin/bash

# PanSou 问题诊断脚本
echo "🔍 PanSou 404问题诊断"
echo "===================="
echo

# 1. 检查docker-compose配置
echo "📋 1. 检查docker-compose配置"
echo "当前使用的配置文件："
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml 存在"
    echo "端口配置："
    grep -A 2 -B 2 "ports:" docker-compose.yml
    echo "挂载配置："
    grep -A 5 -B 2 "volumes:" docker-compose.yml
else
    echo "❌ docker-compose.yml 不存在"
fi
echo

# 2. 检查web目录
echo "📁 2. 检查本地web目录"
if [ -d "./web" ]; then
    echo "✅ web目录存在"
    echo "web目录内容："
    ls -la ./web/
    echo "检查关键文件："
    [ -f "./web/index.html" ] && echo "✅ index.html 存在" || echo "❌ index.html 不存在"
    [ -f "./web/style.css" ] && echo "✅ style.css 存在" || echo "❌ style.css 不存在"
    [ -f "./web/script.js" ] && echo "✅ script.js 存在" || echo "❌ script.js 不存在"
else
    echo "❌ web目录不存在"
fi
echo

# 3. 检查容器状态
echo "🐳 3. 检查Docker容器状态"
echo "运行中的容器："
docker ps --filter "name=pansou"
echo
if docker ps | grep -q pansou; then
    echo "容器详细信息："
    docker inspect pansou | jq '.[] | {Name: .Name, State: .State.Status, Mounts: .Mounts}' 2>/dev/null || \
    docker inspect pansou | grep -A 20 '"Mounts"'
    echo
    
    echo "容器内web目录："
    docker exec pansou ls -la /app/web/ 2>/dev/null || echo "❌ 无法访问容器内/app/web"
    echo
    
    echo "容器内根目录："
    docker exec pansou ls -la /app/ 2>/dev/null || echo "❌ 无法访问容器内/app"
    echo
else
    echo "❌ 容器未运行"
fi

# 4. 测试网络连接
echo "🌐 4. 测试网络连接"
echo "测试API健康检查："
curl -v http://localhost:8888/api/health 2>&1 | head -10
echo
echo "测试首页："
curl -v http://localhost:8888/ 2>&1 | head -10
echo

# 5. 检查日志
echo "📝 5. 检查容器日志"
echo "最新日志："
docker-compose logs --tail=20 pansou 2>/dev/null || docker logs pansou --tail=20 2>/dev/null
echo

# 6. 建议解决方案
echo "💡 6. 问题分析和建议"
echo "===================="

# 检查是否是权限问题
if [ -d "./web" ] && [ ! -r "./web/index.html" ]; then
    echo "🔒 可能是文件权限问题"
    echo "建议执行: sudo chown -R $USER:$USER ./web && chmod -R 755 ./web"
fi

# 检查是否是路径问题
if [ ! -d "./web" ]; then
    echo "📁 web目录不存在"
    echo "建议检查是否在正确的项目目录中"
fi

# 检查是否是容器配置问题
if ! docker ps | grep -q pansou; then
    echo "🐳 容器未运行"
    echo "建议重新启动: docker-compose up -d"
fi

echo
echo "🚀 快速修复建议："
echo "1. 确保在项目根目录: cd pansou"
echo "2. 检查web目录权限: ls -la web/"
echo "3. 重新启动容器: docker-compose down && docker-compose up -d"
echo "4. 如果还不行，尝试重建: docker-compose down && docker-compose build && docker-compose up -d"
