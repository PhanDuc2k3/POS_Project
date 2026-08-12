# Transaction Service

Service quản lý đơn hàng, thanh toán, dashboard doanh thu và webhook SePay.

## Port

```text
4003
```

Khi chạy qua Gateway, public route là:

```text
/api/txn/*
```

Webhook SePay public qua Gateway:

```text
/api/payment-webhooks/sepay
```

Route nội bộ của service:

```text
/txn/*
```

## Chạy riêng service

```powershell
cd D:\POS\Project1\POS-ENGINE
npx nodemon src/services/transaction/index.js
```

## Endpoint chính

### Orders

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/txn/orders` | Danh sách đơn hàng, hỗ trợ filter |
| `POST` | `/txn/orders` | Tạo đơn hàng tiền mặt/chuyển khoản |
| `GET` | `/txn/orders/:id` | Chi tiết đơn hàng |
| `GET` | `/txn/orders/recent/list` | Đơn gần đây |
| `POST` | `/txn/orders/:id/cancel` | Hủy đơn |
| `POST` | `/txn/orders/:id/mark-paid` | Xác nhận đã thanh toán thủ công |
| `POST` | `/txn/orders/:id/refund` | Hoàn tiền |

### Payment webhook

| Method | Route | Mô tả |
| --- | --- | --- |
| `POST` | `/txn/payment-webhooks/sepay` | Nhận webhook SePay, match payment code và mark paid |

### Dashboard

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/txn/dashboard/stats` | Tổng quan hôm nay |
| `GET` | `/txn/dashboard/hourly` | Doanh thu theo giờ |
| `GET` | `/txn/dashboard/revenue` | Báo cáo doanh thu theo kỳ |
| `GET` | `/txn/dashboard/top-products` | Sản phẩm bán chạy |
| `GET` | `/txn/dashboard/payments` | Cơ cấu phương thức thanh toán |

## Luồng thanh toán

### Tiền mặt

1. POS Electron gọi `POST /api/txn/orders` với `paymentMethod: "cash"`.
2. Service tạo đơn trạng thái `completed`.
3. Publish `transaction.created`, `transaction.paid`, `dashboard.refresh`.
4. Print Service nhận `transaction.paid` để tạo print job.

### Chuyển khoản

1. POS Electron gọi `POST /api/txn/orders` với `paymentMethod: "transfer"`.
2. Service tạo đơn chờ thanh toán và sinh `paymentCode`.
3. SePay webhook gửi giao dịch về `/api/payment-webhooks/sepay`.
4. Service match `paymentCode`, mark đơn `completed`.
5. Publish `transaction.paid`, `dashboard.refresh`.

## Thành phần chính

```text
controllers/     # order, dashboard, webhook handlers
services/        # business logic
repositories/    # query orders/dashboard
routes/          # khai báo endpoint
database.js      # schema và kết nối DB transaction
```

## Event

```text
transaction.created
transaction.paid
transaction.cancelled
transaction.refunded
dashboard.refresh
```

Gateway broadcast các event này cho Portal/POS Electron dưới dạng:

```text
transaction:created
transaction:paid
dashboard:refresh
```
