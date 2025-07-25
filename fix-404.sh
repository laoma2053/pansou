#!/bin/bash

# PanSou 一步修复脚本
echo "🛠️  PanSou 404问题一步修复"
echo "========================="
echo

# 1. 停止现有容器
echo "📦 停止现有服务..."
docker-compose down 2>/dev/null

# 2. 检查web目录
echo "📁 检查web目录..."
if [ ! -d "./web" ]; then
    echo "❌ web目录不存在！请确保在项目根目录运行此脚本"
    exit 1
fi

if [ ! -f "./web/index.html" ]; then
    echo "❌ web/index.html 不存在！"
    exit 1
fi

echo "✅ web目录检查通过"

# 3. 修复文件权限
echo "🔧 修复文件权限..."
chmod -R 755 ./web/
chown -R $USER:$USER ./web/ 2>/dev/null || true

# 4. 使用正确的配置
echo "⚙️  使用挂载配置..."
cp docker-compose-volume.yml docker-compose.yml

# 5. 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose pull

# 6. 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 7. 等待启动
echo "⏳ 等待服务启动..."
sleep 15

# 8. 验证挂载
echo "🔍 验证文件挂载..."
echo "容器内web目录内容："
docker exec pansou ls -la /app/web/ 2>/dev/null || {
    echo "❌ 无法访问容器内web目录"
    echo "📋 容器日志："
    docker logs pansou --tail=10
    exit 1
}

# 9. 测试访问
echo "🧪 测试网页访问..."
sleep 5

# 测试API
if curl -s http://localhost:8888/api/health > /dev/null 2>&1; then
    echo "✅ API服务正常"
else
    echo "⚠️  API未响应，检查其他端点..."
    curl -s -w "HTTP Status: %{http_code}\n" http://localhost:8888/api/ -o /dev/null
fi

# 测试首页
echo "🌐 测试首页..."
response=$(curl -s -w "HTTP %{http_code}" http://localhost:8888/ -o /tmp/pansou_test.html)
echo "响应: $response"

if [ -f "/tmp/pansou_test.html" ]; then
    if grep -q "PanSou" /tmp/pansou_test.html; then
        echo "✅ 首页正常！发现PanSou内容"
    else
        echo "⚠️  首页响应但内容不正确："
        head -5 /tmp/pansou_test.html
    fi
    rm -f /tmp/pansou_test.html
else
    echo "❌ 无法获取首页响应"
fi

# 10. 最终检查
echo
echo "🎯 最终状态检查："
echo "容器状态："
docker ps --filter "name=pansou" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "🎉 修复完成！"
echo "📱 访问地址："
echo "   http://localhost:8888/"
echo "   http://你的服务器IP:8888/"
echo
echo "如果仍然显示404，请运行诊断脚本："
echo "   chmod +x diagnose.sh && ./diagnose.sh"
