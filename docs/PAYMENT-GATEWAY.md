# Payment Gateway — Xendit Integration

## Overview

Fusion AI menggunakan **Xendit** sebagai payment gateway. Xendit mendukung berbagai metode pembayaran lokal Indonesia dan internasional.

## Architecture

```
User klik "Upgrade"
    ↓
Frontend POST /api/payment { tier: "pro" }
    ↓
Backend buat Xendit Invoice
    ↓
User di-redirect ke Xendit hosted page
    ↓
User pilih metode pembayaran & bayar
    ↓
Xendit kirim webhook ke /api/payment/webhook
    ↓
Webhook update database: tier, limits, status
```

## Supported Payment Methods

| Method | Description |
|---|---|
| Credit/Debit Card | Visa, Mastercard, JCB |
| Bank Transfer | BCA, Mandiri, BNI, BRI, Permata |
| E-Wallet | GoPay, OVO, DANA, ShopeePay |
| QRIS | Semua QRIS-compatible apps |

## Setup

### 1. Buat Xendit Account

1. Daftar di https://xendit.co
2. Verifikasi email
3. Lengkapi profil bisnis (bisa pakai data personal untuk testing)

### 2. Get API Keys

1. Login ke Xendit Dashboard
2. Settings → API Keys
3. Copy **Secret Key** (format: `xnd_xxx`)

```env
XENDIT_SECRET_KEY=xnd_production_xxx
```

### 3. Setup Webhook

1. Xendit Dashboard → Settings → Webhooks
2. Add webhook endpoint:
   - **URL**: `https://domain-lo.com/api/payment/webhook`
   - **Events**: Invoice PAID, Invoice EXPIRED
3. Copy **Verification Token**

```env
XENDIT_WEBHOOK_TOKEN=xxx
```

### 4. Environment Variables

Tambahkan ke `.env.local`:

```env
XENDIT_SECRET_KEY=xnd_xxx
XENDIT_WEBHOOK_TOKEN=xxx
NEXTAUTH_URL=https://domain-lo.com
```

## API Endpoints

### Create Invoice

**POST** `/api/payment`

```json
{ "tier": "pro" }
→ { "url": "https://invoice.xendit.co/xxx" }
```

### Webhook Handler

**POST** `/api/payment/webhook`

Xendit mengirim webhook otomatis saat invoice:
- **PAID** → Update user tier + limits
- **EXPIRED** → Reset ke free tier

## Pricing

| Tier | Price | Generations |
|---|---|---|
| Free | $0 | 10/month |
| Pro | $9 | 200/month |
| Business | $29 | Unlimited |

## Database Schema

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS generations_limit INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
```

## Testing

### Test Cards

| Card Number | Result |
|---|---|
| 4000000000000002 | Success |
| 4000000000000010 | Declined |

### Test Webhook

```bash
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-callback-token: your_token" \
  -d '{"status":"PAID","metadata":{"userId":"test","tier":"pro"}}'
```

## Security

- ✅ Webhook token verification
- ✅ API key di environment variables
- ✅ HTTPS required untuk webhook
- ✅ Input validation
- ✅ Rate limiting

## Support

- Docs: https://docs.xendit.co
- API Reference: https://docs.xendit.co/reference

---

*Last updated: 2026-06-18*
