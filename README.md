# POS System

Hệ thống POS quản lý bán hàng dành cho cửa hàng nhỏ, quán ăn, cà phê hoặc mô hình bán lẻ cần bán hàng tại quầy, quản trị menu, theo dõi giao dịch, in hóa đơn và thanh toán chuyển khoản bằng VietQR/SePay.

Dự án gồm 3 phần chính:

- `POS-ENGINE`: backend Node.js, API Gateway, WebSocket, SQLite và các service nghiệp vụ.
- `POS-PORTAL`: trang quản trị web cho chủ cửa hàng.
- `POS-ELECTRON`: app bán hàng tại quầy, chạy bằng Electron và đóng vai trò Device Agent để nhận lệnh in.

## Tính năng chính

- Đăng nhập, refresh token, quản lý phiên đăng nhập và câu hỏi bảo mật.
- Quản lý thông tin cửa hàng, mẫu hóa đơn và tài khoản ngân hàng nhận tiền.
- Quản lý sản phẩm, danh mục, topping và hình ảnh món ăn.
- Bán hàng tại quầy trên app Electron.
- Thanh toán tiền mặt hoặc chuyển khoản VietQR.
- Tự xác nhận thanh toán chuyển khoản qua webhook SePay.
- Dashboard doanh thu, giao dịch, top sản phẩm.
- In hóa đơn qua app Electron hoặc fallback từ Print Service.
- Realtime bằng Socket.IO giữa Portal, Electron và Gateway.

## Kiến trúc tổng quan

```text
POS-PORTAL             POS-ELECTRON
React/Vite             Electron POS App
Admin Web              Device Agent + Printer
     |                        |
     | HTTP/WebSocket         | HTTP/WebSocket
     +-----------+------------+
                 |
          POS-ENGINE Gateway
          localhost:4000
                 |
   +-------------+-------------+-------------+-------------+-------------+
   |             |             |             |             |             |
 Auth          Store      Transaction     Product        Print       WebSocket
 :4001         :4002         :4003         :4004         :4005       Device Registry
```

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Backend | Node.js, Express, SQLite/sql.js, JWT, bcryptjs, Winston |
| Gateway | Express, Socket.IO, API forwarding, Device Registry |
| Portal | React 18, Vite, React Router, Recharts, Lucide React |
| Electron | Electron 32, Socket.IO Client |
| In hóa đơn | ESC/POS, TCP network printer, Windows shared printer |
| Thanh toán | VietQR, SePay webhook |

## Yêu cầu môi trường

- Node.js 18 trở lên.
- npm 9 trở lên.
- Windows nếu muốn build/chạy app Electron và test máy in USB/Windows.
- Ngrok nếu muốn test webhook SePay từ internet về máy local.

Kiểm tra nhanh:

```powershell
node -v
npm -v
```

## Cài đặt lần đầu

Chạy lần lượt trong từng thư mục:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm install

cd D:\POS\Project1\POS-PORTAL
npm install

cd D:\POS\Project1\POS-ELECTRON
npm install
```

## Chạy dự án local

### 1. Chạy backend

Mở terminal tại thư mục `POS-ENGINE`:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm run dev
```

Backend sẽ chạy các service:

| Service | Port | Mô tả |
| --- | --- | --- |
| Gateway | `4000` | API chính, WebSocket, Device Registry |
| Auth | `4001` | Đăng nhập, refresh token, session |
| Store | `4002` | Cửa hàng, ngân hàng, mẫu hóa đơn |
| Transaction | `4003` | Đơn hàng, giao dịch, dashboard, SePay webhook |
| Product | `4004` | Sản phẩm, danh mục, topping |
| Print | `4005` | Print queue, template, printer fallback |

