# POS Project

Monorepo POS local cho mo hinh ban le, cafe, nha hang va restaurant mode. Repo gom backend Node.js, portal quan ly, app admin nen tang, app POS Electron, man hinh khach goi mon, man hinh bep va website marketing.

## Thanh phan

| Thu muc | Vai tro | Mac dinh |
| --- | --- | --- |
| `POS-ENGINE` | Backend, API Gateway, WebSocket va cac service noi bo | Gateway `http://localhost:4000` |
| `POS-PORTAL` | Portal cho chu cua hang quan ly san pham, don hang, doanh thu, store config | `http://localhost:3000` |
| `POS-ELECTRON` | Ung dung POS tai quay va device agent de in hoa don | Electron desktop |
| `POS-ADMIN-APP` | Platform admin quan ly tenant, package, account, permission, trial request | `http://localhost:8000` |
| `POS-CUSTOMER-APP` | Man hinh khach tu goi mon theo ban/phien an | `http://localhost:3001` |
| `POS-KITCHEN-APP` | Man hinh bep/bar theo doi dining session va order | `http://localhost:3002` |
| `POS-MARKETING-WEBSITE` | Website marketing va form dang ky trial | `http://localhost:8001` |

## Cach chay nhanh

O root repo `D:\POS\Project1`, cai dependency root va chay tat ca:

```powershell
npm.cmd install
npm.cmd run dev
```

Root script dung `concurrently` de chay dong thoi:

```text
POS-ENGINE
POS-PORTAL
POS-ELECTRON
POS-ADMIN-APP
POS-CUSTOMER-APP
POS-KITCHEN-APP
POS-MARKETING-WEBSITE
```

Tren PowerShell Windows, neu `npm` bi chan do execution policy, dung `npm.cmd`.

## Cai dependency tung project

Neu may moi clone repo, hay cai dependency trong cac project co `package.json`:

```powershell
npm.cmd --prefix POS-ENGINE install
npm.cmd --prefix POS-PORTAL install
npm.cmd --prefix POS-ELECTRON install
npm.cmd --prefix POS-ADMIN-APP install
npm.cmd --prefix POS-CUSTOMER-APP install
npm.cmd --prefix POS-KITCHEN-APP install
npm.cmd --prefix POS-MARKETING-WEBSITE install
```

## Script root

| Lenh | Tac dung |
| --- | --- |
| `npm.cmd run dev` | Chay tat ca project con |
| `npm.cmd run dev:engine` | Chay rieng backend engine |
| `npm.cmd run dev:portal` | Chay rieng Portal |
| `npm.cmd run dev:electron` | Chay rieng Electron POS |
| `npm.cmd run dev:admin` | Chay rieng Platform Admin |
| `npm.cmd run dev:customer` | Chay rieng Customer App |
| `npm.cmd run dev:kitchen` | Chay rieng Kitchen App |
| `npm.cmd run dev:marketing` | Chay rieng Marketing Website |

## Port local

| Thanh phan | Port |
| --- | ---: |
| Marketing Website | `8001` |
| Portal | `3000` |
| Customer App | `3001` |
| Kitchen App | `3002` |
| Admin App | `8000`, tu nhay sang `8002` neu port ban |
| Gateway | `4000` |
| Auth Service | `4001` |
| Store Service | `4002` |
| Transaction Service | `4003` |
| Product Service | `4004` |
| Print Service | `4005` |
| Platform Service | `4006` |
| Customer Service | `4007` |
| Kitchen Service | `4008` |

## Tai khoan demo

| App | Username | Password | Role |
| --- | --- | --- | --- |
| POS Portal / Electron | `admin` | `admin123` | store admin |
| Platform Admin | `platform` | `platform123` | platform admin |

## Luong chinh

1. `POS-ENGINE` chay gateway va cac service backend.
2. Portal/Electron/Admin/Customer/Kitchen/Marketing goi API qua `http://localhost:4000/api`.
3. Electron ket noi Socket.IO den `http://localhost:4000` sau khi dang nhap.
4. Khi giao dich thanh toan thanh cong, Transaction Service publish event, Print Service tao job, Gateway day `print:job` den Electron de in hoa don.
5. Customer App tao dining session va order; Kitchen App doc session/order de bep xu ly.
6. Marketing Website gui trial request; Platform Admin duyet va tao tenant/account.

## Tai lieu chi tiet

- [POS-ENGINE/readme.md](POS-ENGINE/readme.md)
- [POS-PORTAL/README.md](POS-PORTAL/README.md)
- [POS-ELECTRON/README.md](POS-ELECTRON/README.md)
- [POS-ADMIN-APP/README.md](POS-ADMIN-APP/README.md)
- [POS-CUSTOMER-APP/README.md](POS-CUSTOMER-APP/README.md)
- [POS-KITCHEN-APP/README.md](POS-KITCHEN-APP/README.md)
- [POS-MARKETING-WEBSITE/README.md](POS-MARKETING-WEBSITE/README.md)
- [POS-ENGINE/src/services/auth/readme.md](POS-ENGINE/src/services/auth/readme.md)
- [POS-ENGINE/src/gateway/readme.md](POS-ENGINE/src/gateway/readme.md)
- [POS-ENGINE/src/services/store/readme.md](POS-ENGINE/src/services/store/readme.md)
- [POS-ENGINE/src/services/transaction/readme.md](POS-ENGINE/src/services/transaction/readme.md)
- [POS-ENGINE/src/services/product/readme.md](POS-ENGINE/src/services/product/readme.md)
- [POS-ENGINE/src/services/print/readme.md](POS-ENGINE/src/services/print/readme.md)
- [POS-ENGINE/src/services/platform/readme.md](POS-ENGINE/src/services/platform/readme.md)
- [POS-ENGINE/src/services/customer/readme.md](POS-ENGINE/src/services/customer/readme.md)
- [POS-ENGINE/src/services/kitchen/readme.md](POS-ENGINE/src/services/kitchen/readme.md)

## Luu y phat trien

- Giai doan hien tai chay local bang npm, chua can Docker.
- Du lieu runtime nam trong `POS-ENGINE/data`; log nam trong `POS-ENGINE/logs`.
- Khi sua API, test qua Gateway de giong cach app that su dung.
- Khi sua in hoa don, kiem tra dong thoi Transaction Service, Print Service, Gateway WebSocket va POS Electron.
