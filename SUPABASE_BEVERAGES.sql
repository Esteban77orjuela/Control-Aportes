-- =============================================
-- TABLAS PARA MÓDULO DE BEBIDAS (Aguas y Gaseosas)
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- Tabla de inventario de bebidas
CREATE TABLE IF NOT EXISTS beverages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agua', 'gaseosa')),
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas de bebidas  
CREATE TABLE IF NOT EXISTS beverage_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beverage_id UUID REFERENCES beverages(id) ON DELETE SET NULL,
  beverage_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos RLS (igual que las otras tablas, para desarrollo)
ALTER TABLE beverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beverage_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on beverages" ON beverages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on beverage_sales" ON beverage_sales FOR ALL USING (true) WITH CHECK (true);
