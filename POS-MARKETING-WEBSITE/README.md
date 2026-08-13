# POS Marketing Website

Marketing website built from the supplied Stitch `restaurant_os_marketing_website` zip.

## Included Sections

- Hero landing section
- Feature overview
- Solutions for cafe, restaurant, and chains
- How-it-works workflow
- Product demo gallery
- Pricing cards
- Trial request form
- Contact sales form
- Sign-in form

## Trial Flow

```text
Marketing Website
    -> Customer signs in
    -> Customer submits trial form
    -> Gateway creates Trial Request
    -> Platform Admin reviews request
    -> Admin approves manually
    -> Platform creates Tenant
    -> Platform creates owner Account
    -> Admin sends generated account details to customer
```

Marketing submits to:

```text
POST http://localhost:4000/api/platform/trial-requests
```

Requires `Authorization: Bearer <accessToken>`.

To check current account status:

```text
GET http://localhost:4000/api/platform/trial-requests/me
```

Platform Admin reviews requests in:

```text
POS-ADMIN-APP -> Requests
```

## Structure

```text
POS-MARKETING-WEBSITE/
├── assets/              Local preview images from the Stitch zip
├── src/
│   ├── components/      Header, footer, brand
│   ├── pages/           Page composition
│   ├── sections/        Landing page sections
│   └── shared/          Shared data/config
├── index.html           App shell
├── styles.css           Global styling
└── server.js            Static local server
```

## Run

```powershell
cd D:\POS\Project1\POS-MARKETING-WEBSITE
npm start
```

Open:

```text
http://localhost:2001
```

To use another port:

```powershell
$env:PORT=2002
npm start
```
