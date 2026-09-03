# API Gateway

Gateway la entry point public cua POS Engine. Frontend, Electron va cac app local nen goi Gateway thay vi goi truc tiep tung service.

## Port va base URL

```text
Port: 4000
API:  http://localhost:4000/api
WS:   http://localhost:4000
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd run dev:gateway
```

Health check:

```text
GET /api/health
```

## Viec Gateway dam nhan

- CORS cho Portal, Admin, Marketing, Customer va Kitchen app.
- Rate limit chung cho `/api/*`.
- Strict rate limit cho login va forgot-password.
- Verify JWT cho protected route.
- Forward request den service noi bo.
- Socket.IO realtime.
- Quan ly device registry cho POS Electron.
- Dispatch print job den device agent.

## Route forwarding

| Gateway route | Dich den | Auth |
| --- | --- | --- |
| `/api/auth/login` | Auth Service `/auth/login` | Khong |
| `/api/auth/refresh` | Auth Service `/auth/refresh` | Khong |
| `/api/auth/forgot-password/*` | Auth Service | Khong |
| `/api/auth/*` | Auth Service | JWT |
| `/api/store/*` | Store Service | JWT |
| `/api/txn/*` | Transaction Service | JWT |
| `/api/product/*` | Product Service | JWT |
| `/api/print/*` | Print Service | JWT |
| `/api/platform/trial-requests` | Platform Service | JWT |
| `/api/platform/trial-requests/me` | Platform Service | JWT |
| `/api/platform/*` | Platform Service | `platform_admin` |
| `/api/public/marketing-signups*` | Platform Service public | Khong |
| `/api/public/orders*` | Platform Service public | Khong |
| `/api/public/sales-leads` | Platform Service public | Khong |
| `/api/public/support-tickets` | Platform Service public | Khong |
| `/api/customer/*` | Customer Service | Khong |
| `/api/kitchen/*` | Kitchen Service | Khong |
| `/api/public/menu` | Product Service public menu | Khong |
| `/api/public/dining-sessions/*` | Transaction Service public dining | Khong |
| `/api/payment-webhooks/sepay` | Transaction Service webhook | Khong/API key tuy cau hinh |
| `/uploads/avatars/*` | Auth static upload | Khong |

## WebSocket va device

Electron ket noi Socket.IO den Gateway va dung cac event:

```text
device:register
device:heartbeat
device:printResult
print:job
```

Realtime business events duoc broadcast ra client:

```text
transaction:created
transaction:paid
transaction:cancelled
transaction:refunded
dashboard:refresh
store:updated
store:bankUpdated
store:receiptUpdated
product:created
product:updated
product:toppingUpdated
product:categoryCreated
platform:changed
```

## Internal endpoint

```text
POST /internal/print-job
```

Print Service goi endpoint nay de day job in den Electron. Request can header:

```text
X-Internal-Token: pos-internal-token
```

Co the doi token bang bien moi truong `INTERNAL_SERVICE_TOKEN`.