Kiểm tra backend:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:4000/health
```

Kết quả đúng:

```json
{"status":"ok","gateway":true}
```

### 2. Chạy Portal

Mở terminal khác tại thư mục `POS-PORTAL`:

```powershell
cd D:\POS\Project1\POS-PORTAL
npm run dev
```

Mở trình duyệt:

```text
http://localhost:3000
```

Portal mặc định gọi API qua:

```text
http://localhost:4000/api
```

Có thể override bằng `.env` trong `POS-PORTAL`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

### 3. Chạy Electron POS

Mở terminal khác tại thư mục `POS-ELECTRON`:

```powershell
cd D:\POS\Project1\POS-ELECTRON
npm start
```

Chạy dev có DevTools:

```powershell
npm run dev
```

Build file portable:

```powershell
npm run build:portable
```

File build nằm tại:

```text
POS-ELECTRON\build-output\POS-BanHang-Portable-1.0.0.exe
```

## Tài khoản mặc định

| Tên đăng nhập | Mật khẩu | Quyền |
| --- | --- | --- |
| `admin` | `admin123` | Chủ cửa hàng |

Câu hỏi bảo mật mặc định:

```text
Món ăn yêu thích của bạn là gì?
```

Đáp án:

```text
bunbo
```

## Cấu trúc thư mục

```text
Project1/
├── POS-ENGINE/
│   ├── src/
│   │   ├── gateway/             API Gateway, WebSocket, Device Registry
│   │   ├── shared/              Config, logger, JWT, event bus, timezone
│   │   └── services/
│   │       ├── auth/            Đăng nhập, token, session, profile
│   │       ├── store/           Cửa hàng, ngân hàng, hóa đơn
│   │       ├── transaction/     Đơn hàng, dashboard, SePay webhook
│   │       ├── product/         Menu, danh mục, topping
│   │       └── print/           Print queue, template, printer service
│   ├── data/                    SQLite databases local
│   └── docs/                    Tài liệu test riêng
│
├── POS-PORTAL/
│   └── src/
│       ├── components/          Layout, sidebar, toast, shared UI
│       ├── contexts/            Auth context
│       ├── pages/               Dashboard, Products, Transactions, Settings...
│       └── services/            API client
│
├── POS-ELECTRON/
│   ├── main.js                  Main process, Device Agent, printer IPC
│   ├── preload.js               Bridge API cho renderer
│   ├── renderer/                Giao diện bán hàng
│   ├── printer/                 ESC/POS formatter và driver in
│   └── printer-config.json      Cấu hình máy in local
│
└── POS-APP/                     Thư mục dự phòng
```

## Luồng bán hàng

1. Thu ngân đăng nhập trên Electron.
2. Electron lấy menu từ backend.
3. Thu ngân chọn món, topping và tạo đơn.
4. Nếu thanh toán tiền mặt, đơn được xác nhận ngay.
5. Nếu thanh toán chuyển khoản, Electron tạo mã VietQR và chờ webhook.
6. SePay hoặc Postman gửi webhook về Gateway.
7. Transaction Service đối chiếu mã đơn, số tiền, tài khoản nhận.
8. Khi khớp, đơn chuyển sang đã thanh toán.
9. Electron nhận realtime event, đóng QR và hiển thị thanh toán thành công.
10. Hóa đơn được in qua Electron Device Agent.

## Cấu hình ngân hàng và VietQR

Vào Portal:

```text
Cài đặt -> Cấu hình ngân hàng
```

Nhập các thông tin thật:

- Ngân hàng.
- BIN ngân hàng.
- Số tài khoản.
- Tên chủ tài khoản.
- Nội dung/mẫu mã thanh toán nếu cần.

Electron sẽ dùng cấu hình này để tạo mã QR chuyển khoản cho đơn hàng.

## Test SePay local

### Cách 1: Test bằng Postman

Khi Electron hiển thị QR chuyển khoản, app sẽ log sẵn thông tin body mẫu để gửi webhook.

Gửi request:

```text
POST http://localhost:4000/api/payment-webhooks/sepay
Content-Type: application/json
```

Body mẫu:

```json
{
  "id": 12345,
  "gateway": "MBBank",
  "transactionDate": "2026-08-11 10:30:00",
  "accountNumber": "0123456789",
  "code": "POS20260811001",
  "content": "POS20260811001 thanh toan",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 100000,
  "referenceCode": "SB1A2B3C4D5E",
  "accumulated": 5000000
}
```

Kết quả đúng:

```json
{"success":true,"matched":true,"orderId":1}
```

### Cách 2: Test bằng SePay dashboard và ngrok

Chạy backend:

```powershell
cd D:\POS\Project1\POS-ENGINE
$env:SEPAY_WEBHOOK_API_KEY="dev-sepay-secret"
npm start
```

Chạy ngrok:

```powershell
ngrok http 4000
```

Lấy URL dạng:

```text
https://your-domain.ngrok-free.dev
```

Cấu hình webhook trong SePay:

```text
https://your-domain.ngrok-free.dev/api/payment-webhooks/sepay
```

Nếu bật API key trên backend, header gửi từ SePay cần khớp:

```text
Authorization: Apikey dev-sepay-secret
```

Biến môi trường liên quan:

```env
SEPAY_WEBHOOK_API_KEY=dev-sepay-secret
SEPAY_WEBHOOK_HMAC_SECRET=
SEPAY_ACCOUNT_NUMBER=
```

Ghi chú:

- Local demo có thể bỏ `SEPAY_WEBHOOK_API_KEY` để test nhanh bằng Postman.
- Khi lên production nên bật API key hoặc HMAC secret.
- `SEPAY_ACCOUNT_NUMBER` dùng để ép webhook chỉ nhận đúng số tài khoản mong muốn.

## Máy in

Electron là hướng in chính trong dự án.

Luồng in chuẩn:

```text
Print Service -> Gateway -> WebSocket -> POS-ELECTRON -> Máy in
```

Các kiểu máy in đang hỗ trợ:

- `network`: máy in LAN/TCP, thường dùng port `9100`.
- `windows`: máy in đã cài trong Windows Printers.
- `usb`: in raw qua tên máy in Windows/shared printer.
- `mock`: dùng để test không cần máy in thật.

Cấu hình Electron nằm tại:

```text
POS-ELECTRON\printer-config.json
```

Ví dụ máy in mạng:

```json
{
  "type": "network",
  "host": "192.168.1.100",
  "port": 9100,
  "printerName": "",
  "paperWidth": 80,
  "autoPrint": true,
  "openDrawer": false
}
```

Ví dụ máy in Windows:

```json
{
  "type": "windows",
  "host": "",
  "port": 9100,
  "printerName": "XP-80C",
  "paperWidth": 80,
  "autoPrint": true,
  "openDrawer": false
}
```

## Các lệnh thường dùng

### POS-ENGINE

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy toàn bộ backend bằng nodemon |
| `npm start` | Chạy toàn bộ backend bằng node |
| `npm run dev:gateway` | Chạy riêng Gateway |
| `npm run dev:auth` | Chạy riêng Auth Service |
| `npm run dev:store` | Chạy riêng Store Service |

### POS-PORTAL

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Build production |
| `npm run preview` | Preview bản build |

### POS-ELECTRON

| Lệnh | Mô tả |
| --- | --- |
| `npm start` | Chạy app Electron |
| `npm run dev` | Chạy app Electron với dev flag |
| `npm run build` | Build bằng electron-builder |
| `npm run build:win` | Build bản Windows |
| `npm run build:portable` | Build file portable `.exe` |

## Reset nhanh Electron trên Windows

Nếu Electron bị kẹt process khi test, có thể đóng app bằng:

```powershell
Get-Process | Where-Object { $_.ProcessName -like '*POS*' -or $_.ProcessName -eq 'electron' } | Stop-Process -Force
```

Sau đó chạy lại:

```powershell
cd D:\POS\Project1\POS-ELECTRON
npm start
```

## Troubleshooting

### Portal báo `401 Unauthorized` ở `/api/auth/me`

Kiểm tra:

- Backend Gateway `http://localhost:4000/health` có chạy không.
- Portal có gọi đúng `VITE_API_URL` không.
- Access token/refresh token trong browser còn hợp lệ không.
- Nếu vẫn lỗi, logout và đăng nhập lại bằng `admin/admin123`.

