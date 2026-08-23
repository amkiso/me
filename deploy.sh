#!/bin/bash
# ===================================
# deploy.sh - Quick Deployment Script
# Portfolio Website
# ===================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║   🚀 Portfolio - Deployment Script       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Functions
usage() {
    echo -e "${YELLOW}Cách sử dụng:${NC}"
    echo "  ./deploy.sh start     - Khởi chạy containers"
    echo "  ./deploy.sh stop      - Dừng containers"
    echo "  ./deploy.sh restart   - Khởi động lại"
    echo "  ./deploy.sh rebuild   - Build lại & khởi chạy"
    echo "  ./deploy.sh logs      - Xem logs realtime"
    echo "  ./deploy.sh status    - Kiểm tra trạng thái"
    echo "  ./deploy.sh clean     - Xóa toàn bộ"
    echo "  ./deploy.sh setup     - Cài đặt Docker trên Ubuntu"
    echo "  ./deploy.sh ssl DOMAIN EMAIL - Cấp SSL cho domain"
    echo ""
}

start() {
    echo -e "${GREEN}🚀 Đang khởi chạy Portfolio...${NC}"
    docker compose up -d
    echo -e "${GREEN}✅ Portfolio đang chạy tại http://localhost${NC}"
    docker compose ps
}

stop() {
    echo -e "${YELLOW}⏹️  Đang dừng containers...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Đã dừng.${NC}"
}

restart() {
    echo -e "${BLUE}🔄 Đang khởi động lại...${NC}"
    docker compose restart
    echo -e "${GREEN}✅ Đã khởi động lại.${NC}"
}

rebuild() {
    echo -e "${BLUE}🔨 Đang rebuild...${NC}"
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✅ Đã rebuild và chạy tại http://localhost${NC}"
}

logs() {
    docker compose logs -f --tail=100
}

status() {
    echo -e "${CYAN}📊 Trạng thái containers:${NC}"
    docker compose ps
    echo ""
    echo -e "${CYAN}💾 Docker disk usage:${NC}"
    docker system df
}

clean() {
    echo -e "${RED}🧹 Đang dọn dẹp toàn bộ...${NC}"
    docker compose down -v --rmi all
    echo -e "${GREEN}✅ Đã dọn dẹp.${NC}"
}

setup_docker() {
    echo -e "${BLUE}📦 Cài đặt Docker trên Ubuntu...${NC}"

    # Update system
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release

    # Add Docker GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repo
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    sudo usermod -aG docker $USER

    echo -e "${GREEN}✅ Docker đã được cài đặt thành công!${NC}"
    echo -e "${YELLOW}⚠️  Hãy logout và login lại để dùng docker không cần sudo.${NC}"

    # Verify
    docker --version
    docker compose version
}

setup_ssl() {
    local DOMAIN=$1
    local EMAIL=$2

    if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
        echo -e "${RED}❌ Thiếu tham số! Cách dùng: ./deploy.sh ssl YOUR_DOMAIN YOUR_EMAIL${NC}"
        exit 1
    fi

    echo -e "${BLUE}🔒 Cấp phát SSL cho ${DOMAIN}...${NC}"

    # Install certbot
    sudo apt-get update -y
    sudo apt-get install -y certbot

    # Stop nginx temporarily
    docker compose down

    # Get certificate
    sudo certbot certonly --standalone \
        --preferred-challenges http \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    echo -e "${GREEN}✅ SSL certificate đã được cấp phát cho ${DOMAIN}!${NC}"
    echo -e "${YELLOW}📝 Certificate location: /etc/letsencrypt/live/${DOMAIN}/${NC}"

    # Restart with SSL
    docker compose up -d

    # Setup auto-renewal cron
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker compose -f $(pwd)/docker-compose.yml exec portfolio-web nginx -s reload") | crontab -
    echo -e "${GREEN}✅ Auto-renewal cron đã được thiết lập (12h hàng ngày).${NC}"
}

# Main
case "${1}" in
    start)    start ;;
    stop)     stop ;;
    restart)  restart ;;
    rebuild)  rebuild ;;
    logs)     logs ;;
    status)   status ;;
    clean)    clean ;;
    setup)    setup_docker ;;
    ssl)      setup_ssl "$2" "$3" ;;
    *)        usage ;;
esac
