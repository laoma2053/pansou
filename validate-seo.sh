#!/bin/bash

# 部署后SEO验证脚本
echo "🚀 开始SEO验证..."

SITE_URL=${1:-"https://www.gugeso.com"}
echo "检查网站: $SITE_URL"

echo ""
echo "1️⃣ 检查 robots.txt..."
echo "========================"
robots_response=$(curl -s -w "%{http_code}" "$SITE_URL/robots.txt")
robots_code=${robots_response: -3}
robots_content=${robots_response%???}

if [ "$robots_code" = "200" ]; then
    echo "✅ robots.txt 返回状态码: $robots_code"
    
    if echo "$robots_content" | grep -q "<script"; then
        echo "❌ robots.txt 包含script标签！"
        echo "问题内容预览："
        echo "$robots_content" | head -5
    else
        echo "✅ robots.txt 内容正常"
    fi
    
    if echo "$robots_content" | grep -q "User-agent: \*"; then
        echo "✅ robots.txt 格式正确"
    else
        echo "❌ robots.txt 格式异常"
    fi
else
    echo "❌ robots.txt 返回状态码: $robots_code"
fi

echo ""
echo "2️⃣ 检查 sitemap.xml..."
echo "========================"
sitemap_response=$(curl -s -w "%{http_code}" "$SITE_URL/sitemap.xml")
sitemap_code=${sitemap_response: -3}

if [ "$sitemap_code" = "200" ]; then
    echo "✅ sitemap.xml 返回状态码: $sitemap_code"
else
    echo "❌ sitemap.xml 返回状态码: $sitemap_code"
fi

echo ""
echo "3️⃣ 检查主页响应..."
echo "========================"
home_response=$(curl -s -w "%{http_code}" "$SITE_URL/")
home_code=${home_response: -3}

if [ "$home_code" = "200" ]; then
    echo "✅ 主页返回状态码: $home_code"
else
    echo "❌ 主页返回状态码: $home_code"
fi

echo ""
echo "4️⃣ 检查meta标签..."
echo "========================"
meta_content=$(curl -s "$SITE_URL/" | grep -E '<meta|<title')
if echo "$meta_content" | grep -q "GugeSo"; then
    echo "✅ meta标签正常"
else
    echo "❌ meta标签可能有问题"
fi

echo ""
echo "📊 验证完成！"
echo "如果robots.txt有问题，请："
echo "1. 检查1Panel安全设置"
echo "2. 清除CDN缓存"
echo "3. 重新部署Nginx配置"
