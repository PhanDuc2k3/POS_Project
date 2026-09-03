# POS Admin App

Ung dung web tinh cho chu nen tang quan ly goi dich vu, tenant, order, account, permission, trial request, email va support ticket.

## Chay app

```powershell
cd D:\POS\Project1\POS-ADMIN-APP
npm.cmd install
npm.cmd run dev
```

Lenh dev dung `nodemon`, server tu restart khi sua `server.js`, `index.html` hoac `src/`.

Mo:

```text
http://localhost:8000
```

Neu port `8000` dang ban va khong set `PORT`, server tu thu port tiep theo, thuong la `8002` de tranh port Marketing.

Ep port:

```powershell
$env:PORT=8002
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
/api/platform/support-tickets
/api/platform/email/status
/api/platform/email/outbox
/api/platform/email/test
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
- Quan ly SMTP/email runtime, outbox local va gui email test.
- Quan ly support ticket: loc/tim ticket, doi trang thai va reply cho khach qua email.

## Trial/order flow

1. Khach dang nhap tren `POS-MARKETING-WEBSITE`.
2. Khach gui form trial request.
3. Platform Service luu request o trang thai pending.
4. Admin vao `Orders`.
5. Admin approve hoac reject.
6. Khi approve, Platform Service tao tenant va account owner cho Portal.
7. He thong gui email cap nhat trang thai don/activation cho khach.

## Support ticket flow

1. Khach dang ky/dang nhap tren Marketing Website `localhost:8001`.
2. Khach gui support ticket tu form lien he.
3. Admin vao `Tickets` tren `localhost:8000`.
4. Admin reply trong app; backend luu message va gui email cho khach.
5. Admin co the doi trang thai `OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `RESOLVED`, `CLOSED`.

## Email management

- Trang `Email` hien thi cau hinh SMTP runtime, outbox local va nut gui email test.
- Khong luu SMTP password tu browser. Cau hinh SMTP bang bien moi truong trong `POS-ENGINE`.
- Neu `SMTP_ENABLED=false`, email se vao `POS-ENGINE/data/mail-outbox`.

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
- Gateway da cho phep origin `8000` mac dinh.
