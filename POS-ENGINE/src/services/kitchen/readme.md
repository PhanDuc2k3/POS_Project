# Kitchen Service

Service facade cho POS Kitchen App. Service tra ve bootstrap, danh sach session va chi tiet session/order cho man hinh bep.

## Port va route

```text
Service port: 4008
Internal base: /kitchen
Gateway base:  /api/kitchen
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd run dev:kitchen
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/kitchen/bootstrap` | `/api/kitchen/bootstrap` | Du lieu khoi tao app |
| `GET` | `/kitchen/sessions` | `/api/kitchen/sessions` | Danh sach dining session |
| `GET` | `/kitchen/sessions/:id` | `/api/kitchen/sessions/:id` | Chi tiet session |

## Lien ket service

Kitchen Service doc chu yeu tu Transaction Service:

```text
dining sessions
session orders
order items
```

## Ghi chu

- Gateway hien forward `/api/kitchen/*` khong bat JWT de man hinh bep local co the doc nhanh.
- Kitchen App hard-code base `http://localhost:4000/api/kitchen`.
- Neu danh sach trong, tao session/order tu Customer App truoc.
