# POS Customer App

Customer self-ordering app for restaurant mode.

## Run

```powershell
cd D:\POS\Project1\POS-CUSTOMER-APP
node server.js
```

Open `http://localhost:3001/`.

## Backend

Uses public gateway routes:

- `http://localhost:4000/api/public/menu?storeId=1`
- `http://localhost:4000/api/public/dining-sessions`
