#!/bin/bash

# PanSou 一键部署脚本
# 支持云服务器快速部署

set -e

echo "=================================="
echo "🚀 PanSou 一键部署脚本"
echo "=================================="
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "操作系统: Linux ✓"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_success "操作系统: macOS ✓"
    else
        log_warning "未测试的操作系统: $OSTYPE"
    fi
    
    # 检查必要工具
    check_command "docker"
    check_command "docker-compose"
    check_command "git"
    
    log_success "系统要求检查完成"
}

# 获取用户配置
get_user_config() {
    echo
    log_info "请配置部署参数："
    
    # 端口配置
    read -p "请输入应用端口 (默认: 8080): " APP_PORT
    APP_PORT=${APP_PORT:-8080}
    
    # 域名配置
    read -p "请输入域名 (可选，直接回车跳过): " DOMAIN
    
    # 环境选择
    echo
    echo "请选择部署环境:"
    echo "1) 开发环境 (dev)"
    echo "2) 生产环境 (prod)"
    read -p "请选择 (1-2, 默认: 2): " ENV_CHOICE
    ENV_CHOICE=${ENV_CHOICE:-2}
    
    if [ "$ENV_CHOICE" = "1" ]; then
        ENVIRONMENT="dev"
    else
        ENVIRONMENT="prod"
    fi
    
    log_info "配置完成:"
    log_info "  端口: $APP_PORT"
    log_info "  域名: ${DOMAIN:-'未配置'}"
    log_info "  环境: $ENVIRONMENT"
}

# 创建环境配置文件
create_env_file() {
    log_info "创建环境配置文件..."
    
    cat > .env << EOF
# PanSou 环境配置
APP_PORT=$APP_PORT
ENVIRONMENT=$ENVIRONMENT
DOMAIN=$DOMAIN

# 数据库配置 (如果需要)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=pansou
# DB_USER=pansou
# DB_PASSWORD=your_password

# 缓存配置
CACHE_TYPE=memory
CACHE_SIZE=100MB

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/pansou.log
EOF

    log_success "环境配置文件创建完成"
}

# 修改 docker-compose.yml 端口
update_docker_compose() {
    log_info "更新 Docker Compose 配置..."
    
    if [ -f "docker-compose.yml" ]; then
        # 备份原文件
        cp docker-compose.yml docker-compose.yml.backup
        
        # 替换端口配置
        sed -i "s/8080:8080/$APP_PORT:8080/g" docker-compose.yml
        
        log_success "Docker Compose 配置更新完成"
    else
        log_warning "docker-compose.yml 文件不存在"
    fi
}

# 构建和启动服务
deploy_service() {
    log_info "开始构建和部署服务..."
    
    # 停止可能运行的旧服务
    docker-compose down 2>/dev/null || true
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build
    
    # 启动服务
    log_info "启动服务..."
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose up -d
    else
        docker-compose up -d
        log_info "开发环境启动，查看日志请运行: docker-compose logs -f"
    fi
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "服务启动成功！"
    else
        log_error "服务启动失败，请检查日志: docker-compose logs"
        exit 1
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 检查 ufw 是否存在
    if command -v ufw &> /dev/null; then
        sudo ufw allow $APP_PORT/tcp
        log_success "防火墙规则添加完成"
    else
        log_warning "未找到 ufw，请手动配置防火墙开放端口 $APP_PORT"
    fi
}

# 生成Nginx配置 (如果有域名)
generate_nginx_config() {
    if [ -n "$DOMAIN" ]; then
        log_info "生成Nginx配置..."
        
        mkdir -p nginx
        cat > nginx/pansou.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # 重定向到HTTPS (生产环境建议启用)
    # return 301 https://\$server_name\$request_uri;
    
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        
        log_success "Nginx配置文件生成完成: nginx/pansou.conf"
        log_info "请将配置文件复制到 Nginx 配置目录并重启 Nginx"
    fi
}

# 显示部署结果
show_deployment_result() {
    echo
    echo "=================================="
    log_success "🎉 部署完成！"
    echo "=================================="
    echo
    log_info "访问信息:"
    if [ -n "$DOMAIN" ]; then
        log_info "  网站地址: http://$DOMAIN"
    fi
    log_info "  IP访问: http://$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP"):$APP_PORT"
    log_info "  本地访问: http://localhost:$APP_PORT"
    echo
    log_info "管理命令:"
    log_info "  查看日志: docker-compose logs -f"
    log_info "  重启服务: docker-compose restart"
    log_info "  停止服务: docker-compose down"
    log_info "  更新部署: git pull && docker-compose up -d --build"
    echo
    log_info "配置文件:"
    log_info "  环境配置: .env"
    log_info "  Docker配置: docker-compose.yml"
    if [ -n "$DOMAIN" ]; then
        log_info "  Nginx配置: nginx/pansou.conf"
    fi
    echo
}

# 主函数
main() {
    # 检查是否在项目目录
    if [ ! -f "go.mod" ] || [ ! -f "main.go" ]; then
        log_error "请在PanSou项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行部署流程
    check_requirements
    get_user_config
    create_env_file
    update_docker_compose
    deploy_service
    configure_firewall
    generate_nginx_config
    show_deployment_result
    
    log_success "部署脚本执行完成！"
}

# 错误处理
trap 'log_error "脚本执行失败，请检查错误信息"; exit 1' ERR

# 执行主函数
main "$@"
