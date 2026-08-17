# Transaction Service

Service quan ly order, thanh toan, dashboard doanh thu, dining session va webhook SePay.

## Port va route

```text
Service port: 4003
Internal base: /txn
Gateway base:  /api/txn
Webhook:       /api/payment-webhooks/sepay
Public dining: /api/public/dining-sessions
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npx.cmd nodemon src/services/transaction/index.js
```

## Endpoint order

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/txn/orders` | `/api/txn/orders` | Danh sach order |
| `POST` | `/txn/orders` | `/api/txn/orders` | Tao order |
| `GET` | `/txn/orders/:id` | `/api/txn/orders/:id` | Chi tiet order |
| `GET` | `/txn/orders/recent/list` | `/api/txn/orders/recent/list` | Order gan day |
| `POST` | `/txn/orders/:id/cancel` | `/api/txn/orders/:id/cancel` | Huy order |
| `POST` | `/txn/orders/:id/mark-paid` | `/api/txn/orders/:id/mark-paid` | Xac nhan da thanh toan |
| `POST` | `/txn/orders/:id/refund` | `/api/txn/orders/:id/refund` | Hoan tien |

## Endpoint dining session

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/txn/dining-sessions` | `/api/txn/dining-sessions` | Danh sach phien an |
| `POST` | `/txn/dining-sessions` | `/api/txn/dining-sessions` | Tao phien an |
| `GET` | `/txn/dining-sessions/:id` | `/api/txn/dining-sessions/:id` | Chi tiet phien an |
| `POST` | `/txn/dining-sessions/:id/orders` | `/api/txn/dining-sessions/:id/orders` | Tao order trong phien |
| `POST` | `/txn/dining-sessions/:id/close` | `/api/txn/dining-sessions/:id/close` | Dong phien an |
| `GET` | `/txn/public/dining-sessions` | `/api/public/dining-sessions` | Public list cho Customer/Kitchen |
| `POST` | `/txn/public/dining-sessions` | `/api/public/dining-sessions` | Public create session |
| `GET` | `/txn/public/dining-sessions/:id` | `/api/public/dining-sessions/:id` | Public session detail |
| `POST` | `/txn/public/dining-sessions/:id/orders` | `/api/public/dining-sessions/:id/orders` | Public create order |
| `POST` | `/txn/public/dining-sessions/:id/close` | `/api/public/dining-sessions/:id/close` | Public close session |

## Endpoint dashboard va webhook

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `POST` | `/txn/payment-webhooks/sepay` | `/api/payment-webhooks/sepay` | Nhan webhook SePay |
| `GET` | `/txn/dashboard/stats` | `/api/txn/dashboard/stats` | So lieu tong quan |
| `GET` | `/txn/dashboard/hourly` | `/api/txn/dashboard/hourly` | Doanh thu theo gio |
| `GET` | `/txn/dashboard/revenue` | `/api/txn/dashboard/revenue` | Bao cao doanh thu |
| `GET` | `/txn/dashboard/top-products` | `/api/txn/dashboard/top-products` | San pham ban chay |
| `GET` | `/txn/dashboard/payments` | `/api/txn/dashboard/payments` | Ti le phuong thuc thanh toan |

## Luong thanh toan

Tien mat:

1. POS tao order voi `paymentMethod: "cash"`.
2. Service tao order completed.
3. Publish `transaction.created`, `transaction.paid`, `dashboard.refresh`.
4. Print Service tao job in.

Chuyen khoan:

1. POS tao order voi `paymentMethod: "transfer"`.
2. Service tao order pending va sinh payment code.
3. SePay goi webhook.
4. Service match payment code va mark paid.
5. Publish event va kich hoat auto-print.

## Event

```text
transaction.created
transaction.paid
transaction.cancelled
transaction.refunded
dashboard.refresh
```
