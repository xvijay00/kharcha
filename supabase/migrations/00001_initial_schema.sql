-- ============================================================
-- Kharcha PWA — Initial Schema Migration
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- a) businesses
CREATE TABLE public.businesses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES auth.users(id),
  name        text        NOT NULL,
  business_type text      NOT NULL CHECK (business_type IN ('grocery','medical','hotel','restaurant','sweet_shop','mobile_shop')),
  gstin       text,
  address     text,
  settings    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- b) business_members
CREATE TABLE public.business_members (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid  NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     uuid  NOT NULL REFERENCES auth.users(id),
  role        text  NOT NULL CHECK (role IN ('owner','manager','cashier')),
  permissions jsonb DEFAULT '{}'::jsonb,
  UNIQUE (business_id, user_id)
);

-- c) categories
CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('income','expense'))
);

-- d) parties
CREATE TABLE public.parties (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid    NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  phone           text,
  type            text    NOT NULL CHECK (type IN ('customer','supplier')),
  current_balance numeric NOT NULL DEFAULT 0
);

-- e) transactions
CREATE TABLE public.transactions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type         text        NOT NULL CHECK (type IN ('in','out')),
  amount       numeric     NOT NULL CHECK (amount > 0),
  payment_mode text        NOT NULL CHECK (payment_mode IN ('cash','upi','card','bank','wallet')),
  category_id  uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  party_id     uuid        REFERENCES public.parties(id) ON DELETE SET NULL,
  receipt_url  text,
  note         text,
  created_by   uuid        NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  sync_status  text        NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced','pending','failed'))
);

-- f) products
CREATE TABLE public.products (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid    NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text    NOT NULL,
  sku              text,
  barcode          text,
  hsn_code         text,
  gst_rate         numeric DEFAULT 0,
  unit             text    NOT NULL DEFAULT 'pcs',
  purchase_price   numeric NOT NULL DEFAULT 0,
  selling_price    numeric NOT NULL DEFAULT 0,
  stock_qty        numeric NOT NULL DEFAULT 0,
  min_stock_alert  numeric DEFAULT 0,
  track_batches    boolean DEFAULT false,
  track_imei       boolean DEFAULT false,
  salt_composition text,
  is_schedule_h    boolean DEFAULT false
);

-- g) product_batches_serials
CREATE TABLE public.product_batches_serials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_or_imei text NOT NULL,
  mfg_date      date,
  expiry_date   date,
  status        text NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock','sold','wasted'))
);

-- h) orders_bookings
CREATE TABLE public.orders_bookings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  table_or_room_no text,
  customer_name    text,
  doctor_name      text,
  status           text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','kot_sent','billed')),
  items            jsonb       NOT NULL DEFAULT '[]'::jsonb,
  subtotal         numeric     NOT NULL DEFAULT 0,
  cgst             numeric     NOT NULL DEFAULT 0,
  sgst             numeric     NOT NULL DEFAULT 0,
  igst             numeric     NOT NULL DEFAULT 0,
  total_amount     numeric     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX idx_business_members_user_id     ON public.business_members(user_id);
