# POS System

He thong POS cho cua hang ban le, nha hang, cafe va mo hinh restaurant mode.

## Gom nhung gi

- `POS-ENGINE`: backend Node.js, API Gateway, WebSocket, auth, store, transaction, product, print.
- `POS-PORTAL`: trang quan ly cho chu cua hang.
- `POS-ADMIN-APP`: trang quan tri cho chu san pham/nen tang.
- `POS-ELECTRON`: app ban hang tai quay, dong vai tro device agent va lenh in.
- `POS-CUSTOMER-APP`: man hinh khach tu goi mon.
- `POS-KITCHEN-APP`: man hinh bep/bar xu ly order.

## Chuc nang chinh

- Dang nhap va lam viec voi JWT.
- Quan ly cua hang, menu, san pham, topping, doanh thu, don hang.
- Quan ly tenant, package, account va permission cho chu nen tang.
- Ban hang tai quay tren Electron.
- Tu goi mon va theo doi trang thai ban nau an.
- Thanh toan tien mat hoac chuyen khoan qua webhook.
- In hoa don qua device agent hoac print service.
- Cap nhat realtime qua Socket.IO.

## Cau truc port local

- Portal: `http://localhost:3000`
- Admin: `http://localhost:3003` hoac `http://localhost:3004` neu 3003 bi chiem
- Customer app: `http://localhost:3001`
- Kitchen app: `http://localhost:3002`
- Gateway: `http://localhost:4000`

## Cach chay

### 1. Cai dependency

Chay trong tung thu muc:

```powershell
cd D:\POS\Project1\POS-ENGINE
npm install

cd D:\POS\Project1\POS-PORTAL
npm install

cd D:\POS\Project1\POS-ADMIN-APP
npm install

cd D:\POS\Project1\POS-ELECTRON
npm install

cd D:\POS\Project1\POS-CUSTOMER-APP
npm install

cd D:\POS\Project1\POS-KITCHEN-APP
npm install
```

### 2. Chay backend

```powershell
cd D:\POS\Project1\POS-ENGINE
npm run dev
```

Kiem tra nhanh:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:4000/api/health
```

### 3. Chay Portal

```powershell
cd D:\POS\Project1\POS-PORTAL
npm run dev
```

Mo:

```text
http://localhost:3000
```

### 4. Chay Admin

```powershell
cd D:\POS\Project1\POS-ADMIN-APP
node server.js
```

Mo:

```text
http://localhost:3003
```

Neu 3003 da bi chiem, app se tu nhay sang port tiep theo, thuong la `3004`.

### 5. Chay Electron

```powershell
cd D:\POS\Project1\POS-ELECTRON
npm start
```

### 6. Chay Customer va Kitchen app

```powershell
cd D:\POS\Project1\POS-CUSTOMER-APP
npm start

cd D:\POS\Project1\POS-KITCHEN-APP
npm start
```

## Tai khoan demo

### Admin app

- Username: `platform`
- Password: `platform123`

### Portal

- Username: `admin`
- Password: `admin123`

## Cau hinh API

Mac dinh frontend goi ve gateway:

```text
http://localhost:4000/api
```

Neu can doi moi truong, dung cac bien nhu:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
PORT=3003
```

## Luu y

- Backend phai chay truoc thi Portal/Admin/Electron moi dang nhap duoc.
- Neu co loi CORS o Admin, hay kiem tra app dang chay o `3003` hay `3004`.
- Neu muon test in va realtime, mo them Electron trong luc backend dang chay.
