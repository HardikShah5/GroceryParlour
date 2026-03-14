# Supabase Local Setup (GroceryShop)

## Installed tools
- `supabase` CLI
- `docker` CLI
- `colima` (local docker runtime)

## Start local runtime
```bash
colima start
```

## Start Supabase (local)
```bash
supabase start
```

If startup is slow first time, images are still downloading.

## Apply schema + seed
From project root:
```bash
supabase db reset
```

This applies:
- `supabase/migrations/20260306195000_init_grocery_schema.sql`
- `supabase/seed.sql`

## Useful commands
```bash
supabase status
supabase stop
```

## Database tables created
- `categories`
- `products`
- `orders`
- `order_items`
