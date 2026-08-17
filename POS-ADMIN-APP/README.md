# POS Admin App

Ung dung web tinh cho chu nen tang quan ly goi dich vu, tenant, order, account, permission va trial request.

## Chay app

```powershell
cd D:\POS\Project1\POS-ADMIN-APP
npm.cmd install
npm.cmd run dev
```

Mo:

```text
http://localhost:3003
```

Neu port `3003` dang ban va khong set `PORT`, server tu thu port tiep theo, thuong la `3004`.

Ep port:

```powershell
$env:PORT=3004
npm.cmd run dev
```

## Phu thuoc backend

Can `POS-ENGINE` dang chay:

```text
http://localhost:4000/api
```

Admin app goi cac nhom API:

```text
/api/auth/login
/api/platform/bootstrap
/api/platform/summary
/api/platform/tenants
/api/platform/packages
/api/platform/accounts
/api/platform/orders
/api/platform/permissions/:role
/api/platform/trial-requests
```

Cac route `/api/platform/*` yeu cau user co role `platform_admin`.

## Tai khoan demo

```text
username: platform
password: platform123
role: platform_admin
```

## Tinh nang chinh

- Dashboard tong quan nen tang.
- Quan ly tenant va trang thai tenant.
- Quan ly package/goi dich vu.
- Quan ly account va invite account demo.
- Quan ly order cua nen tang.
- Quan ly permission theo role.
- Duyet trial request tu Marketing Website.

## Trial request flow

1. Khach dang nhap tren `POS-MARKETING-WEBSITE`.
2. Khach gui form trial request.
3. Platform Service luu request o trang thai pending.
4. Admin vao `Requests`.
5. Admin approve hoac reject.
6. Khi approve, Platform Service tao tenant va account owner cho Portal.
7. Admin gui username/password duoc tao cho khach.

## Cau truc

```text
POS-ADMIN-APP/
  index.html
  server.js
  src/
    components/
    pages/
    services/
    utils/
    main.js
    styles.css
```

## Ghi chu

- Day la static SPA duoc serve bang `server.js`, khong dung Vite.
- Neu login that bai, kiem tra Engine/Gateway co dang chay khong.
- Gateway da cho phep origin `3003` va `3004` mac dinh.
