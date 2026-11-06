-- I3: compras completas. Órdenes con varias líneas (la tabla de detalle ya lo permitía),
-- devoluciones con flujo de estados y almacén, notas en la orden.
ALTER TABLE ordenes_compra ADD COLUMN IF NOT EXISTS observaciones TEXT NOT NULL DEFAULT '';
ALTER TABLE ordenes_compra ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE devoluciones_compra ADD COLUMN IF NOT EXISTS almacen_id BIGINT REFERENCES almacenes(id);
ALTER TABLE devoluciones_compra ADD COLUMN IF NOT EXISTS documento TEXT NOT NULL DEFAULT '';
ALTER TABLE devoluciones_compra ADD COLUMN IF NOT EXISTS enviada_en TIMESTAMPTZ;
ALTER TABLE devoluciones_compra ADD COLUMN IF NOT EXISTS acreditada_en TIMESTAMPTZ;
ALTER TABLE devoluciones_compra ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE devoluciones_compra DROP CONSTRAINT IF EXISTS devoluciones_compra_estado_check;
ALTER TABLE devoluciones_compra ADD CONSTRAINT devoluciones_compra_estado_check CHECK (estado IN ('Pendiente','Enviada','Acreditada','Cancelada'));
CREATE INDEX IF NOT EXISTS idx_recepciones_detalle ON recepciones_compra(orden_detalle_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_detalle ON orden_compra_detalles(orden_id);
