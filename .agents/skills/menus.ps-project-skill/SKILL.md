---
name: menus.ps-project-skill
description: >-
  Senior Software Architect, AI Engineer, and Product Engineer specialization skill for Menus.ps.
  Contains full system architecture, database design, API specifications, component catalogs,
  security standards, SDLC guidelines, and operational rules for developing and scaling the platform.
---

# Menus.ps — Engineering & Architectural Core Skill

## 1. Project Overview & Business Mission
`Menus.ps` is a Palestinian SaaS smart QR restaurant and cafe operating system tailored to eliminate restaurant owners' hardware expenses:
- **Core Value Proposition**: "صفر تكلفة أجهزة إضافية" (Zero Hardware Cost). Restaurant owners do NOT need to buy expensive KDS (Kitchen Display System) screens or specialized POS hardware. Customers order directly from their own mobile phones via QR code; staff manage and prepare tickets on existing smartphones, tablets, or laptops.
- **Language & Cultural Context**: 100% Arabic-first, RTL layout, local Palestinian currency (₪ - New Israeli Shekel), local cities (نابلس، رام الله، الخليل، القدس، بيت لحم، جنين، طولكرم، قلقيلية، أريحا، غزة).
- **Core Personas**:
  1. **Customer (الزبون)**: Arrives at table, scans QR code with native phone camera, browses visual menu, adds customizations/notes, places order without calling waiter or downloading an app.
  2. **Kitchen/Staff (طاقم المطبخ والخدمة)**: Receives realtime tickets on any phone/tablet/screen at `/staff`. Strictly decoupled from financial values and revenues. Equipped with undo safeguards (`[↩ تراجع]`, 8-second toast, handover confirmations).
  3. **Restaurant Owner / Admin (صاحب المطعم والإدارة)**: Accesses executive dashboard at `/demo`, manages menus, pricing, table layouts, discounts, multi-branch performance, and live operational status.

---

## 2. Real Existing System Architecture

### 2.1 Tech Stack (Current Reality)
- **Framework**: Next.js 14.2 (App Router architecture, React 18, TypeScript 5).
- **Styling**: Tailwind CSS 3.4 (RTL-first, font: `IBM Plex Sans Arabic`).
- **Icons**: Lucide React.
- **Animations**: Framer Motion 13.
- **Charts & Visualizations**: Recharts 3.10.
- **Current Data Layer**: In-memory TypeScript state initialized from `@/data/demo-data.ts`.
- **Target Backend Architecture**: Next.js API Routes / Server Actions + Supabase (PostgreSQL + Realtime WebSockets + Row Level Security + Supabase Auth).

### 2.2 Routing Map & Component Hierarchy
```
app/
├── layout.tsx                # Root layout with IBM Plex Sans Arabic and RTL direction
├── globals.css               # Global Tailwind directives, scrollbar styling
├── page.tsx                  # Landing Page (Full presentation, hero with live phone mock, steps, features, CTA)
├── how-it-works/page.tsx     # 6-step visual interactive timeline
├── features/page.tsx         # 12 detailed feature cards
├── pricing/page.tsx          # Menus.ps Pro plan breakdown (150₪/month)
├── faq/page.tsx              # Interactive animated accordion FAQ
├── contact/page.tsx          # 14-day free trial application form
├── login/page.tsx            # Role-aware authentication gateway (routes to /staff or /demo)
├── m/page.tsx                # Customer Mobile QR Menu (frictionless inline counters, zero blocking modals)
├── staff/page.tsx            # Kitchen & Staff Ticket Display (financial-free, error-proofed with undo safeguards)
└── demo/
    ├── layout.tsx            # Backoffice shell containing DemoSidebar
    ├── page.tsx              # Executive Hub & KPI overview
    ├── orders/page.tsx       # Live orders queue & QR order simulator
    ├── menu-editor/page.tsx  # Dynamic catalog editor (items, categories, availability)
    ├── tables/page.tsx       # Floor plan, table occupancy & QR printable studio
    ├── dashboard/page.tsx    # Analytics & sales trend charts (Recharts)
    ├── offers/page.tsx       # Promotions & discount campaigns
    ├── branches/page.tsx     # Multi-branch comparison (Nablus vs Ramallah)
    ├── settings/page.tsx     # Restaurant profile, currency, taxes & working hours
    ├── kitchen/page.tsx      # Legacy kitchen kanban
    ├── analytics/page.tsx    # Deep dive statistical reports
    └── menu/page.tsx         # Customer menu preview inside desktop frame
```

