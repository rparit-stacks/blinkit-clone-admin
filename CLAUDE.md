# blinkit-clone-admin

## Role
Internal admin dashboard. Manages the entire NainiStore platform: users, orders, products, stores, delivery, wallet, CMS, zones, coupons.

## Active Branch
`main-admin` — all development here; merge to `main` only after team review.

## Stack
- Vite + React + TypeScript
- TanStack Query v5
- React Router v6
- Recharts (analytics charts)
- Leaflet / react-leaflet (zone polygon editor)
- Sonner (toasts)
- Custom CSS (no Tailwind/shadcn)

## Environment
Create `.env.local` before running:
```
VITE_API_BASE_URL=https://nainistore.com
```

## Dev
```bash
bun install
bun run dev        # http://localhost:5174
bun run build
bun run lint
```

## Architecture

### API Layer (`src/api/adminApi.ts`)
Single `req<T>` function handling all HTTP methods. Token stored as `adminToken` in localStorage.
- Auth endpoint: `POST /api/admin/login`
- All other endpoints require `Authorization: Bearer <adminToken>`

### Auth (`src/context/AuthContext.tsx`)
React context wrapping login state. `Layout.tsx` redirects to `/login` if no token.

### Routing (`src/App.tsx`)
All admin routes nested under `<Layout>` (sidebar + topbar):

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `Dashboard` | Stats overview (revenue, orders, users) |
| `/orders` | `Orders` | Order list + status management |
| `/users` | `Users` | Customer accounts |
| `/products` | `Products` | Product catalog + approval/reject |
| `/stores` | `Stores` | Store management (FOOD/BAZAAR/ELECTRONIC) |
| `/coupons` | `Coupons` | Discount coupon CRUD |
| `/delivery` | `Delivery` | Delivery partner management + KYC |
| `/delivery/assignments` | `DeliveryAssignments` | Assign orders to partners |
| `/admins` | `Admins` | Admin account management |
| `/zones` | `Zones` | Delivery zone polygon editor |
| `/cms` | `CMS` | Banners + trending/flash-sale sections |
| `/sellers` | `Sellers` | Seller accounts |
| `/withdrawals` | `Withdrawals` | Payout request approval |
| `/wallet` | `WalletOverview` | Platform + seller + delivery wallets |
| `/notifications` | `Notifications` | Push notification history |

### Store Categories (backend enum)
`FOOD` | `BAZAAR` | `ELECTRONIC` — uppercase string, used in products, stores, banners, coupons.

### Product Moderation
- `approved: null` → legacy (treat as approved)
- `approved: false` → pending / rejected
- `approveProduct(id)` patches `{ approved: true, available: true }`
- `rejectProduct(id)` patches `{ approved: false, available: false }`

### Wallet System
Three wallet types: `platform`, `sellers/:id`, `delivery/:id`.
Credits/debits via dedicated endpoints. Withdrawals need manual approval with UTR reference.

## Security Notes
- `adminToken` in localStorage — keep CSP tight; no eval, no unsafe-inline scripts
- Destructive actions (delete user, block partner) need confirmation modal
- Never log admin token to console

## Code Review Reminders
- Every page must handle loading + error states from TanStack Query
- Recharts must be wrapped in `ResponsiveContainer`
- Leaflet map must clean up on unmount
- Zone polygon coordinates must be validated before save

## Test Plan (before merge)
- [ ] `bun run build` zero errors
- [ ] `bun run lint` zero warnings
- [ ] Login against nainistore.com, dashboard stats load
- [ ] Create / edit / delete a product; approve a pending product
- [ ] Assign delivery partner to an order

## Learnings Log
_Update after each sprint or significant fix._

| Date | Learning |
|------|---------|
| 2026-06-04 | Initial exploration. Admin uses `adminToken` key (frontend-user uses `accessToken`). TanStack Query staleTime=30s globally. Product `approved` is nullable — null means legacy-approved. |
