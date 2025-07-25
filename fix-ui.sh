#!/bin/bash

# PanSou UI 修复脚本
# 解决原作者镜像404问题

echo "🔧 PanSou UI 修复脚本"
echo "======================"
echo

# 检查当前是否有运行的容器
if docker ps | grep -q pansou; then
    echo "📦 停止当前运行的容器..."
    docker-compose down
fi

echo "🎯 选择修复方案:"
echo "1) 使用挂载方式（快速，推荐）"
echo "2) 重新构建镜像（包含所有功能）"
read -p "请选择 (1-2, 默认: 1): " CHOICE
CHOICE=${CHOICE:-1}

if [ "$CHOICE" = "1" ]; then
    echo "📁 使用挂载方式修复..."
    
    # 使用挂载版本的配置
    cp docker-compose-volume.yml docker-compose.yml
    
    # 启动服务
    echo "🚀 启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 10
    
else
    echo "🔨 重新构建镜像..."
    
    # 构建新镜像
    echo "📦 构建包含UI的镜像..."
    docker-compose build
    
    # 启动服务
    echo "🚀 启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 15
fi

# 检查服务状态
echo "🔍 检查服务状态..."
if docker ps | grep -q pansou; then
    echo "✅ 容器启动成功！"
    
    # 测试API
    echo "🧪 测试API连接..."
    if curl -s http://localhost:8888/api/health > /dev/null 2>&1; then
        echo "✅ API服务正常"
    else
        echo "⚠️  API服务可能还在启动中"
    fi
    
    # 测试前端
    echo "🌐 测试前端页面..."
    if curl -s http://localhost:8888/ | grep -q "PanSou" > /dev/null 2>&1; then
        echo "✅ 前端页面正常"
    else
        echo "⚠️  前端页面可能还在加载中"
    fi
    
    echo
    echo "🎉 修复完成！"
    echo "📱 访问地址："
    echo "   主页: http://localhost:8888/"
    echo "   主页: http://你的服务器IP:8888/"
    echo "   API: http://localhost:8888/api/search"
    echo
    echo "🔧 管理命令："
    echo "   查看日志: docker-compose logs -f"
    echo "   重启服务: docker-compose restart"
    echo "   停止服务: docker-compose down"
    
else
    echo "❌ 容器启动失败！"
    echo "📋 查看错误日志:"
    docker-compose logs
    exit 1
fi
