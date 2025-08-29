-- =====================================================
-- CONFIGURACIÓN DE BASE DE DATOS PARA VECIMARKET
-- Tablas para contabilizar pedidos y estadísticas
-- =====================================================

-- Tabla principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id), -- Opcional, para usuarios registrados
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado_pedido TEXT DEFAULT 'pendiente' CHECK (estado_pedido IN ('pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado')),
  canal_pedido TEXT DEFAULT 'whatsapp' CHECK (canal_pedido IN ('whatsapp', 'app', 'telefono', 'presencial')),
  mensaje_whatsapp TEXT, -- Para guardar el mensaje enviado
  fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT, -- Para notas adicionales del negocio
  metadata JSONB -- Para datos adicionales como IP, dispositivo, etc.
);

-- Tabla de estadísticas de productos
CREATE TABLE IF NOT EXISTS estadisticas_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  total_pedidos INTEGER DEFAULT 0,
  total_cantidad_vendida INTEGER DEFAULT 0,
  total_ingresos DECIMAL(12,2) DEFAULT 0.00,
  ultimo_pedido TIMESTAMP WITH TIME ZONE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(producto_id, negocio_id)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Índices para la tabla pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_producto_id ON pedidos(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_negocio_id ON pedidos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pedido ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_canal ON pedidos(canal_pedido);

-- Índices para la tabla estadisticas_productos
CREATE INDEX IF NOT EXISTS idx_estadisticas_producto_id ON estadisticas_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_estadisticas_negocio_id ON estadisticas_productos(negocio_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_actualizacion en pedidos
DROP TRIGGER IF EXISTS trigger_update_fecha_actualizacion ON pedidos;
CREATE TRIGGER trigger_update_fecha_actualizacion
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_actualizacion();

-- Función para mantener estadísticas actualizadas automáticamente
CREATE OR REPLACE FUNCTION actualizar_estadisticas_producto()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar o actualizar estadísticas
  INSERT INTO estadisticas_productos (producto_id, negocio_id, total_pedidos, total_cantidad_vendida, total_ingresos, ultimo_pedido)
  VALUES (NEW.producto_id, NEW.negocio_id, 1, NEW.cantidad, NEW.total, NEW.fecha_pedido)
  ON CONFLICT (producto_id, negocio_id)
  DO UPDATE SET
    total_pedidos = estadisticas_productos.total_pedidos + 1,
    total_cantidad_vendida = estadisticas_productos.total_cantidad_vendida + NEW.cantidad,
    total_ingresos = estadisticas_productos.total_ingresos + NEW.total,
    ultimo_pedido = NEW.fecha_pedido,
    fecha_actualizacion = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener estadísticas actualizadas
DROP TRIGGER IF EXISTS trigger_actualizar_estadisticas ON pedidos;
CREATE TRIGGER trigger_actualizar_estadisticas
  AFTER INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_producto();

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS
-- =====================================================

-- Vista para resumen de pedidos por negocio
CREATE OR REPLACE VIEW vista_resumen_negocios AS
SELECT 
  n.id as negocio_id,
  n.nombre as nombre_negocio,
  COUNT(p.id) as total_pedidos,
  SUM(p.total) as ingresos_totales,
  AVG(p.total) as promedio_pedido,
  MAX(p.fecha_pedido) as ultimo_pedido
FROM negocios n
LEFT JOIN pedidos p ON n.id = p.negocio_id
GROUP BY n.id, n.nombre;

-- Vista para resumen de productos más pedidos
CREATE OR REPLACE VIEW vista_productos_populares AS
SELECT 
  p.producto_id,
  pr.nombre as nombre_producto,
  p.negocio_id,
  n.nombre as nombre_negocio,
  p.total_pedidos,
  p.total_cantidad_vendida,
  p.total_ingresos,
  p.ultimo_pedido
FROM estadisticas_productos p
JOIN productos pr ON p.producto_id = pr.id
JOIN negocios n ON p.negocio_id = n.id
ORDER BY p.total_pedidos DESC, p.total_ingresos DESC;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos estados de pedido de ejemplo
-- INSERT INTO estados_pedido (nombre, descripcion) VALUES 
-- ('pendiente', 'Pedido recibido, pendiente de confirmación'),
-- ('confirmado', 'Pedido confirmado por el negocio'),
-- ('en_proceso', 'Pedido en preparación'),
-- ('enviado', 'Pedido enviado al cliente'),
-- ('entregado', 'Pedido entregado exitosamente'),
-- ('cancelado', 'Pedido cancelado');

-- =====================================================
-- CONSULTAS ÚTILES PARA ANÁLISIS
-- =====================================================

-- Consulta para obtener estadísticas de un negocio específico
-- SELECT * FROM vista_resumen_negocios WHERE negocio_id = 'uuid-del-negocio';

-- Consulta para obtener productos más populares de un negocio
-- SELECT * FROM vista_productos_populares WHERE negocio_id = 'uuid-del-negocio';

-- Consulta para obtener pedidos de hoy
-- SELECT * FROM pedidos WHERE DATE(fecha_pedido) = CURRENT_DATE;

-- Consulta para obtener pedidos por canal
-- SELECT canal_pedido, COUNT(*) as total FROM pedidos GROUP BY canal_pedido;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Asegúrate de que las tablas productos y negocios existan antes de ejecutar este script
-- 2. Los triggers se ejecutarán automáticamente para mantener las estadísticas actualizadas
-- 3. Las vistas facilitan las consultas más comunes
-- 4. Los índices mejoran el rendimiento de las consultas
-- 5. El campo metadata permite almacenar información adicional flexible
