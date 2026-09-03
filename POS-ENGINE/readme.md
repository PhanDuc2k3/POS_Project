# POS Engine

Backend Node.js cua POS Project. Engine chay theo kieu nhieu service nho trong cung repo, co API Gateway dung truoc de frontend va Electron chi can goi mot base URL.

## Chay engine

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd install
npm.cmd run dev
```

`npm.cmd run dev` chay `nodemon src/index.js`, khoi dong tat ca service va Gateway.

## Port

| Thanh phan | Port | Vai tro |
| --- | ---: | --- |
| Gateway | `4000` | API public, CORS, JWT, WebSocket, route forward |
| Auth Service | `4001` | Dang nhap, token, profile, session, activity |
| Store Service | `4002` | Store profile, bank config, receipt config |
| Transaction Service | `4003` | Order, payment, dashboard, dining session, SePay webhook |
| Product Service | `4004` | Category, product, topping, menu |
| Print Service | `4005` | Printer config, template, print job, auto-print |
| Platform Service | `4006` | Tenant, package, account, permission, trial request, order, email va support ticket |
| Customer Service | `4007` | API facade cho Customer App |
| Kitchen Service | `4008` | API facade cho Kitchen App |

Gateway public:

```text
http://localhost:4000/api
```

Kiem tra nhanh:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:4000/api/health
```

## Script

| Lenh | Tac dung |
| --- | --- |
| `npm.cmd run dev` | Chay toan bo engine bang nodemon |
| `npm.cmd start` | Chay toan bo engine bang node |
| `npm.cmd run dev:gateway` | Chay rieng Gateway |
| `npm.cmd run dev:auth` | Chay rieng Auth Service |
| `npm.cmd run dev:store` | Chay rieng Store Service |
| `npm.cmd run dev:platform` | Chay rieng Platform Service |
| `npm.cmd run dev:customer` | Chay rieng Customer Service |
| `npm.cmd run dev:kitchen` | Chay rieng Kitchen Service |

Rieng Transaction/Product/Print co the chay truc tiep:

```powershell
npx.cmd nodemon src/services/transaction/index.js
npx.cmd nodemon src/services/product/index.js
npx.cmd nodemon src/services/print/index.js
```

## Gateway routes

| Public route | Service dich | Auth |
| --- | --- | --- |
| `/api/auth/login` | Auth | Khong |
| `/api/auth/refresh` | Auth | Khong |
| `/api/auth/forgot-password/*` | Auth | Khong |
| `/api/auth/*` | Auth | JWT |
| `/api/store/*` | Store | JWT |
| `/api/txn/*` | Transaction | JWT |
| `/api/product/*` | Product | JWT |
| `/api/print/*` | Print | JWT |
| `/api/platform/trial-requests` | Platform | JWT |
| `/api/platform/trial-requests/me` | Platform | JWT |
| `/api/platform/*` | Platform | `platform_admin` |
| `/api/public/marketing-signups*` | Platform public | Khong |
| `/api/public/orders*` | Platform public | Khong |
| `/api/public/sales-leads` | Platform public | Khong |
| `/api/public/support-tickets` | Platform public | Khong |
| `/api/customer/*` | Customer | Khong |
| `/api/kitchen/*` | Kitchen | Khong |
| `/api/public/menu` | Product public menu | Khong |
| `/api/public/dining-sessions/*` | Transaction public dining session | Khong |
| `/api/payment-webhooks/sepay` | Transaction webhook | Khong/JWT/API key tuy cau hinh |
| `/api/realtime/status` | Gateway | Khong |

## Cau hinh moi truong

Mac dinh nam trong `src/shared/config.js`.

| Bien | Mac dinh |
| --- | --- |
| `GATEWAY_PORT` | `4000` |
| `AUTH_SERVICE_PORT` | `4001` |
| `STORE_SERVICE_PORT` | `4002` |
| `TRANSACTION_SERVICE_PORT` | `4003` |
| `PRODUCT_SERVICE_PORT` | `4004` |
| `PRINT_SERVICE_PORT` | `4005` |
| `PLATFORM_SERVICE_PORT` | `4006` |
| `CUSTOMER_SERVICE_PORT` | `4007` |
| `KITCHEN_SERVICE_PORT` | `4008` |
| `PORTAL_ORIGIN` | `http://localhost:3000` |
| `ADMIN_APP_ORIGINS` | `http://localhost:8000` |
| `MARKETING_APP_ORIGIN` | `http://localhost:8001` |
| `CUSTOMER_APP_ORIGIN` | `http://localhost:3001` |
| `KITCHEN_APP_ORIGIN` | `http://localhost:3002` |
| `JWT_ACCESS_SECRET` | dev secret |
| `JWT_REFRESH_SECRET` | dev secret |
| `KAFKA_BROKER` | rong, dung in-memory event bus |

