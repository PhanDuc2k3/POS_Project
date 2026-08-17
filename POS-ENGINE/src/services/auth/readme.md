# Auth Service

Service quan ly dang nhap, JWT, refresh token, profile, password, session va activity log.

## Port va route

```text
Service port: 4001
Internal base: /auth
Gateway base:  /api/auth
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd run dev:auth
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | `/api/auth/login` | Dang nhap |
| `POST` | `/auth/refresh` | `/api/auth/refresh` | Lam moi token |
| `POST` | `/auth/logout` | `/api/auth/logout` | Dang xuat session hien tai |
| `POST` | `/auth/logout-all` | `/api/auth/logout-all` | Dang xuat tat ca session |
| `GET` | `/auth/me` | `/api/auth/me` | Lay user hien tai |
| `PUT` | `/auth/profile` | `/api/auth/profile` | Cap nhat profile |
| `PUT` | `/auth/security-question` | `/api/auth/security-question` | Cai cau hoi bao mat |
| `PUT` | `/auth/avatar` | `/api/auth/avatar` | Upload avatar |
| `DELETE` | `/auth/avatar` | `/api/auth/avatar` | Xoa avatar |
| `PUT` | `/auth/change-password` | `/api/auth/change-password` | Doi mat khau |
| `POST` | `/auth/forgot-password/question` | `/api/auth/forgot-password/question` | Lay cau hoi bao mat |
| `POST` | `/auth/forgot-password/verify` | `/api/auth/forgot-password/verify` | Xac minh cau tra loi |
| `POST` | `/auth/forgot-password/reset` | `/api/auth/forgot-password/reset` | Reset mat khau |
| `GET` | `/auth/sessions` | `/api/auth/sessions` | Danh sach session |
| `DELETE` | `/auth/sessions/:id` | `/api/auth/sessions/:id` | Thu hoi session |
| `GET` | `/auth/activity` | `/api/auth/activity` | Nhat ky hoat dong |

## Tai khoan seed

Khi DB rong, service tao:

```text
admin / admin123       role: admin
platform / platform123 role: platform_admin
```

## Thanh phan

```text
controllers/
services/
repositories/
routes/
middlewares/
helpers/
validators/
database.js
```

## Ghi chu

- Password hash bang `bcryptjs`.
- Access/refresh token dung JWT secret trong `src/shared/config.js`.
- Gateway verify JWT va forward user context qua header `X-User-*`.
- Login va forgot-password co strict rate limit o Gateway.
