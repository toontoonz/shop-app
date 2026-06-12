# Design — Components

Components are organized by module (matching `src/modules/{module}/ui/`). Shared UI primitives (Button, Input, Dialog, Table, Card, etc.) are imported from `src/components/ui/` and come from shadcn/ui.

## Module: seller-account-catalog

### Pages
| Page | Route | Type | Stories |
|------|-------|------|---------|
| LoginPage | `/login` | Server Component (form) + Client form island | US-001 |
| ProductsPage | `/admin/products` | Server Component, fetches list via Prisma | US-002 |
| NewProductPage | `/admin/products/new` | Server Component shell + Client form | US-002 |
| EditProductPage | `/admin/products/[id]/edit` | Server Component shell + Client form | US-002 |

### Components
| Component | File | Type | Responsibility |
|-----------|------|------|----------------|
| LoginForm | `modules/seller-account-catalog/ui/LoginForm.tsx` | Client | Username + password fields with Zod validation; calls Auth.js `signIn`; shows generic error on failure; respects throttle (HTTP 429) |
| LogoutButton | `modules/seller-account-catalog/ui/LogoutButton.tsx` | Client | Calls `signOut` and redirects |
| ProductForm | `modules/seller-account-catalog/ui/ProductForm.tsx` | Client | Name, description, price (THB input → satang), stock, image URL fields with Zod schema; reused for create + edit |
| ProductTableSeller | `modules/seller-account-catalog/ui/ProductTableSeller.tsx` | Server | Lists seller's own products with edit/delete actions |
| DeleteProductDialog | `modules/seller-account-catalog/ui/DeleteProductDialog.tsx` | Client | Confirms soft-delete (sets `active=false`) |

### State Ownership
- Auth state: managed by Auth.js (`useSession()` for client display, `auth()` server-side helper for guards).
- Product list cache: TanStack Query keyed by `['seller-products', sellerId]`; invalidated on create/update/delete.

---

## Module: storefront-checkout

### Pages
| Page | Route | Type | Stories |
|------|-------|------|---------|
| StorefrontHomePage | `/` | Server Component, lists active products from all sellers | US-003 |
| ProductDetailPage | `/product/[id]` | Server Component | US-003 |
| CartPage | `/cart` | Server Component shell + Client cart | US-004 |
| CheckoutPage | `/checkout` | Server Component shell + Client checkout form | US-005 |
| OrderConfirmationPage | `/confirmation/[orderId]` | Server Component | US-006 |

### Components
| Component | File | Type | Responsibility |
|-----------|------|------|----------------|
| StorefrontHeader | `modules/storefront-checkout/ui/StorefrontHeader.tsx` | Server + cart-count Client island | Logo, search box, cart icon with running line count |
| SearchBox | `modules/storefront-checkout/ui/SearchBox.tsx` | Client | Controlled input syncing to `?q=` URL param |
| ProductCard | `modules/storefront-checkout/ui/ProductCard.tsx` | Server | Product thumbnail, name, price, "สินค้าหมด" badge if stock=0, "เพิ่มลงตะกร้า" action |
| ProductDetail | `modules/storefront-checkout/ui/ProductDetail.tsx` | Server | Full description, price, seller name, add-to-cart action |
| AddToCartButton | `modules/storefront-checkout/ui/AddToCartButton.tsx` | Client | Calls cart API; disabled when stock=0; shows toast on success |
| CartDrawer | `modules/storefront-checkout/ui/CartDrawer.tsx` | Client | Slide-over showing all cart lines with quantity steppers and remove buttons |
| CartLine | `modules/storefront-checkout/ui/CartLine.tsx` | Client | Single line: product name, quantity stepper (clamped to stock), unit price, subtotal, remove button |
| CartTotal | `modules/storefront-checkout/ui/CartTotal.tsx` | Server (cookie read) | Computes and displays running subtotal |
| CheckoutForm | `modules/storefront-checkout/ui/CheckoutForm.tsx` | Client | Name (required), phone (required, Thai-format regex), email (optional), payment method picker; Zod validation; submit creates orders |
| PaymentMethodPicker | `modules/storefront-checkout/ui/PaymentMethodPicker.tsx` | Client | Radio cards for the 4 mock methods (Bank Transfer, COD, e-Wallet, Credit Card) |
| OrderConfirmation | `modules/storefront-checkout/ui/OrderConfirmation.tsx` | Server | Lists each created Order with ID, items, total, payment method, buyer info |

