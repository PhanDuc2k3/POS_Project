# POS Engine

Backend Node.js cho hệ thống POS. Project chạy theo kiểu nhiều service nhỏ trong cùng một repo, có Gateway đứng trước để Portal/POS Electron gọi qua một địa chỉ chung.

## Chạy dự án

```powershell
cd D:\POS\Project1\POS-ENGINE
npm install
npm run dev
```

`npm run dev` sẽ khởi động toàn bộ service và Gateway:

| Thành phần | Port mặc định | Vai trò |
| --- | ---: | --- |
| Gateway | `4000` | API public, JWT middleware, WebSocket, route proxy |
| Auth Service | `4001` | Đăng nhập, refresh token, profile, session, activity log |
| Store Service | `4002` | Thông tin cửa hàng, ngân hàng, mẫu hóa đơn |
| Transaction Service | `4003` | Đơn hàng, thanh toán, dashboard, webhook SePay |
| Product Service | `4004` | Danh mục, sản phẩm, topping, menu POS |
| Print Service | `4005` | Máy in, template, print job, auto-print hóa đơn |

Gateway public base URL:

```text
http://localhost:4000/api
```

## Script

```powershell
npm run dev          # Chạy toàn bộ engine
npm start            # Chạy toàn bộ engine bằng node
npm run dev:gateway  # Chạy riêng gateway
npm run dev:auth     # Chạy riêng auth service
npm run dev:store    # Chạy riêng store service
```

Các service còn lại có thể chạy trực tiếp bằng `nodemon` hoặc `node`, ví dụ:

```powershell
npx nodemon src/services/transaction/index.js
```

## Cấu hình môi trường

Các giá trị mặc định nằm ở `src/shared/config.js`.

| Biến môi trường | Mặc định | Ghi chú |
| --- | --- | --- |
| `GATEWAY_PORT` | `4000` | Port Gateway |
| `AUTH_SERVICE_PORT` | `4001` | Port Auth |
| `STORE_SERVICE_PORT` | `4002` | Port Store |
| `TRANSACTION_SERVICE_PORT` | `4003` | Port Transaction |
| `PRODUCT_SERVICE_PORT` | `4004` | Port Product |
| `PRINT_SERVICE_PORT` | `4005` | Port Print |
| `PORTAL_ORIGIN` | `http://localhost:3000` | CORS cho Portal |
| `JWT_ACCESS_SECRET` | dev secret | Nên đặt khi deploy thật |
| `JWT_REFRESH_SECRET` | dev secret | Nên đặt khi deploy thật |
| `KAFKA_BROKER` | rỗng | Nếu rỗng thì Event Bus dùng in-memory |
| `INTERNAL_SERVICE_TOKEN` | `pos-internal-token` | Token nội bộ Gateway/Print callback |

## Luồng request

Portal và POS Electron nên gọi Gateway:

```text
Portal/POS -> http://localhost:4000/api -> Gateway -> service nội bộ
```

Gateway forward các nhóm route:

| Public route | Service đích |
| --- | --- |
| `/api/auth/*` | Auth Service |
| `/api/store/*` | Store Service |
| `/api/product/*` | Product Service |
| `/api/txn/*` | Transaction Service |
| `/api/print/*` | Print Service |
| `/api/payment-webhooks/sepay` | Transaction Service, không bắt buộc JWT |

## Realtime và in hóa đơn

Gateway chạy Socket.IO cùng port `4000`.

POS Electron đăng ký thiết bị qua:

```text
device:register
device:heartbeat
device:printResult
```

Khi thanh toán thành công:

1. Transaction Service publish `transaction.paid`.
2. Print Service nhận event và tạo print job.
3. Gateway gửi `print:job` đến POS Electron.
4. POS Electron in hóa đơn và trả kết quả bằng `device:printResult`.
5. Print Service cập nhật trạng thái job.

Các event realtime quan trọng:

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
```

## Database và file runtime

Project dùng `sql.js` và lưu database local trong `POS-ENGINE/data`. Log nằm trong `POS-ENGINE/logs`.

Các file runtime này không nên commit:

```text
data/*.db
data/*.sqlite
logs/
node_modules/
```

## Cấu trúc chính

```text
src/
  gateway/              # API gateway + WebSocket
  shared/               # config, logger, event-bus, websocket, time
  services/
    auth/               # user, token, session, activity
    store/              # store profile, bank, receipt config
    product/            # category, product, topping, POS menu
    transaction/        # order, payment, dashboard, SePay webhook
    print/              # printer, template, print job, auto-print
```

## Ghi chú phát triển

- Dữ liệu thời gian trong các luồng POS đang ưu tiên GMT+7/Asia Bangkok.
- Khi chỉnh API, nên chỉnh qua service route rồi test qua Gateway để giống cách Portal/POS Electron sử dụng thật.
- Khi chỉnh auto-print, kiểm tra đồng thời Transaction Service, Print Service, Gateway WebSocket và POS Electron Device Agent.