## Email / SMTP

Backend gui email tap trung tu POS-ENGINE. Admin App `localhost:8000` va Marketing Website `localhost:8001` van goi API qua Gateway `http://localhost:4000/api`; cac email ve dang ky marketing, don hang, thay doi trang thai don, trial, support ticket va password reset duoc gui tu service tuong ung.

Neu chua cau hinh SMTP, email se duoc ghi ra outbox local:

```text
POS-ENGINE/data/mail-outbox
```

Cau hinh SMTP bang bien moi truong:

| Bien | Mac dinh | Mo ta |
| --- | --- | --- |
| `SMTP_ENABLED` | `false` | Bat gui SMTP that |
| `SMTP_HOST` | rong | SMTP host |
| `SMTP_PORT` | `1025` | SMTP port |
| `SMTP_SECURE` | `false` | Dung TLS ngay tu dau, thuong la port 465 |
| `SMTP_STARTTLS` | `false` | Nang cap STARTTLS sau EHLO |
| `SMTP_USER` | rong | Tai khoan SMTP |
| `SMTP_PASS` | rong | Mat khau SMTP |
| `SMTP_FROM` | `POS Platform <no-reply@pos.local>` | Nguoi gui |
| `MAIL_DRY_RUN` | `true` | Neu SMTP loi thi ghi outbox thay vi lam fail request |
| `MAIL_OUTBOX_DIR` | `data/mail-outbox` | Thu muc luu file `.eml` local |
| `ADMIN_NOTIFY_EMAIL` | rong | Email admin nhan don hang/lead/trial/ticket moi |

Vi du dung MailHog/Mailpit local:

```powershell
$env:SMTP_ENABLED="true"
$env:SMTP_HOST="localhost"
$env:SMTP_PORT="1025"
$env:ADMIN_NOTIFY_EMAIL="admin@pos.local"
npm.cmd run dev
```

## Support ticket

Ticket ho tro duoc luu trong Platform Service va email chi la kenh thong bao/phan hoi.

Luong chinh:

1. Khach dang ky/dang nhap marketing tai `localhost:8001`.
2. Khach gui form support ticket.
3. Gateway forward `POST /api/public/support-tickets` den Platform Service.
4. Platform Service tao ticket va message dau tien, gui email xac nhan cho khach.
5. Admin mo `localhost:8000` -> `Tickets` de xem hoi thoai, doi trang thai va reply.
6. Reply cua admin duoc luu vao ticket va gui email cho khach.

Inbound email tu khach reply truc tiep vao hop thu chua tu dong append vao ticket; buoc do can them IMAP hoac webhook tu provider nhu Gmail, SendGrid hoac Mailgun.

## Realtime va in hoa don

Gateway chay Socket.IO tren port `4000`. Electron dang ky device bang:

```text
device:register
device:heartbeat
device:printResult
```

Luong auto-print:

1. Transaction Service publish `transaction.paid`.
2. Print Service tao print job voi payload order/store/receipt.
3. Print Service goi Gateway `/internal/print-job`.
4. Gateway emit `print:job` den Electron da dang ky.
5. Electron in va tra ket qua qua `device:printResult`.
6. Gateway cap nhat Print Service bang `/jobs/:id/result`.

## Database va runtime

Engine dung `sql.js`. File runtime nam trong:

```text
POS-ENGINE/data
POS-ENGINE/logs
```

Khong nen commit `data/*.db`, `data/*.sqlite`, `logs/`, `node_modules/`.

## Tai lieu service

- [Auth Service](src/services/auth/readme.md)
- [API Gateway](src/gateway/readme.md)
- [Store Service](src/services/store/readme.md)
- [Transaction Service](src/services/transaction/readme.md)
- [Product Service](src/services/product/readme.md)
- [Print Service](src/services/print/readme.md)
- [Platform Service](src/services/platform/readme.md)
- [Customer Service](src/services/customer/readme.md)
- [Kitchen Service](src/services/kitchen/readme.md)