### State Ownership
- Cart state: in cookie (`cart`); reads via Server Action `readCart()`, writes via API mutations and TanStack Query invalidation of `['cart']`.
- Form state: React Hook Form local to CheckoutForm.

---

## Module: order-fulfillment

### Pages
| Page | Route | Type | Stories |
|------|-------|------|---------|
| OrdersListPage | `/admin/orders` | Server Component (auth-guarded) | US-007 |
| OrderDetailPage | `/admin/orders/[id]` | Server Component | US-007, US-008, US-009 |

### Components
| Component | File | Type | Responsibility |
|-----------|------|------|----------------|
| OrdersListAdmin | `modules/order-fulfillment/ui/OrdersListAdmin.tsx` | Server | Table of orders for current seller, sortable by createdAt desc |
| StatusFilter | `modules/order-fulfillment/ui/StatusFilter.tsx` | Client | Tabs/select for {all, ordered, paid, packing, shipped, cancelled}; updates `?status=` URL param; shows count badges |
| StatusBadge | `modules/order-fulfillment/ui/StatusBadge.tsx` | Server | Localized Thai label + colored dot per status |
| OrderDetailAdmin | `modules/order-fulfillment/ui/OrderDetailAdmin.tsx` | Server | Order header, line items, buyer info, status timeline (events) |
| AdvanceStatusButton | `modules/order-fulfillment/ui/AdvanceStatusButton.tsx` | Client | Shows next allowed status as label; opens ConfirmDialog; calls advance API; hidden for terminal states |
| CancelOrderButton | `modules/order-fulfillment/ui/CancelOrderButton.tsx` | Client | Visible only when status ∈ {ordered, paid, packing}; opens ConfirmDialog; calls cancel API |
| ConfirmDialog | `components/ui/ConfirmDialog.tsx` (shared) | Client | Generic shadcn AlertDialog wrapper for confirmations |
| StatusTimeline | `modules/order-fulfillment/ui/StatusTimeline.tsx` | Server | Vertical list of OrderStatusEvent rows with timestamp |

---

## Module: sales-analytics

### Pages
| Page | Route | Type | Stories |
|------|-------|------|---------|
| DashboardPage | `/admin/dashboard` | Server Component (auth-guarded) | US-010, US-011, US-012 |

### Components
| Component | File | Type | Responsibility |
|-----------|------|------|----------------|
| TimeRangePicker | `modules/sales-analytics/ui/TimeRangePicker.tsx` | Client | Tabs for the 5 presets; updates `?range=` URL param; default = `LAST_30D` |
| SalesOverTimeChart | `modules/sales-analytics/ui/SalesOverTimeChart.tsx` | Client | Recharts BarChart, x=date bucket (day or month), y=revenue (THB); aggregation interval auto-selected by range |
| OrdersByStatusChart | `modules/sales-analytics/ui/OrdersByStatusChart.tsx` | Client | Recharts BarChart, x=status, y=count; uses all 5 statuses |
| TopSellersTable | `modules/sales-analytics/ui/TopSellersTable.tsx` | Server | Top 10 sellers by revenue; current seller's row highlighted |
| TopProductsTable | `modules/sales-analytics/ui/TopProductsTable.tsx` | Server | Current seller's top 5 products by quantity sold |
| EmptyState | `components/ui/EmptyState.tsx` (shared) | Server | Reused for "ไม่มีข้อมูลในช่วงเวลานี้" |

### State Ownership
- Time-range state: encoded in URL `?range=...`; analytics fetchers read from URL on the server.
- All chart data is fetched server-side; the chart components themselves are Client Components (Recharts requires client) but receive their data as props.

---

## Shared UI (`src/components/ui/`)

Generated from shadcn/ui CLI. Includes: Button, Input, Label, Form (RHF wrapper), Card, Dialog, AlertDialog, Drawer, Tabs, Select, Table, Badge, Toast, DropdownMenu. All restyled with the project's Tailwind theme (Thai font: Noto Sans Thai). No custom theme palette beyond Tailwind defaults — shadcn neutral + a single primary color (configurable in `tailwind.config.ts`).

## Loading and Error UI

- Each route group gets `loading.tsx` (Skeleton from shadcn) and `error.tsx` (generic error boundary with retry).
- Forms display field-level errors inline; submit buttons disabled while pending.
- Toasts for success notifications (cart add, status change, login throttle hit).
