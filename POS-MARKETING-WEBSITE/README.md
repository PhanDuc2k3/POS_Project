# POS Marketing Website

Website marketing cho san pham POS restaurant platform. Site gioi thieu tinh nang, giai phap, pricing, demo va form dang ky trial.

## Chay site

```powershell
cd D:\POS\Project1\POS-MARKETING-WEBSITE
npm.cmd install
npm.cmd run dev
```

Mo:

```text
http://localhost:2001
```

Ep port:

```powershell
$env:PORT=2002
npm.cmd run dev
```

## Phu thuoc backend

Can `POS-ENGINE` dang chay tai:

```text
http://localhost:4000/api
```

Site goi:

```text
POST /api/auth/login
GET  /api/auth/me
GET  /api/platform/trial-requests/me
POST /api/platform/trial-requests
```

Trial request yeu cau user da dang nhap va co access token.

## Section chinh

- Hero.
- Features.
- Solutions.
- Workflow.
- Metrics.
- Demo gallery.
- Pricing.
- Trial request form.
- Contact/sign-in.

## Trial flow

```text
Marketing Website
  -> khach dang nhap
  -> khach gui trial request
  -> Platform Service luu request
  -> POS Admin App duyet request
  -> Platform Service tao tenant va account
  -> admin gui account cho khach
```

## Cau truc

```text
POS-MARKETING-WEBSITE/
  assets/
  index.html
  server.js
  styles.css
  src/
    components/
    pages/
    sections/
    shared/
    main.js
```

## Ghi chu

- Day la static website duoc serve bang `server.js`.
- API base hien hard-code trong `src/shared/api.js`: `http://localhost:4000/api`.
- Anh demo nam trong `assets/`.
