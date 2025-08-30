-- Estructura de la tabla de pedidos para sistema de validación
-- Este archivo debe ejecutarse en Supabase para crear la tabla

-- Tabla principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado', 'completado', 'cancelado')),
  total DECIMAL(10,2) NOT NULL,
  canal_pedido TEXT DEFAULT 'whatsapp',
  mensaje_whatsapp TEXT,
  fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_confirmacion TIMESTAMP WITH TIME ZONE,
  fecha_completado TIMESTAMP WITH TIME ZONE,
  notas_negocio TEXT,
  notas_cliente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items del pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_negocio_id ON pedidos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_pedidos_updated_at 
    BEFORE UPDATE ON pedidos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Política para usuarios: pueden ver solo sus propios pedidos
CREATE POLICY "Usuarios pueden ver sus propios pedidos" ON pedidos
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear pedidos" ON pedidos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para dueños de negocio: pueden ver pedidos de su negocio
CREATE POLICY "Dueños pueden ver pedidos de su negocio" ON pedidos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM negocios 
            WHERE negocios.id = pedidos.negocio_id 
            AND negocios.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Dueños pueden actualizar pedidos de su negocio" ON pedidos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM negocios 
            WHERE negocios.id = pedidos.negocio_id 
            AND negocios.usuario_id = auth.uid()
        )
    );

-- Políticas para items del pedido
CREATE POLICY "Usuarios pueden ver items de sus pedidos" ON pedido_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE pedidos.id = pedido_items.pedido_id 
            AND pedidos.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear items de sus pedidos" ON pedido_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE pedidos.id = pedido_items.pedido_id 
            AND pedidos.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Dueños pueden ver items de pedidos de su negocio" ON pedido_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE pedidos.id = pedido_items.pedido_id 
            AND pedidos.negocio_id IN (
                SELECT id FROM negocios WHERE usuario_id = auth.uid()
            )
        )
    );

-- Comentarios de la tabla
COMMENT ON TABLE pedidos IS 'Tabla principal de pedidos del sistema';
COMMENT ON COLUMN pedidos.estado IS 'Estado del pedido: pendiente, confirmado, rechazado, completado, cancelado';
COMMENT ON COLUMN pedidos.canal_pedido IS 'Canal por el que se realizó el pedido (whatsapp, app, etc.)';
COMMENT ON COLUMN pedidos.mensaje_whatsapp IS 'Mensaje completo enviado por WhatsApp';
COMMENT ON COLUMN pedidos.fecha_confirmacion IS 'Fecha cuando el negocio confirmó el pedido';
COMMENT ON COLUMN pedidos.fecha_completado IS 'Fecha cuando se completó el pedido';
COMMENT ON COLUMN pedidos.notas_negocio IS 'Notas del negocio sobre el pedido';
COMMENT ON COLUMN pedidos.notas_cliente IS 'Notas del cliente sobre el pedido';
