# Razorpay Local Setup (Test Mode)

## 1) Install dependencies
```bash
npm install
```

## 2) Configure env
Create `.env` from `.env.example` and fill:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SUPABASE_PUBLISHABLE_KEY` (your local publishable key)

Example local values:
- `SUPABASE_URL=http://127.0.0.1:54321`
- `PAYMENTS_ALLOWED_ORIGIN=http://127.0.0.1:3000`

## 3) Start services
```bash
supabase start
python3 -m http.server 3000
npm run start:payments
```

## 4) Test flow
1. Sign in user.
2. Add products to cart.
3. Click `Place Order`.
4. Razorpay checkout opens.
5. Complete payment in test mode.
6. Order gets created with `payment_status = paid`.

## 5) Verify in admin
Open `admin.html` and check order cards for:
- Payment status
- Payment ID
