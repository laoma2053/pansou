#!/bin/bash

# robots.txt 验证脚本
echo "🔍 检查 robots.txt 文件..."

# 检查本地文件
echo "📄 本地 robots.txt 内容："
echo "========================"
if [ -f "web/robots.txt" ]; then
    cat web/robots.txt
    echo ""
    echo "========================"
    echo "✅ 本地文件看起来正常"
else
    echo "❌ 本地 robots.txt 文件不存在"
    exit 1
fi

# 如果提供了URL，检查远程访问
if [ ! -z "$1" ]; then
    echo ""
    echo "🌐 检查远程 robots.txt (URL: $1/robots.txt)..."
    echo "========================"
    
    # 使用curl检查响应
    response=$(curl -s -H "User-Agent: Mozilla/5.0" "$1/robots.txt")
    content_type=$(curl -s -I -H "User-Agent: Mozilla/5.0" "$1/robots.txt" | grep -i "content-type")
    
    echo "Content-Type: $content_type"
    echo ""
    echo "响应内容："
    echo "$response"
    echo "========================"
    
    # 检查是否包含script标签
    if echo "$response" | grep -q "<script"; then
        echo "❌ 发现 script 标签注入！"
        echo "🔧 可能的解决方案："
        echo "1. 检查1Panel WAF设置"
        echo "2. 检查CDN防护设置" 
        echo "3. 验证Nginx配置是否正确"
        echo "4. 联系服务器管理员"
    else
        echo "✅ 未发现 script 注入"
    fi
    
    # 检查内容是否正确
    if echo "$response" | grep -q "User-agent: \*"; then
        echo "✅ robots.txt 内容正确"
    else
        echo "❌ robots.txt 内容异常"
    fi
else
    echo ""
    echo "💡 用法: $0 <website-url>"
    echo "例如: $0 https://www.gugeso.com"
fi

echo ""
echo "🔧 如果发现问题，请："
echo "1. 重新部署并应用新的Nginx配置"
echo "2. 清除CDN缓存"
echo "3. 检查1Panel安全设置"
echo "4. 验证防火墙配置"
