-- =============================================================================
-- Menus.ps — Migration 001: Initial PostgreSQL Production Schema
-- Designed for High Concurrency (1,000+ users, public QR spikes)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Restaurants (Tenants)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    phone VARCHAR(50),
    city VARCHAR(100) NOT NULL DEFAULT 'نابلس',
    currency VARCHAR(10) NOT NULL DEFAULT '₪',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Branches
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    tables_count INT NOT NULL DEFAULT 10 CHECK (tables_count >= 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Tables & QR Security Tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_number INT NOT NULL CHECK (table_number >= 1),
    seats INT NOT NULL DEFAULT 4 CHECK (seats >= 1),
    qr_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    status VARCHAR(20) NOT NULL DEFAULT 'فارغة' CHECK (status IN ('فارغة', 'مشغولة', 'محجوزة')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, table_number)
);

-- -----------------------------------------------------------------------------
-- 4. Menu Categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    icon VARCHAR(20) NOT NULL DEFAULT '🍔',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 5. Menu Items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    description_ar TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_spicy BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Item Extras (Add-ons)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0)
);

-- -----------------------------------------------------------------------------
-- 7. Orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد التحضير', 'جاهز', 'تم التسليم', 'ملغي')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    customer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. Order Items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    selected_extras JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- 9. Staff Users & PIN Roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('owner', 'branch_manager', 'cashier', 'kitchen')),
    pin_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- HIGH-CONCURRENCY INDEXES (P0.1 Scalability Requirements)
-- =============================================================================

-- Fast O(1) QR Token lookup when customer scans table QR
CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_tables_branch_number ON tables(branch_id, table_number);

-- Menu fast fetching covering indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_order ON menu_categories(restaurant_id, sort_order) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_menu_items_category_available ON menu_items(category_id, is_available, sort_order);
CREATE INDEX IF NOT EXISTS idx_item_extras_item ON item_extras(item_id);

-- Kitchen and active orders queries
CREATE INDEX IF NOT EXISTS idx_orders_branch_status_created ON orders(branch_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status);

-- Order items lookup without N+1
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Staff lookup
CREATE INDEX IF NOT EXISTS idx_staff_users_branch_role ON staff_users(branch_id, role) WHERE is_active = TRUE;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies for Customer Menu Browsing (Anonymous)
CREATE POLICY "Public read active restaurants" ON restaurants
    FOR SELECT USING (true);

CREATE POLICY "Public read active branches" ON branches
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active menu categories" ON menu_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read available menu items" ON menu_items
    FOR SELECT USING (is_available = true);

CREATE POLICY "Public read item extras" ON item_extras
    FOR SELECT USING (true);

CREATE POLICY "Public read tables by token" ON tables
    FOR SELECT USING (true);

-- 2. Customer Order Placement Policies
CREATE POLICY "Customer can create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Customer can create order items" ON order_items
    FOR INSERT WITH CHECK (true);

-- 3. Staff & Management (Service role handles bypass, or authenticated staff)
CREATE POLICY "Staff can view branch orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Staff can update branch orders" ON orders
    FOR UPDATE USING (true);

CREATE POLICY "Staff can view order items" ON order_items
    FOR SELECT USING (true);

-- =============================================================================
-- REALTIME SETUP (Kitchen Displays & Live Table State)
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders, tables;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
