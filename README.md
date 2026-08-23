# Portfolio + CMS

> Website Portfolio cá nhân với hệ thống quản lý nội dung (CMS), container hóa Docker, triển khai AWS EC2.

## Cấu trúc

```
├── src/                        # Frontend
│   ├── index.html              # Trang chủ
│   ├── courses.html            # Môn học & Bài tập
│   ├── contact.html            # Liên hệ
│   ├── admin/                  # CMS (ẩn, chỉ admin truy cập)
│   │   ├── index.html          # Dashboard quản lý
│   │   └── login.html          # Đăng nhập OAuth
│   ├── data/subjects.json      # Dữ liệu môn học (JSON storage)
│   └── assets/{css,js}/        # Styles & Scripts
├── api/                        # Backend Node.js
│   ├── server.js               # Express server
│   ├── routes/auth.js          # OAuth Google/GitHub
│   ├── routes/subjects.js      # CRUD API
│   └── middleware/auth.js      # JWT authentication
├── docker/                     # Docker configs
│   ├── Dockerfile              # Nginx Alpine
│   └── nginx.conf              # Reverse proxy + static
├── docker-compose.yml          # Nginx + API orchestration
└── Makefile                    # Quick commands
```

## Khởi chạy

### 1. Cấu hình OAuth

```bash
cp api/.env.example api/.env
```

Điền thông tin vào `api/.env`:

| Key | Nơi tạo |
|-----|---------|
| `GITHUB_CLIENT_ID/SECRET` | [github.com/settings/applications/new](https://github.com/settings/applications/new) |
| `GOOGLE_CLIENT_ID/SECRET` | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) |

**Callback URLs cần thiết:**
- GitHub: `http://localhost/api/auth/github/callback`
- Google: `http://localhost/api/auth/google/callback`

**Quan trọng:** Chỉ email `thangcuoi1984a@gmail.com` được phép đăng nhập admin. Tất cả tài khoản khác sẽ bị redirect về trang chủ.

### 2. Chạy

```bash
make start
# Hoặc: docker compose up -d
```

- Web: http://localhost
- Admin: http://localhost/admin/ (ẩn, không có link trên giao diện)

## Tính năng

### Giao diện công khai
- Dark / Light mode toggle (tông Azure, không dùng màu tím)
- Trang Môn học: fetch từ JSON, search, filter theo học kỳ
- Trang Liên hệ: GitHub, Email, form liên hệ
- Responsive, clean design, minimal icons

### CMS Admin (ẩn)
- Đăng nhập qua Google hoặc GitHub OAuth
- Chỉ `thangcuoi1984a@gmail.com` được phép truy cập
- CRUD môn học: thêm, sửa, xóa
- CRUD bài tập trong mỗi môn học
- Lưu trữ NoSQL bằng file JSON
- Live reload: sửa JSON → web cập nhật ngay

## Triển khai AWS EC2

### Cài Docker

```bash
ssh -i key.pem ubuntu@YOUR_IP
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```

### Deploy

```bash
git clone https://github.com/amkiso/my-portfolio.git
cd my-portfolio
cp api/.env.example api/.env
# Sửa api/.env: điền OAuth credentials, đổi BASE_URL thành domain thật
docker compose up -d
```

### Security Group

| Port | Mô tả |
|------|--------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |

### DNS

Trỏ A-Record từ domain → Elastic IP của EC2.

### SSL (Let's Encrypt)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

Cập nhật `docker/nginx.conf` thêm HTTPS block, mount `/etc/letsencrypt` vào docker-compose.

---

MIT License &copy; amkiso
