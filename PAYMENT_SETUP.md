# Razorpay Setup (Local + Production)

## 1) Install dependencies
```bash
npm install
```

## 2) Configure env
Create `.env` from `.env.example` and fill:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SUPABASE_PUBLISHABLE_KEY`

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

---

# Render Deployment (Recommended for Production)

## 1) Create a new Web Service on Render
Use the repo root and keep defaults. This repo includes `render.yaml` for one-click setup.

## 2) Add environment variables on Render
Set these in Render dashboard:
- `SUPABASE_URL=https://pczgxwsxwepqpjibncrb.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_o6I1a8n-lk8kNnxnJTycFw_r3xYdOL1`
- `RAZORPAY_KEY_ID=rzp_test_...` (or live key)
- `RAZORPAY_KEY_SECRET=...`
- `PAYMENTS_ALLOWED_ORIGIN=https://grocery-parlour.netlify.app`

## 3) Deploy and get the Render URL
Example: `https://grocery-parlour-payments.onrender.com`

## 4) Update frontend payments URL
Once you have the Render URL, update `payment-config.js`:
```js
apiBaseUrl: "https://your-render-url.onrender.com"
```

Then push to GitHub so Netlify redeploys.
