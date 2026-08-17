# Platform Service

Service cho lop platform owner: quan ly tenant, package, account, order nen tang, permission va trial request tu Marketing Website.

## Port va route

```text
Service port: 4006
Internal base: /platform
Gateway base:  /api/platform
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd run dev:platform
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/platform/bootstrap` | `/api/platform/bootstrap` | Du lieu khoi tao Admin App |
| `GET` | `/platform/summary` | `/api/platform/summary` | Dashboard summary |
| `GET` | `/platform/tenants` | `/api/platform/tenants` | Danh sach tenant |
| `PUT` | `/platform/tenants/:id/package` | `/api/platform/tenants/:id/package` | Doi package tenant |
| `POST` | `/platform/tenants/:id/toggle-status` | `/api/platform/tenants/:id/toggle-status` | Bat/tat tenant |
| `GET` | `/platform/packages` | `/api/platform/packages` | Danh sach package |
| `GET` | `/platform/accounts` | `/api/platform/accounts` | Danh sach account |
| `POST` | `/platform/accounts/invite` | `/api/platform/accounts/invite` | Invite account |
| `GET` | `/platform/orders` | `/api/platform/orders` | Order nen tang |
| `POST` | `/platform/orders` | `/api/platform/orders` | Tao order nen tang |
| `GET` | `/platform/permissions/:role` | `/api/platform/permissions/:role` | Lay permission role |
| `PATCH` | `/platform/permissions/:role` | `/api/platform/permissions/:role` | Toggle permission |
| `GET` | `/platform/trial-requests` | `/api/platform/trial-requests` | Danh sach trial request |
| `GET` | `/platform/trial-requests/me` | `/api/platform/trial-requests/me` | Trial request cua user hien tai |
| `POST` | `/platform/trial-requests` | `/api/platform/trial-requests` | Gui trial request |
| `POST` | `/platform/trial-requests/:id/approve` | `/api/platform/trial-requests/:id/approve` | Duyet trial request |
| `POST` | `/platform/trial-requests/:id/reject` | `/api/platform/trial-requests/:id/reject` | Tu choi trial request |

## Auth

- `/api/platform/trial-requests` va `/api/platform/trial-requests/me` can JWT.
- Cac route admin con lai can JWT va role `platform_admin`.
- Tai khoan seed: `platform / platform123`.

## Ghi chu

- Marketing Website gui trial request vao service nay.
- POS Admin App doc bootstrap/summary va duyet request.
- Khi approve request, service tao tenant/account demo va luu username/password portal cho request.
