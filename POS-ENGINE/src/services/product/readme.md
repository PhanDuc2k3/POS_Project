# Product Service

Service quan ly danh muc, san pham, nhom topping, topping va menu ban hang.

## Port va route

```text
Service port: 4004
Internal base: /product
Gateway base:  /api/product
Public menu:   /api/public/menu
```

Chay rieng:

```powershell
cd D:\POS\Project1\POS-ENGINE
npx.cmd nodemon src/services/product/index.js
```

Seed menu demo:

```powershell
node src/services/product/seed-demo-menu.js
```

## Endpoint

| Method | Internal route | Gateway route | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/product/categories` | `/api/product/categories` | Danh sach danh muc |
| `POST` | `/product/categories` | `/api/product/categories` | Tao danh muc |
| `PUT` | `/product/categories/:id` | `/api/product/categories/:id` | Cap nhat danh muc |
| `DELETE` | `/product/categories/:id` | `/api/product/categories/:id` | Xoa danh muc |
| `GET` | `/product/products` | `/api/product/products` | Danh sach san pham |
| `POST` | `/product/products` | `/api/product/products` | Tao san pham |
| `PUT` | `/product/products/:id` | `/api/product/products/:id` | Cap nhat san pham |
| `DELETE` | `/product/products/:id` | `/api/product/products/:id` | Xoa san pham |
| `PATCH` | `/product/products/:id/toggle` | `/api/product/products/:id/toggle` | Bat/tat san pham |
| `POST` | `/product/products/:id/topping-groups` | `/api/product/products/:id/topping-groups` | Gan nhom topping |
| `DELETE` | `/product/products/:id/topping-groups/:groupId` | `/api/product/products/:id/topping-groups/:groupId` | Go nhom topping |
| `GET` | `/product/topping-groups` | `/api/product/topping-groups` | Danh sach nhom topping |
| `POST` | `/product/topping-groups` | `/api/product/topping-groups` | Tao nhom topping |
| `PUT` | `/product/topping-groups/:id` | `/api/product/topping-groups/:id` | Cap nhat nhom topping |
| `DELETE` | `/product/topping-groups/:id` | `/api/product/topping-groups/:id` | Xoa nhom topping |
| `POST` | `/product/toppings` | `/api/product/toppings` | Tao topping |
| `PUT` | `/product/toppings/:id` | `/api/product/toppings/:id` | Cap nhat topping |
| `DELETE` | `/product/toppings/:id` | `/api/product/toppings/:id` | Xoa topping |
| `GET` | `/product/menu` | `/api/product/menu` | Menu cho POS/Portal |
| `GET` | `/product/public/menu` | `/api/public/menu` | Menu public cho Customer App |

## Event

```text
product.categoryCreated
product.created
product.updated
product.toppingUpdated
```

Gateway broadcast dang:

```text
product:created
product:updated
product:toppingUpdated
product:categoryCreated
```

## Ghi chu

- Database seed san menu demo khi can.
- POS Electron goi `/api/product/menu`.
- Customer App nen goi qua Customer Service hoac `/api/public/menu`.
