-- Run this once in Supabase: Project > SQL Editor > New Query > paste > Run

CREATE TABLE IF NOT EXISTS customers (
  wa_id TEXT PRIMARY KEY,
  name TEXT,
  opted_in BOOLEAN DEFAULT true,
  stage TEXT DEFAULT 'new',
  tags TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  wa_id TEXT,
  direction TEXT,
  body TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  wa_id TEXT,
  product_id TEXT,
  product_name TEXT,
  price NUMERIC,
  qty INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  wa_id TEXT,
  items_json JSONB,
  total NUMERIC,
  status TEXT DEFAULT 'pending',
  payment_mode TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  template_name TEXT,
  message_preview TEXT,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON messages(wa_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_wa_id ON cart_items(wa_id);
CREATE INDEX IF NOT EXISTS idx_orders_wa_id ON orders(wa_id);
