-- =============================================
-- TABLAS PARA MÓDULO DE BEBIDAS (Aguas y Gaseosas)
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- Tabla de inventario de bebidas
CREATE TABLE IF NOT EXISTS beverages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agua', 'gaseosa')),
  cost_price NUMERIC NOT NULL CONSTRAINT cost_positive CHECK (cost_price >= 0),
  sale_price NUMERIC NOT NULL CONSTRAINT sale_positive CHECK (sale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Implementación de Soft Delete
);

-- Tabla de ventas de bebidas  
CREATE TABLE IF NOT EXISTS beverage_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beverage_id UUID REFERENCES beverages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beverage_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CONSTRAINT qty_positive CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CONSTRAINT unit_positive CHECK (unit_price >= 0),
  total NUMERIC NOT NULL CONSTRAINT total_positive CHECK (total >= 0),
  date TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Implementación de Soft Delete
);

-- Permisos RLS restrictivos
ALTER TABLE beverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beverage_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage your own beverages" ON beverages FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to manage your own beverage_sales" ON beverage_sales FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);
