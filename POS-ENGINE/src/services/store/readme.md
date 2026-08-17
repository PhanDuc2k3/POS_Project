# Store Service

Service quan ly thong tin cua hang, cau hinh ngan hang/VietQR va mau hoa don cho Portal, POS Electron va Print Service.

## Port va route

```text
Service port: 4002
Internal base: /store
Gateway base:  /api/store
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm.cmd run dev:store
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/store/me` | `/api/store/me` | Lay thong tin cua hang cua user |
| `PUT` | `/store/me` | `/api/store/me` | Cap nhat store profile |
| `GET` | `/store/bank` | `/api/store/bank` | Lay cau hinh ngan hang |
| `PUT` | `/store/bank` | `/api/store/bank` | Cap nhat ngan hang/VietQR |
| `GET` | `/store/receipt` | `/api/store/receipt` | Lay mau hoa don |
| `PUT` | `/store/receipt` | `/api/store/receipt` | Luu mau hoa don |
| `GET` | `/store/pos-config` | `/api/store/pos-config` | Gom store + bank + receipt cho POS |

## Receipt config

Receipt config thuong gom:

```text
header
footer
showQR
showLogo
showTime
showTxnId
showStoreInfo
paperWidth
blocks
```

`blocks` quyet dinh thu tu hien thi tren hoa don, vi du:

```json
["header","storeInfo","divider","orderInfo","items","total","qr","footer"]
```

## Event

Service publish:

```text
store.updated
store.bankUpdated
store.receiptUpdated
```

Gateway broadcast thanh:

```text
store:updated
store:bankUpdated
store:receiptUpdated
```

## Ghi chu

- Khi user login, Store Service co logic dam bao store mac dinh ton tai.
- POS Electron cache `/store/pos-config` de in hoa don.
- Print Service doc store/receipt config khi tao auto-print job.
