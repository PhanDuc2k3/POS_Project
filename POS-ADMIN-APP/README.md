# POS Admin App

Platform owner console for package, tenant, order, account, and permission management.

## Run

```powershell
cd D:\POS\Project1\POS-ADMIN-APP
node server.js
```

Open `http://localhost:3003/`.

If port `3003` is already in use, the app automatically tries the next port
and prints the exact URL, usually `http://localhost:3004/`. The Gateway allows
both local admin origins by default.

To force a specific port:

```powershell
$env:PORT=3004
node server.js
```

## Demo Platform Account

The backend seeds a project-owner account:

- Username: `platform`
- Password: `platform123`
- Role: `platform_admin`

This first app version uses local demo data so the management model can be refined before wiring full admin APIs.

## Trial Request Flow

Marketing customers submit trial requests from `POS-MARKETING-WEBSITE`.

In Platform Admin:

1. Open `Requests`.
2. Review the pending trial request.
3. Click `Approve & create tenant`.
4. The platform creates a trial tenant and store owner account.
5. Send the generated account details shown in the approved request back to the customer.
