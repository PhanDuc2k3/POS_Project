# Product Service

Service quản lý danh mục, sản phẩm, nhóm topping, topping và menu bán hàng cho POS Electron.

## Port

```text
4004
```

Khi chạy qua Gateway, public route là:

```text
/api/product/*
```

Route nội bộ của service:

```text
/product/*
```

## Chạy riêng service

```powershell
cd D:\POS\Project1\POS-ENGINE
npx nodemon src/services/product/index.js
```

Seed menu demo nếu cần:

```powershell
node src/services/product/seed-demo-menu.js
```

## Endpoint chính

### Category

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/product/categories` | Danh sách danh mục |
| `POST` | `/product/categories` | Tạo danh mục |
| `PUT` | `/product/categories/:id` | Cập nhật danh mục |
| `DELETE` | `/product/categories/:id` | Xóa danh mục |

### Product

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/product/products` | Danh sách sản phẩm |
| `POST` | `/product/products` | Tạo sản phẩm |
| `PUT` | `/product/products/:id` | Cập nhật sản phẩm |
| `DELETE` | `/product/products/:id` | Xóa sản phẩm |
| `PATCH` | `/product/products/:id/toggle` | Bật/tắt sản phẩm |
| `POST` | `/product/products/:id/topping-groups` | Gắn nhóm topping vào sản phẩm |
| `DELETE` | `/product/products/:id/topping-groups/:groupId` | Gỡ nhóm topping khỏi sản phẩm |

### Topping

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/product/topping-groups` | Danh sách nhóm topping |
| `POST` | `/product/topping-groups` | Tạo nhóm topping |
| `PUT` | `/product/topping-groups/:id` | Cập nhật nhóm topping |
| `DELETE` | `/product/topping-groups/:id` | Xóa nhóm topping |
| `POST` | `/product/toppings` | Tạo topping |
| `PUT` | `/product/toppings/:id` | Cập nhật topping |
| `DELETE` | `/product/toppings/:id` | Xóa topping |

### Menu POS

| Method | Route | Mô tả |
| --- | --- | --- |
| `GET` | `/product/menu` | Trả về categories + products + topping groups cho POS Electron |

## Thành phần chính

```text
controllers/     # HTTP handlers
services/        # business logic
repositories/    # query category/product/topping
routes/          # khai báo endpoint
database.js      # schema và kết nối DB product
seed-demo-menu.js
```

## Event

Product Service publish event để Portal/POS reload dữ liệu:

```text
product.categoryCreated
product.created
product.updated
product.toppingUpdated
```

Gateway broadcast ra Socket.IO theo dạng dấu hai chấm, ví dụ `product:updated`.
