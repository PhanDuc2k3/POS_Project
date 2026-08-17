# Customer Service

Service facade cho POS Customer App. Service gom menu va dining session API theo shape phu hop voi man hinh khach tu goi mon.

## Port va route

```text
Service port: 4007
Internal base: /customer
Gateway base:  /api/customer
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd run dev:customer
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/customer/bootstrap` | `/api/customer/bootstrap` | Du lieu khoi tao app |
| `GET` | `/customer/menu` | `/api/customer/menu` | Menu public |
| `GET` | `/customer/dining-sessions` | `/api/customer/dining-sessions` | Danh sach phien an |
| `POST` | `/customer/dining-sessions` | `/api/customer/dining-sessions` | Tao phien an |
| `GET` | `/customer/dining-sessions/:id` | `/api/customer/dining-sessions/:id` | Chi tiet phien an |
| `POST` | `/customer/dining-sessions/:id/orders` | `/api/customer/dining-sessions/:id/orders` | Tao order trong phien |
| `POST` | `/customer/dining-sessions/:id/close` | `/api/customer/dining-sessions/:id/close` | Dong phien an |

## Lien ket service

Customer Service doc/ghi qua:

```text
Product Service      # menu
Transaction Service  # dining session va order
```

## Ghi chu

- Gateway hien forward `/api/customer/*` khong bat JWT de khach co the goi mon.
- Customer App hard-code base `http://localhost:4000/api/customer`.
- Neu menu rong, kiem tra Product Service va seed demo menu.
