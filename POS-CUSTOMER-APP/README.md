# POS Customer App

Ung dung self-ordering cho khach trong restaurant mode. Khach co the xem menu, mo phien an theo ban, them mon va gui order vao he thong.

## Chay app

```powershell
cd D:\POS\Project1\POS-CUSTOMER-APP
npm.cmd install
npm.cmd run dev
```

Mo:

```text
http://localhost:3001
```

Ep port:

```powershell
$env:PORT=3005
npm.cmd run dev
```

## Phu thuoc backend

Can `POS-ENGINE` dang chay tai:

```text
http://localhost:4000/api
```

Customer App goi Customer Service qua Gateway:

```text
GET  /api/customer/bootstrap
GET  /api/customer/menu
GET  /api/customer/dining-sessions
POST /api/customer/dining-sessions
GET  /api/customer/dining-sessions/:id
POST /api/customer/dining-sessions/:id/orders
POST /api/customer/dining-sessions/:id/close
```

Gateway cung co public routes tuong duong:

```text
GET  /api/public/menu?storeId=1
GET  /api/public/dining-sessions
POST /api/public/dining-sessions
```

## Luong su dung

1. App load bootstrap va menu.
2. Khach chon ban hoac mo dining session.
3. Khach them mon/topping vao gio.
4. App gui order vao dining session.
5. Kitchen App doc session/order de bep xu ly.
6. POS/Portal co the theo doi giao dich va dong phien khi thanh toan.

## Cau truc

```text
POS-CUSTOMER-APP/
  index.html
  server.js
  src/
    components/
    pages/
    shared/
    main.js
    styles.css
```

## Ghi chu

- Day la static SPA duoc serve bang `server.js`.
- API base hien hard-code trong `src/shared/api.js`: `http://localhost:4000/api/customer`.
- Neu khong thay menu, kiem tra Product Service va du lieu seed trong `POS-ENGINE`.
