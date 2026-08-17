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
| Platform Service | `4006` | Tenant, package, account, permission, trial request |
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
