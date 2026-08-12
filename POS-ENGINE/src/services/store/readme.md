# Store Service

Service quản lý thông tin cửa hàng, tài khoản ngân hàng nhận chuyển khoản và mẫu hóa đơn mà Portal/POS Electron sử dụng.

## Port

```text
4002
```

Khi chạy qua Gateway, public route là:

```text
/api/store/*
```

Route nội bộ của service:

```text
/store/*
```

## Chạy riêng service

```powershell
cd D:\POS\Project1\POS-ENGINE
npm run dev:store
```

Hoặc:

```powershell
npx nodemon src/services/store/index.js
```

## Endpoint chính

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/store/me` | Lấy thông tin cửa hàng của user hiện tại |
| `PUT` | `/store/me` | Cập nhật tên, số điện thoại, địa chỉ, logo |
| `GET` | `/store/bank` | Lấy cấu hình ngân hàng/VietQR |
| `PUT` | `/store/bank` | Cập nhật cấu hình ngân hàng |
| `GET` | `/store/receipt` | Lấy mẫu hóa đơn |
| `PUT` | `/store/receipt` | Lưu mẫu hóa đơn |
| `GET` | `/store/pos-config` | Gói cấu hình cho POS Electron: store + bank + receipt |

## Mẫu hóa đơn

Receipt config lưu các trường chính:

```text
header
footer
showQR
showLogo
showTime
showTxnId
showStoreInfo
paperWidth
blocks
```

`blocks` là thứ tự các khối hóa đơn mà Portal setup, ví dụ:

```json
["header","storeInfo","divider","orderInfo","divider","items","total","qr","footer"]
```

POS Electron cache dữ liệu từ `/store/pos-config` để in hóa đơn theo mẫu đang lưu trong Portal.

## Thành phần chính

```text
controllers/     # store, bank, receipt handlers
services/        # business logic
repositories/    # query stores, bank_configs, receipt_configs
routes/          # khai báo endpoint
middlewares/     # validate, store context
database.js      # schema và kết nối DB store
```

## Event

Service publish realtime event khi cấu hình thay đổi:

```text
store.updated
store.bankUpdated
store.receiptUpdated
```

Gateway chuyển các event này thành:

```text
store:updated
store:bankUpdated
store:receiptUpdated
```

POS Electron nghe các event này để reload cấu hình cửa hàng, ngân hàng và mẫu hóa đơn.
