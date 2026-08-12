# Auth Service

Service quản lý đăng nhập, token, hồ sơ tài khoản, mật khẩu, session và nhật ký hoạt động.

## Port

```text
4001
```

Khi chạy qua Gateway, public route là:

```text
/api/auth/*
```

Route nội bộ của service:

```text
/auth/*
```

## Chạy riêng service

```powershell
cd D:\POS\Project1\POS-ENGINE
npm run dev:auth
```

Hoặc:

```powershell
npx nodemon src/services/auth/index.js
```

## Endpoint chính

| Method | Route | Mô tả |
| --- | --- | --- |
| `POST` | `/auth/login` | Đăng nhập, tạo access/refresh token |
| `POST` | `/auth/refresh` | Làm mới token |
| `POST` | `/auth/logout` | Đăng xuất session hiện tại |
| `POST` | `/auth/logout-all` | Đăng xuất toàn bộ session |
| `GET` | `/auth/me` | Lấy thông tin tài khoản hiện tại |
| `PUT` | `/auth/profile` | Cập nhật profile |
| `PUT` | `/auth/security-question` | Cài câu hỏi bảo mật |
| `PUT` | `/auth/avatar` | Upload avatar dạng base64/body |
| `DELETE` | `/auth/avatar` | Xóa avatar |
| `PUT` | `/auth/change-password` | Đổi mật khẩu |
| `POST` | `/auth/forgot-password/question` | Lấy câu hỏi bảo mật |
| `POST` | `/auth/forgot-password/verify` | Xác minh câu trả lời |
| `POST` | `/auth/forgot-password/reset` | Reset mật khẩu |
| `GET` | `/auth/sessions` | Danh sách session |
| `DELETE` | `/auth/sessions/:id` | Thu hồi session |
| `GET` | `/auth/activity` | Nhật ký hoạt động |

## Thành phần chính

```text
controllers/     # HTTP handlers
services/        # business logic
repositories/    # query sql.js
routes/          # khai báo endpoint
middlewares/     # validate, rate limit
helpers/         # token, request helpers
database.js      # schema và kết nối DB auth
```

## Dữ liệu quản lý

- User và mật khẩu hash bằng `bcryptjs`.
- Access token và refresh token dùng JWT.
- Có bảng session để quản lý thiết bị đăng nhập.
- Có bảng audit/activity để Portal hiển thị nhật ký.
- Có cơ chế chống brute-force đăng nhập theo cấu hình trong `src/shared/config.js`.

## Event

Auth Service publish một số event cho các service khác và WebSocket:

```text
user.loggedIn
user.passwordChanged
```

Các event này có thể được Store Service dùng để tạo store mặc định hoặc để Portal cập nhật trạng thái.