---

## 3. Data Models & Database Schema

### 3.1 Core TypeScript Interfaces (`@/data/demo-data.ts`)
- `MenuItem`: `{ id, name, description, price, image, imageUrl?, category, popular?, extras?, customizations? }`
- `Extra`: `{ id, name, price }`
- `Customization`: `{ id, name, options: string[], default?: string }`
- `Order`: `{ id, table, items: OrderItem[], total, status, time, customerName? }`
- `OrderItem`: `{ name, quantity, price, extras?: string[], customization? }`
- `TableInfo`: `{ id, seats, status: 'فارغة' | 'مشغولة' | 'محجوزة', currentOrder?, guests? }`
- `BranchData`: `{ id, name, city, tables, todaySales, todayOrders }`

### 3.2 Production Relational Schema (PostgreSQL / Supabase)
1. `tenants / restaurants`: `id (uuid), name, slug, logo_url, phone, city, currency (default 'ILS'), created_at`
2. `branches`: `id (uuid), restaurant_id (fk), name, city, address, tables_count, is_active`
3. `tables`: `id (uuid), branch_id (fk), table_number (int), seats (int), qr_code_token (text unique), status (enum)`
4. `menu_categories`: `id (uuid), restaurant_id (fk), name_ar, icon, sort_order, is_active`
5. `menu_items`: `id (uuid), category_id (fk), name_ar, description_ar, price (numeric), image_url, is_available, is_popular, is_spicy`
6. `item_extras`: `id (uuid), item_id (fk), name_ar, price (numeric)`
7. `orders`: `id (uuid), branch_id (fk), table_id (fk), order_number (text), status (enum: 'new','cooking','ready','delivered','cancelled'), total_amount (numeric), customer_note (text), created_at`
8. `order_items`: `id (uuid), order_id (fk), item_id (fk), item_name, quantity (int), unit_price (numeric), selected_extras (jsonb), notes (text)`
9. `staff_users`: `id (uuid), branch_id (fk), role (enum: 'admin', 'cashier', 'kitchen_staff'), pin_code (hash)`

---

## 4. Architectural Rules & Anti-Regression Invariants

### 4.1 Strict Non-Negotiable Invariants
1. **Never Delete Working Code**: Existing routes, demo features, and mock data must remain intact and functional. Refactor incrementally, never destroy.
2. **Language Invariant**: All UI copy, notifications, confirmations, and reports MUST be strictly in professional, natural Arabic.
3. **Hardware-Free Positioning**: All copy and onboarding flows must reinforce "صفر تكلفة أجهزة إضافية".
4. **Staff Screen Decoupling**: `/staff` must NEVER show revenues, totals, financial metrics, or item prices. Its purpose is preparation speed, accuracy, and safety.
5. **Frictionless Mobile Menu (`/m`)**:
   - Never introduce mandatory blocking popups to add items.
   - Ordering is 1-tap inline increment (`+ أضف` -> `[-] qty [+]`).
   - Customizations/notes are optional via lightweight drawer or inline button.
6. **Standalone Brand Logo**: Use `<Logo />` with `/logo.png`. Do NOT append redundant external "MENUS" text beside it.
7. **Scale Proportions**: Keep balanced proportions. Pages `/m`, `/staff`, and `/demo/orders` are scaled with `[zoom:0.8]` to ensure optimal density without overflowing standard displays.

---

## 5. Security, Validation, and Performance Guidelines

### 5.1 Security Protocols
- **QR Token Verification**: Tables must be identified via cryptographically signed tokens (`/m?token=...`), not easily guessable auto-increment IDs in production.
- **Role Separation**:
  - `Admin`: Full access to `/demo/*`, financial reports, menu edits, pricing.
  - `Staff`: Accessible via PIN code or branch passkey at `/staff`. Read-only access to orders, state progression only.
  - `Customer`: Public access to `/m`. Can only insert orders for their specific table session; cannot view other tables' orders.