### Portal hoặc Electron không gọi được API

Kiểm tra backend trước:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:4000/health
```

Nếu port `4000` bị chiếm, tắt process cũ hoặc đổi `GATEWAY_PORT`.

### QR hiển thị nhưng không tự thanh toán

Kiểm tra:

- Webhook gửi đúng endpoint `/api/payment-webhooks/sepay`.
- `code` hoặc `content` có chứa mã đơn dạng `POS...`.
- `transferAmount` khớp số tiền đơn hàng.
- `accountNumber` khớp tài khoản ngân hàng đã cấu hình.
- Nếu có `SEPAY_WEBHOOK_API_KEY`, header phải là `Authorization: Apikey <key>`.

### Máy in không in

Kiểm tra:

- Electron đang mở và đã đăng nhập.
- Electron đã load đúng store config.
- Máy in đã bật và cùng mạng nếu dùng `network`.
- `printer-config.json` đúng `type`, `host`, `port` hoặc `printerName`.
- Test bằng `mock` trước để xác nhận print queue không lỗi.

## Ghi chú production

Khi deploy production nên cấu hình lại:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PORTAL_ORIGIN`
- `SEPAY_WEBHOOK_API_KEY`
- `SEPAY_WEBHOOK_HMAC_SECRET`
- `SEPAY_ACCOUNT_NUMBER`
- Database/storage phù hợp thay vì phụ thuộc toàn bộ vào dữ liệu local.
- HTTPS/domain thật cho webhook SePay thay vì ngrok.

## Tài liệu thêm

Tài liệu test SePay local:

```text
POS-ENGINE\docs\sepay-local-test.md
```
# POS_Project
