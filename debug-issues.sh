#!/bin/bash

# PanSou 问题修复脚本
echo "🔧 PanSou 问题诊断和修复"
echo "======================"
echo

# 1. 检查前端文件
echo "📁 1. 检查前端文件挂载"
echo "Nginx容器内的文件："
docker exec pansou-web ls -la /usr/share/nginx/html/ 2>/dev/null || echo "❌ 无法访问Nginx容器"
echo
echo "本地web目录文件："
ls -la ./web/ 2>/dev/null || echo "❌ 本地web目录不存在"
echo

# 2. 检查具体文件内容
echo "📄 2. 检查关键文件"
echo "检查index.html是否是我们的版本："
if docker exec pansou-web grep -q "search-header" /usr/share/nginx/html/index.html 2>/dev/null; then
    echo "✅ 发现优化版本的HTML结构"
else
    echo "❌ 未发现优化版本，可能使用了旧版本"
fi

echo "检查CSS文件："
if docker exec pansou-web grep -q "search-header" /usr/share/nginx/html/style.css 2>/dev/null; then
    echo "✅ 发现优化版本的CSS"
else
    echo "❌ 未发现优化版本的CSS"
fi
echo

# 3. 检查API连接
echo "🌐 3. 检查API连接"
echo "测试后端API容器："
if docker ps | grep -q pansou-api; then
    echo "✅ 后端API容器运行中"
    
    # 直接测试后端API
    echo "直接测试后端API健康检查："
    docker exec pansou-api wget -qO- http://localhost:8888/api/health 2>/dev/null || echo "❌ 后端API健康检查失败"
    
    echo "测试后端API搜索功能："
    docker exec pansou-api wget -qO- "http://localhost:8888/api/search?keyword=test" 2>/dev/null || echo "❌ 后端API搜索失败"
else
    echo "❌ 后端API容器未运行"
fi
echo

# 4. 检查Nginx代理
echo "🔗 4. 检查Nginx代理"
echo "测试通过Nginx访问API："
curl -s "http://localhost:8888/api/health" || echo "❌ Nginx API代理失败"

echo "测试通过Nginx搜索："
curl -s "http://localhost:8888/api/search?keyword=test" | head -5 || echo "❌ Nginx搜索代理失败"
echo

# 5. 检查网络连接
echo "🌐 5. 检查容器网络"
echo "检查容器网络连接："
docker exec pansou-web nslookup pansou-api 2>/dev/null || echo "❌ 容器间网络连接失败"
echo

# 6. 查看容器日志
echo "📝 6. 查看容器日志"
echo "Nginx日志："
docker logs pansou-web --tail=10 2>/dev/null || echo "❌ 无法获取Nginx日志"
echo
echo "API容器日志："
docker logs pansou-api --tail=10 2>/dev/null || echo "❌ 无法获取API日志"
echo

# 7. 检查前端JavaScript API配置
echo "📱 7. 检查前端JavaScript配置"
echo "检查script.js中的API地址："
if docker exec pansou-web grep -n "api" /usr/share/nginx/html/script.js 2>/dev/null; then
    echo "发现API调用配置"
else
    echo "❌ 未找到API调用配置"
fi
echo

echo "💡 修复建议："
echo "============"
echo
echo "如果UI不正确："
echo "1. 检查是否使用了demo-improved.html文件"
echo "2. 重新复制web目录文件"
echo
echo "如果搜索不工作："
echo "1. 检查API容器是否正常启动"
echo "2. 检查Nginx代理配置"
echo "3. 检查前端JavaScript API地址"
