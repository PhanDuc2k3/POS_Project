# POS Portal

Portal React/Vite cho chu cua hang quan ly van hanh POS: dashboard, san pham, don hang, store profile, cau hinh ngan hang, mau hoa don, profile va activity log.

## Chay app

```powershell
cd D:\POS\Project1\POS-PORTAL
npm.cmd install
npm.cmd run dev
```

Mo:

```text
http://localhost:3000
```

## Phu thuoc backend

Can `POS-ENGINE` dang chay:

```text
http://localhost:4000/api
```

Cau hinh mac dinh:

```text
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Co the override khi chay:

```powershell
$env:VITE_API_URL="http://localhost:4000/api"
$env:VITE_SOCKET_URL="http://localhost:4000"
npm.cmd run dev
```

## Tai khoan demo

```text
username: admin
password: admin123
```

## Tinh nang chinh

- Dashboard doanh thu va top san pham.
- Quan ly giao dich/order.
- Quan ly danh muc, san pham, topping va menu.
- Cau hinh cua hang, ngan hang/VietQR va mau hoa don.
- Ho so tai khoan, doi mat khau, avatar.
- Activity log va session.
- Realtime qua Socket.IO.

## API su dung

```text
/api/auth/*
/api/store/*
/api/product/*
/api/txn/*
/api/print/*
/api/realtime/status
```

## Cau truc

```text
POS-PORTAL/
  index.html
  vite.config.js
  src/
    components/
    constants/
    contexts/
    hooks/
    pages/
    services/
    styles/
    main.jsx
    App.jsx
```

## Ghi chu

- Portal dung Vite port `3000`.
- Token duoc xu ly trong service/client va auth context.
- Khi sua UI, uu tien giu style trong `src/styles/global.css` va CSS theo page/component san co.
