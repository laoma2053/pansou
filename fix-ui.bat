@echo off
setlocal enabledelayedexpansion

echo 🔧 PanSou UI 修复脚本
echo ======================
echo.

REM 检查当前是否有运行的容器
docker ps | findstr pansou >nul
if %ERRORLEVEL% EQU 0 (
    echo 📦 停止当前运行的容器...
    docker-compose down
)

echo 🎯 选择修复方案:
echo 1) 使用挂载方式（快速，推荐）
echo 2) 重新构建镜像（包含所有功能）
set /p CHOICE="请选择 (1-2, 默认: 1): "
if "!CHOICE!"=="" set CHOICE=1

if "!CHOICE!"=="1" (
    echo 📁 使用挂载方式修复...
    
    REM 使用挂载版本的配置
    copy docker-compose-volume.yml docker-compose.yml >nul
    
    REM 启动服务
    echo 🚀 启动服务...
    docker-compose up -d
    
    REM 等待服务启动
    echo ⏳ 等待服务启动...
    timeout /t 10 /nobreak >nul
    
) else (
    echo 🔨 重新构建镜像...
    
    REM 构建新镜像
    echo 📦 构建包含UI的镜像...
    docker-compose build
    
    REM 启动服务
    echo 🚀 启动服务...
    docker-compose up -d
    
    REM 等待服务启动
    echo ⏳ 等待服务启动...
    timeout /t 15 /nobreak >nul
)

REM 检查服务状态
echo 🔍 检查服务状态...
docker ps | findstr pansou >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 容器启动成功！
    
    REM 测试API
    echo 🧪 测试API连接...
    curl -s http://localhost:8888/api/health >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ API服务正常
    ) else (
        echo ⚠️  API服务可能还在启动中
    )
    
    echo.
    echo 🎉 修复完成！
    echo 📱 访问地址：
    echo    主页: http://localhost:8888/
    echo    主页: http://你的服务器IP:8888/
    echo    API: http://localhost:8888/api/search
    echo.
    echo 🔧 管理命令：
    echo    查看日志: docker-compose logs -f
    echo    重启服务: docker-compose restart
    echo    停止服务: docker-compose down
    echo.
    
    set /p OPEN_BROWSER="是否打开浏览器查看页面? (y/N): "
    if /i "!OPEN_BROWSER!"=="y" (
        start http://localhost:8888/
    )
    
) else (
    echo ❌ 容器启动失败！
    echo 📋 查看错误日志:
    docker-compose logs
    pause
    exit /b 1
)

echo 按任意键退出...
pause >nul
