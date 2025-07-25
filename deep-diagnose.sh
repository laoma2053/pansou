#!/bin/bash

# 深度诊断原作者镜像
echo "🔍 深度诊断原作者镜像"
echo "===================="
echo

# 1. 检查容器进程
echo "📋 1. 检查容器内运行的进程"
docker exec pansou ps aux 2>/dev/null || echo "❌ 无法获取进程信息"
echo

# 2. 检查容器内目录结构
echo "📁 2. 检查容器内目录结构"
echo "根目录内容："
docker exec pansou ls -la / 2>/dev/null || echo "❌ 无法访问根目录"
echo
echo "/app目录内容："
docker exec pansou ls -la /app/ 2>/dev/null || echo "❌ 无法访问/app目录"
echo
echo "检查是否有web相关目录："
docker exec pansou find /app -name "*web*" -o -name "*static*" -o -name "*public*" 2>/dev/null || echo "❌ 未找到web相关目录"
echo

# 3. 检查应用监听的端口
echo "🌐 3. 检查应用监听的端口"
docker exec pansou netstat -tlnp 2>/dev/null || docker exec pansou ss -tlnp 2>/dev/null || echo "❌ 无法获取端口信息"
echo

# 4. 检查应用配置
echo "⚙️  4. 检查应用配置"
echo "环境变量："
docker exec pansou env | grep -E "(PORT|WEB|STATIC|PUBLIC)" 2>/dev/null || echo "❌ 未找到相关环境变量"
echo

# 5. 测试各种可能的路径
echo "🧪 5. 测试各种可能的路径"
paths=("/" "/api" "/api/health" "/api/status" "/health" "/status" "/static" "/web" "/public")

for path in "${paths[@]}"; do
    echo -n "测试 $path: "
    response=$(curl -s -w "HTTP %{http_code}" "http://localhost:8888$path" -o /dev/null 2>/dev/null)
    echo "$response"
done
echo

# 6. 检查HTTP响应头
echo "📡 6. 检查HTTP响应详情"
echo "根路径响应头："
curl -I http://localhost:8888/ 2>/dev/null || echo "❌ 无响应"
echo
echo "API路径响应头："
curl -I http://localhost:8888/api/ 2>/dev/null || echo "❌ 无响应"
echo

# 7. 检查容器日志中的关键信息
echo "📝 7. 容器日志分析"
echo "查找监听端口信息："
docker logs pansou 2>/dev/null | grep -i -E "(listen|port|server|start)" | tail -10
echo
echo "查找静态文件相关信息："
docker logs pansou 2>/dev/null | grep -i -E "(static|web|file|serve)" | tail -5
echo

# 8. 检查挂载情况
echo "💾 8. 检查挂载情况"
echo "Docker inspect挂载信息："
docker inspect pansou | grep -A 20 -B 5 '"Mounts"' 2>/dev/null || echo "❌ 无法获取挂载信息"
echo

# 9. 尝试直接在容器内部创建测试文件
echo "🧪 9. 容器内文件测试"
echo "在容器内创建测试文件："
docker exec pansou sh -c 'echo "<h1>Test HTML</h1>" > /app/test.html' 2>/dev/null && echo "✅ 创建成功" || echo "❌ 创建失败"

echo "测试访问容器内测试文件："
curl -s http://localhost:8888/test.html | head -3 2>/dev/null || echo "❌ 无法访问测试文件"
echo

# 10. 检查Go应用的路由配置
echo "🔍 10. 检查可能的API端点"
echo "尝试获取API文档或帮助信息："
curl -s http://localhost:8888/api/help 2>/dev/null | head -5 || echo "❌ 无API帮助"
curl -s http://localhost:8888/api/docs 2>/dev/null | head -5 || echo "❌ 无API文档"
curl -s http://localhost:8888/api/swagger 2>/dev/null | head -5 || echo "❌ 无Swagger"
echo

# 结论和建议
echo "💡 诊断结论"
echo "==========="
echo
if docker exec pansou ls /app/web/ >/dev/null 2>&1; then
    echo "✅ 容器内存在/app/web目录"
    if docker exec pansou ls /app/web/index.html >/dev/null 2>&1; then
        echo "✅ 容器内存在index.html文件"
        echo "🔍 问题可能是：原作者的Go应用没有配置静态文件服务"
    else
        echo "❌ 容器内缺少index.html文件"
        echo "🔍 问题：文件挂载失败"
    fi
else
    echo "❌ 容器内不存在/app/web目录"
    echo "🔍 问题：原作者镜像不支持静态文件服务"
fi
echo
echo "🚀 建议解决方案："
echo "1. 如果是Go应用路由问题：需要修改应用代码"
echo "2. 如果是文件挂载问题：检查docker-compose配置"
echo "3. 如果镜像不支持：使用Nginx反向代理+静态文件服务"
echo
