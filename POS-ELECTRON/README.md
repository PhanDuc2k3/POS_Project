# POS Electron

Ung dung desktop POS tai quay. App vua la giao dien ban hang vua la device agent de dang ky thiet bi, nhan print job realtime va in hoa don tren may in cuc bo.

## Chay app

```powershell
cd D:\POS\Project1\POS-ELECTRON
npm.cmd install
npm.cmd run dev
```

Lenh khac:

```powershell
npm.cmd start
npm.cmd run build
npm.cmd run build:win
npm.cmd run build:portable
```

## Phu thuoc backend

Can `POS-ENGINE` dang chay:

```text
http://localhost:4000/api
http://localhost:4000  # Socket.IO
```

Renderer API hien goi:

```text
POST /api/auth/login
POST /api/auth/refresh
GET  /api/product/menu
GET  /api/store/pos-config
POST /api/txn/orders
GET  /api/txn/orders/:id
POST /api/txn/orders/:id/mark-paid
POST /api/txn/orders/:id/cancel
```

## Tai khoan demo

```text
username: admin
password: admin123
```

## Device agent

Sau khi user dang nhap, app ket noi Socket.IO den Gateway va emit:

```text
device:register
device:heartbeat
device:printResult
```

App nghe:

```text
print:job
product:created
product:updated
product:toppingUpdated
store:updated
store:bankUpdated
store:receiptUpdated
transaction:created
transaction:paid
dashboard:refresh
```

## In hoa don

- Store/bank/receipt config duoc lay tu `/api/store/pos-config`.
- Print job tu Print Service di qua Gateway bang WebSocket.
- Electron format receipt va in bang module trong `printer/`.
- Ket qua in duoc gui lai Gateway bang `device:printResult`.

## Cau truc

```text
POS-ELECTRON/
  main.js
  preload.js
  printer/
  renderer/
  assets/
  printer-config.json
```

## Build icon

Doc them [assets/README.md](assets/README.md) de biet ten file icon can dat vao `assets/`.
