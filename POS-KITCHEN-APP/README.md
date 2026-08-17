# POS Kitchen App

Man hinh bep/bar cho restaurant mode. App hien danh sach dining session va chi tiet order de nhan vien bep theo doi mon dang can xu ly.

## Chay app

```powershell
cd D:\POS\Project1\POS-KITCHEN-APP
npm.cmd install
npm.cmd run dev
```

Mo:

```text
http://localhost:3002
```

Ep port:

```powershell
$env:PORT=3006
npm.cmd run dev
```

## Phu thuoc backend

Can `POS-ENGINE` dang chay tai:

```text
http://localhost:4000/api
```

Kitchen App goi Kitchen Service qua Gateway:

```text
GET /api/kitchen/bootstrap
GET /api/kitchen/sessions
GET /api/kitchen/sessions/:id
```

Gateway cung co public dining session routes:

```text
GET /api/public/dining-sessions
GET /api/public/dining-sessions/:id
```

## Luong su dung

1. Customer App hoac POS tao dining session/order.
2. Kitchen App load danh sach session dang mo.
3. Nhan vien bep chon session de xem chi tiet mon.
4. Khi order thay doi, refresh man hinh de lay trang thai moi nhat.

## Cau truc

```text
POS-KITCHEN-APP/
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
- API base hien hard-code trong `src/shared/api.js`: `http://localhost:4000/api/kitchen`.
- Neu khong co session nao, hay tao phien tu Customer App truoc.