- **Input Sanitization**: Sanitize customer notes against XSS before displaying on kitchen displays or receipts.

### 5.2 Scalability & High Traffic Invariants (Mandatory)
1. **Performance as Priority**: Any new feature must evaluate database hit frequency, memory consumption, and network payloads before merging.
2. **Stateless App Tier**: The Next.js application tier must remain strictly stateless. Never use instance memory as a database, never save user assets to the local filesystem, and never rely on single-instance sticky sessions. This allows horizontal auto-scaling (1 instance -> N instances) behind any standard load balancer/CDN.
3. **High-Traffic QR Menu Caching**:
   - The Public QR Menu (`/m`) is **read-heavy** (98% reads, 2% writes).
   - Menu catalog, categories, items, and restaurant info MUST be cached at the CDN/Edge layer (`stale-while-revalidate` or Next.js `unstable_cache` with tag-based revalidation `revalidateTag('menu:<restaurant_id>')`).
   - Opening a table menu must NEVER trigger cold database hits during rush hours.
4. **Database Access & Connection Pooling**:
   - Always use connection pooling (PgBouncer / Supavisor on port 6543) in serverless/edge environments to prevent connection exhaustion.
   - Enforce pagination on all lists (orders, history, menu items).
   - Strictly avoid N+1 query patterns by joining or using structured JSON queries.
   - Use transactions (`BEGIN ... COMMIT`) strictly when atomicity is required (e.g., creating order + order items simultaneously).
5. **Asset Offloading (CDN First)**:
   - Never serve restaurant food photos from the Next.js application server. All images must be uploaded to Cloud Storage (Supabase Storage / S3 / R2) and delivered via Cloudflare / CDN in modern formats (WebP/AVIF).
6. **API Protection & Rate Limiting**:
   - Public APIs (`/api/v1/orders/submit`, `/api/v1/tables/call-waiter`) must be protected by IP and token rate-limiting (e.g. 10 requests/minute per table) to prevent DOS attacks or malicious script abuse.
   - File uploads must strictly limit size (max 3MB for menu photos) and validate MIME types.
7. **Heavy Operations Offloading**:
   - Heavy tasks (PDF standee generation, high-res image compression, daily sales rollup, analytics aggregation) must NOT block HTTP response threads. They must run asynchronously or in background worker queues.
8. **AI Request Throttling & Cost Protection**:
   - Never trigger raw AI API calls on unthrottled user requests.
   - Always check semantic response cache first (e.g. standard queries like "أكثر صنف مبيعاً" or "ساعات الذروة" cached per restaurant for 1 hour).
   - Enforce timeouts (10s), retry limits (max 1), error fallbacks, and daily usage quotas per restaurant tier to eliminate unexpected API bill shocks.
9. **Pragmatic Scaling Philosophy**:
   - "Simple now → Scalable later → Zero unnecessary cloud costs".
   - Start with a Modular Monolith on Next.js + Managed PostgreSQL (Supabase) + Edge Caching. No premature Kubernetes or microservices.

---

## 6. How to Add and Modify Features

### 6.1 Adding a New Feature
1. **Inspect Existing UI & Data**: Check `@/data/demo-data.ts` and related pages to reuse existing patterns.
2. **Evaluate Scalability Impact**: Ask: Does this add un-indexed queries? Does it block the event loop? Does it cache properly?
3. **Update Interfaces**: Extend TypeScript interfaces in `@/data/demo-data.ts` if new properties are required.
4. **Component Reusability**: Check `components/common/` and `components/layout/` before creating new components.
5. **Implement with Tailwind & Framer Motion**: Follow existing design tokens (Orange `#f97316`, Slate `#0f172a`, Emerald `#10b981`).
6. **Verify Without Regressions**: Run `npm run lint` and verify `/`, `/m`, `/staff`, and `/demo` build cleanly.

### 6.2 Modifying Existing Features
- Never replace an entire multi-page system with a single hack.
- Always test responsive behavior at standard 100% desktop scale and 375px mobile viewport.
- Maintain backward compatibility with the mock data contract.