CREATE INDEX idx_categories_business_id       ON public.categories(business_id);
CREATE INDEX idx_parties_business_id          ON public.parties(business_id);
CREATE INDEX idx_transactions_business_id_created ON public.transactions(business_id, created_at DESC);
CREATE INDEX idx_transactions_category        ON public.transactions(category_id);
CREATE INDEX idx_products_business_id         ON public.products(business_id);
CREATE INDEX idx_products_barcode             ON public.products(business_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_batches_product              ON public.product_batches_serials(product_id);
CREATE INDEX idx_batches_expiry               ON public.product_batches_serials(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_orders_business_id           ON public.orders_bookings(business_id);

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_member_of(bid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = bid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_owner_of(bid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = bid AND user_id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.businesses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_bookings        ENABLE ROW LEVEL SECURITY;

-- ---- businesses ----
CREATE POLICY "businesses_select" ON public.businesses
  FOR SELECT USING (auth.uid() = owner_id OR public.is_member_of(id));

CREATE POLICY "businesses_insert" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "businesses_update" ON public.businesses
  FOR UPDATE USING (public.is_owner_of(id));

CREATE POLICY "businesses_delete" ON public.businesses
  FOR DELETE USING (auth.uid() = owner_id);

-- ---- business_members ----
CREATE POLICY "business_members_select" ON public.business_members
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "business_members_insert" ON public.business_members
  FOR INSERT WITH CHECK (public.is_owner_of(business_id));

CREATE POLICY "business_members_update" ON public.business_members
  FOR UPDATE USING (public.is_owner_of(business_id));

CREATE POLICY "business_members_delete" ON public.business_members
  FOR DELETE USING (public.is_owner_of(business_id));

-- ---- categories ----
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (public.is_member_of(business_id));

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (public.is_member_of(business_id));

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (public.is_member_of(business_id));

-- ---- parties ----
CREATE POLICY "parties_select" ON public.parties
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "parties_insert" ON public.parties
  FOR INSERT WITH CHECK (public.is_member_of(business_id));

CREATE POLICY "parties_update" ON public.parties
  FOR UPDATE USING (public.is_member_of(business_id));

CREATE POLICY "parties_delete" ON public.parties
  FOR DELETE USING (public.is_member_of(business_id));

-- ---- transactions ----
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (public.is_member_of(business_id));

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE USING (public.is_member_of(business_id));

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE USING (public.is_member_of(business_id));

-- ---- products ----
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (public.is_member_of(business_id));

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (public.is_member_of(business_id));

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (public.is_member_of(business_id));

-- ---- product_batches_serials ----
CREATE POLICY "product_batches_serials_select" ON public.product_batches_serials
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "product_batches_serials_insert" ON public.product_batches_serials
  FOR INSERT WITH CHECK (public.is_member_of(business_id));

CREATE POLICY "product_batches_serials_update" ON public.product_batches_serials
  FOR UPDATE USING (public.is_member_of(business_id));

CREATE POLICY "product_batches_serials_delete" ON public.product_batches_serials
  FOR DELETE USING (public.is_member_of(business_id));

-- ---- orders_bookings ----
CREATE POLICY "orders_bookings_select" ON public.orders_bookings
  FOR SELECT USING (public.is_member_of(business_id));

CREATE POLICY "orders_bookings_insert" ON public.orders_bookings
  FOR INSERT WITH CHECK (public.is_member_of(business_id));

CREATE POLICY "orders_bookings_update" ON public.orders_bookings
  FOR UPDATE USING (public.is_member_of(business_id));

CREATE POLICY "orders_bookings_delete" ON public.orders_bookings
  FOR DELETE USING (public.is_member_of(business_id));

-- ============================================================
-- 6. RPC — create_business_with_defaults
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_business_with_defaults(
  p_name          text,
  p_business_type text,
  p_gstin         text DEFAULT NULL,
  p_address       text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id     uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO businesses (owner_id, name, business_type, gstin, address, settings)
  VALUES (
    v_user_id,
    p_name,
    p_business_type,
    p_gstin,
    p_address,
    CASE p_business_type
      WHEN 'grocery' THEN '{"modules":{"inventory":true,"weight_billing":true,"wastage":true,"tables":false,"rooms":false,"kot":false,"imei":false,"repair_jobs":false,"batches":false,"schedule_h":false,"salt_composition":false}}'::jsonb
      WHEN 'medical' THEN '{"modules":{"inventory":true,"batches":true,"schedule_h":true,"salt_composition":true,"tables":false,"rooms":false,"kot":false,"imei":false,"repair_jobs":false,"weight_billing":false,"wastage":false}}'::jsonb
      WHEN 'hotel' THEN '{"modules":{"rooms":true,"inventory":true,"tables":false,"kot":false,"weight_billing":false,"wastage":false,"imei":false,"repair_jobs":false,"batches":false,"schedule_h":false,"salt_composition":false}}'::jsonb
      WHEN 'restaurant' THEN '{"modules":{"tables":true,"kot":true,"inventory":true,"rooms":false,"weight_billing":false,"wastage":false,"imei":false,"repair_jobs":false,"batches":false,"schedule_h":false,"salt_composition":false}}'::jsonb
      WHEN 'sweet_shop' THEN '{"modules":{"inventory":true,"weight_billing":true,"wastage":true,"batches":true,"tables":false,"rooms":false,"kot":false,"imei":false,"repair_jobs":false,"schedule_h":false,"salt_composition":false}}'::jsonb
      WHEN 'mobile_shop' THEN '{"modules":{"inventory":true,"imei":true,"repair_jobs":true,"tables":false,"rooms":false,"kot":false,"weight_billing":false,"wastage":false,"batches":false,"schedule_h":false,"salt_composition":false}}'::jsonb
    END
  )
  RETURNING id INTO v_business_id;

  -- Owner membership
  INSERT INTO business_members (business_id, user_id, role)
  VALUES (v_business_id, v_user_id, 'owner');

  -- Seed common categories for ALL business types
  INSERT INTO categories (business_id, name, type) VALUES
    (v_business_id, 'Sales',          'income'),
    (v_business_id, 'Service Income', 'income'),
    (v_business_id, 'Other Income',   'income'),
    (v_business_id, 'Purchase',       'expense'),
    (v_business_id, 'Rent',           'expense'),
    (v_business_id, 'Salary',         'expense'),
    (v_business_id, 'Electricity',    'expense'),
    (v_business_id, 'Other Expense',  'expense');

  -- Seed business-type-specific categories
  IF p_business_type = 'grocery' THEN
    INSERT INTO categories (business_id, name, type) VALUES
      (v_business_id, 'Transport',        'expense'),
      (v_business_id, 'Packaging',        'expense'),
      (v_business_id, 'Wastage/Spoilage', 'expense');

  ELSIF p_business_type = 'medical' THEN
    INSERT INTO categories (business_id, name, type) VALUES
      (v_business_id, 'Prescription Sales', 'income'),
      (v_business_id, 'OTC Sales',          'income'),
      (v_business_id, 'Medicine Purchase',  'expense'),
      (v_business_id, 'Lab Supplies',       'expense');

  ELSIF p_business_type = 'hotel' THEN
    INSERT INTO categories (business_id, name, type) VALUES
      (v_business_id, 'Room Rent',       'income'),
      (v_business_id, 'Food & Beverage', 'income'),
      (v_business_id, 'Housekeeping',    'expense'),
      (v_business_id, 'Laundry',         'expense'),
      (v_business_id, 'Food Supplies',   'expense');

  ELSIF p_business_type = 'restaurant' THEN
    INSERT INTO categories (business_id, name, type) VALUES
      (v_business_id, 'Dine-in',        'income'),
      (v_business_id, 'Takeaway',       'income'),
      (v_business_id, 'Delivery',       'income'),
      (v_business_id, 'Raw Materials',  'expense'),
      (v_business_id, 'Kitchen Gas',    'expense'),
      (v_business_id, 'Packaging',      'expense');

  ELSIF p_business_type = 'sweet_shop' THEN
    INSERT INTO categories (business_id, name, type) VALUES
      (v_business_id, 'Counter Sales',  'income'),
      (v_business_id, 'Bulk Orders',    'income'),
      (v_business_id, 'Catering',       'income'),
      (v_business_id, 'Raw Materials',  'expense'),
      (v_business_id, 'Packaging',      'expense'),
      (v_business_id, 'Wastage',        'expense');

  ELSIF p_business_type = 'mobile_shop' THEN
    INSERT INTO categories (business_id, name, type) VALUES
      (v_business_id, 'Device Sales',        'income'),
      (v_business_id, 'Repair Income',       'income'),
      (v_business_id, 'Accessories',         'income'),
      (v_business_id, 'Parts & Accessories', 'expense'),
      (v_business_id, 'Repair Parts',        'expense');
  END IF;

  RETURN v_business_id;
END;
$$;

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT DO NOTHING;
