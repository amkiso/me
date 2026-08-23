.PHONY: help start stop restart rebuild logs status clean dev setup-env

help:
	@echo ""
	@echo "  Portfolio - Commands"
	@echo "  ────────────────────────────────────"
	@echo "  make start      Khoi chay containers"
	@echo "  make stop       Dung containers"
	@echo "  make restart    Khoi dong lai"
	@echo "  make rebuild    Build lai & chay"
	@echo "  make logs       Xem logs"
	@echo "  make status     Trang thai"
	@echo "  make clean      Xoa toan bo"
	@echo "  make setup-env  Tao file .env mau"
	@echo "  make dev        Dev server local"
	@echo ""

start:
	@echo "Starting..."
	docker compose up -d
	@echo "Running at http://localhost"

stop:
	docker compose down

restart:
	docker compose restart

rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

logs:
	docker compose logs -f --tail=100

status:
	docker compose ps

clean:
	docker compose down -v --rmi all

setup-env:
	@cp -n api/.env.example api/.env 2>/dev/null || true
	@echo "Created api/.env - please fill in OAuth credentials"

dev:
	@echo "API: http://localhost:3000"
	@echo "Web: http://localhost:8000"
	@cd api && npm install && node server.js &
	@cd src && python3 -m http.server 8000
