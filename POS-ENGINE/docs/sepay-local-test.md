# SePay local test

## 1. Start POS Engine

```powershell
cd D:\POS\Project1\POS-ENGINE
$env:SEPAY_WEBHOOK_API_KEY="dev-sepay-secret"
npm.cmd start
```

For quick local testing without auth, omit `SEPAY_WEBHOOK_API_KEY`. For safer testing with SePay dashboard, configure API Key auth and use the same value.

## 2. Public webhook URL with ngrok

```powershell
ngrok http 4000
```

Use this URL in SePay:

```text
https://<your-ngrok-domain>/api/payment-webhooks/sepay
```

Webhook type: incoming transfer. Payload format: JSON.

## 3. Payment code

When POS creates a transfer order, the QR content is the order payment code, for example:

```text
POS20260811001
```

Configure SePay payment-code recognition with prefix:

```text
POS
```

## 4. Test payload

Replace `code`, `content`, `transferAmount`, and `accountNumber` with the values shown on the POS QR.

```powershell
$body = @{
  id = 12345
  gateway = "MBBank"
  transactionDate = "2026-08-11 10:30:00"
  accountNumber = "0123456789"
  code = "POS20260811001"
  content = "POS20260811001 thanh toan"
  transferType = "in"
  description = "NGUYEN VAN A chuyen tien"
  transferAmount = 100000
  referenceCode = "SB1A2B3C4D5E"
  accumulated = 5000000
} | ConvertTo-Json -Compress

Invoke-WebRequest -UseBasicParsing `
  -Method POST `
  -Uri "http://localhost:4000/api/payment-webhooks/sepay" `
  -Headers @{ Authorization = "Apikey dev-sepay-secret"; "Content-Type" = "application/json" } `
  -Body $body
```

Expected response:

```json
{"success":true,"matched":true,"orderId":1}
```
