# Print Service

Service quản lý máy in, template hóa đơn, print job và auto-print khi giao dịch thanh toán thành công.

## Port

```text
4005
```

Khi chạy qua Gateway, public route là:

```text
/api/print/*
```

Route nội bộ của service:

```text
/*
```

Vì Gateway mount `/api/print` trực tiếp vào Print Service, các route nội bộ như `/jobs` sẽ thành `/api/print/jobs` ở public API.

## Chạy riêng service

```powershell
cd D:\POS\Project1\POS-ENGINE
npx nodemon src/services/print/index.js
```

## Endpoint chính

### Health

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/health` | Kiểm tra service sống |

### Printers

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/printers` | Danh sách máy in |
| `POST` | `/printers` | Tạo cấu hình máy in |
| `PUT` | `/printers/:id` | Cập nhật máy in |
| `DELETE` | `/printers/:id` | Xóa máy in |
| `POST` | `/printers/:id/test` | In test |

### Templates

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/templates` | Danh sách template |
| `GET` | `/templates/default` | Template mặc định |
| `POST` | `/templates` | Tạo/cập nhật template |
| `PUT` | `/templates/:id` | Cập nhật template |
| `DELETE` | `/templates/:id` | Xóa template |
| `POST` | `/templates/preview` | Render preview/template text |

### Print jobs

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/jobs` | Danh sách job in |
| `GET` | `/jobs/:id` | Chi tiết job |
| `POST` | `/jobs` | Tạo job in |
| `POST` | `/jobs/:id/retry` | In lại job |
| `POST` | `/jobs/:id/cancel` | Hủy job |
| `POST` | `/jobs/:id/result` | Callback kết quả in từ POS Electron/Gateway |

## Luồng auto-print

1. Transaction Service publish `transaction.paid`.
2. Print Service subscribe event này.
3. Service lấy store + receipt config từ Store DB.
4. Service tạo print job với payload gồm `order`, `store`, `receipt`.
5. Print Service gửi job qua Gateway/WebSocket tới POS Electron.
6. POS Electron in hóa đơn qua máy in nhiệt và gửi `device:printResult`.
7. Gateway gọi `/jobs/:id/result` để cập nhật trạng thái job.

## Chế độ in

Print Service có hai hướng:

```text
DEVICE_AGENT  -> gửi job tới POS Electron để in tại quầy
SERVICE_SIDE  -> service tự in trực tiếp, dùng như fallback/dev
```

Hiện luồng thực tế nên ưu tiên `DEVICE_AGENT`, vì máy in USB nằm trên máy POS.

## Thành phần chính

```text
controllers/       # printer, template, print job handlers
services/          # print, printer, template, escpos logic
repositories/      # printers, templates, print_jobs
routes/            # khai báo endpoint
events/            # subscribe transaction.paid
jobs/worker.js     # worker xử lý job nếu cần chạy riêng
templates/         # default receipt template
database.js        # schema và kết nối DB print
```

## Ghi chú với mẫu hóa đơn Portal

Mẫu hóa đơn setup trong Portal nằm ở Store Service (`receipt_configs`). Khi auto-print, Print Service build payload từ cấu hình đó để POS Electron formatter in theo các block:

```text
logo
header
storeInfo
divider
orderInfo
items
total
payment
qr
footer
```

Nếu hóa đơn in ra không giống mẫu Portal, kiểm tra log POS Electron:

```text
[Device Agent] Store/receipt config cached
[Device Agent] Print job payload summary
```

Trong đó `receiptBlocks`, `receiptHeader`, `receiptFooter` phải đúng với cấu hình đã lưu ở Portal.
