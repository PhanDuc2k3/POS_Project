# Print Service

Service quan ly may in, template hoa don, print job va auto-print khi giao dich thanh toan thanh cong.

## Port va route

```text
Service port: 4005
Internal base: /
Gateway base:  /api/print
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npx.cmd nodemon src/services/print/index.js
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/health` | `/api/print/health` | Health check |
| `GET` | `/printers` | `/api/print/printers` | Danh sach may in |
| `POST` | `/printers` | `/api/print/printers` | Tao cau hinh may in |
| `PUT` | `/printers/:id` | `/api/print/printers/:id` | Cap nhat may in |
| `DELETE` | `/printers/:id` | `/api/print/printers/:id` | Xoa may in |
| `POST` | `/printers/:id/test` | `/api/print/printers/:id/test` | In test |
| `GET` | `/templates` | `/api/print/templates` | Danh sach template |
| `GET` | `/templates/default` | `/api/print/templates/default` | Template mac dinh |
| `POST` | `/templates` | `/api/print/templates` | Tao/cap nhat template |
| `PUT` | `/templates/:id` | `/api/print/templates/:id` | Cap nhat template |
| `DELETE` | `/templates/:id` | `/api/print/templates/:id` | Xoa template |
| `POST` | `/templates/preview` | `/api/print/templates/preview` | Preview template |
| `GET` | `/jobs` | `/api/print/jobs` | Danh sach print job |
| `GET` | `/jobs/:id` | `/api/print/jobs/:id` | Chi tiet job |
| `POST` | `/jobs` | `/api/print/jobs` | Tao job in |
| `POST` | `/jobs/:id/retry` | `/api/print/jobs/:id/retry` | Retry job |
| `POST` | `/jobs/:id/cancel` | `/api/print/jobs/:id/cancel` | Huy job |
| `POST` | `/jobs/:id/result` | `/api/print/jobs/:id/result` | Cap nhat ket qua in |

## Auto-print flow

1. Subscribe event `transaction.paid`.
2. Lay store/receipt config.
3. Tao print job va payload.
4. Goi Gateway `/internal/print-job` voi internal token.
5. Gateway day `print:job` den POS Electron.
6. Electron in va tra `device:printResult`.
7. Gateway goi `/jobs/:id/result`.

## Che do in

```text
DEVICE_AGENT  # uu tien, in qua POS Electron gan may in USB
SERVICE_SIDE  # fallback/dev, service tu in truc tiep
```

## Thanh phan

```text
controllers/
services/
repositories/
routes/
events/
jobs/
templates/
validators/
database.js
```

## Ghi chu

- Mau hoa don thuc te cua POS lay tu Store Service receipt config.
- Neu in khong dung mau, kiem tra log Electron `Print job payload summary`.
