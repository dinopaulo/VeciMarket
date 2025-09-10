-- =====================================================
-- SISTEMA SOCIAL PARA VECIMARKET - CORREGIDO
-- Tablas para publicaciones, interacciones y contenido social
-- Compatible con el esquema actual de la base de datos
-- =====================================================

-- Tabla principal de publicaciones (posts)
CREATE TABLE IF NOT EXISTS publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  tipo_publicacion TEXT DEFAULT 'general' CHECK (tipo_publicacion IN ('general', 'promocion', 'producto', 'evento', 'noticia')),
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL, -- Para linkear productos
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'oculto', 'eliminado')),
  fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Para datos adicionales como ubicación, hashtags, etc.
);

-- Tabla para fotos de publicaciones (múltiples fotos por post)
CREATE TABLE IF NOT EXISTS fotos_publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  url_imagen TEXT NOT NULL,
  orden INTEGER DEFAULT 1, -- Para ordenar las fotos
  descripcion TEXT, -- Descripción opcional de la foto
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para comentarios en publicaciones
CREATE TABLE IF NOT EXISTS comentarios_publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  comentario_padre_id UUID REFERENCES comentarios_publicaciones(id) ON DELETE CASCADE, -- Para respuestas
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'oculto', 'eliminado')),
  fecha_comentario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para likes en publicaciones
CREATE TABLE IF NOT EXISTS likes_publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_like TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(publicacion_id, usuario_id) -- Un usuario solo puede dar like una vez por publicación
);

-- Tabla para likes en comentarios
CREATE TABLE IF NOT EXISTS likes_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id UUID NOT NULL REFERENCES comentarios_publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_like TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comentario_id, usuario_id) -- Un usuario solo puede dar like una vez por comentario
);

-- Tabla para compartir publicaciones
CREATE TABLE IF NOT EXISTS compartir_publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mensaje_personalizado TEXT, -- Mensaje opcional al compartir
  canal_compartir TEXT DEFAULT 'app' CHECK (canal_compartir IN ('app', 'whatsapp', 'facebook', 'instagram', 'twitter', 'otro')),
  fecha_compartir TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Para datos adicionales del compartir
);

-- Tabla para guardar publicaciones como favoritas
CREATE TABLE IF NOT EXISTS publicaciones_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_guardado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(publicacion_id, usuario_id) -- Un usuario solo puede guardar una vez cada publicación
);

-- Tabla para reportar publicaciones
CREATE TABLE IF NOT EXISTS reportes_publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL CHECK (motivo IN ('spam', 'contenido_inapropiado', 'informacion_falsa', 'violencia', 'otro')),
  descripcion TEXT, -- Descripción adicional del reporte
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'resuelto', 'descartado')),
  fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  administrador_id UUID REFERENCES usuarios(id) -- Quien resolvió el reporte
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Índices para la tabla publicaciones
CREATE INDEX IF NOT EXISTS idx_publicaciones_negocio_id ON publicaciones(negocio_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_usuario_id ON publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_fecha_publicacion ON publicaciones(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_publicaciones_tipo ON publicaciones(tipo_publicacion);
CREATE INDEX IF NOT EXISTS idx_publicaciones_estado ON publicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_publicaciones_producto_id ON publicaciones(producto_id);

-- Índices para la tabla fotos_publicaciones
CREATE INDEX IF NOT EXISTS idx_fotos_publicacion_id ON fotos_publicaciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_fotos_orden ON fotos_publicaciones(publicacion_id, orden);

-- Índices para la tabla comentarios_publicaciones
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion_id ON comentarios_publicaciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario_id ON comentarios_publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_fecha ON comentarios_publicaciones(fecha_comentario DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_padre_id ON comentarios_publicaciones(comentario_padre_id);

-- Índices para la tabla likes_publicaciones
CREATE INDEX IF NOT EXISTS idx_likes_publicacion_id ON likes_publicaciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_likes_usuario_id ON likes_publicaciones(usuario_id);

-- Índices para la tabla likes_comentarios
CREATE INDEX IF NOT EXISTS idx_likes_comentario_id ON likes_comentarios(comentario_id);
CREATE INDEX IF NOT EXISTS idx_likes_comentario_usuario_id ON likes_comentarios(usuario_id);

-- Índices para la tabla compartir_publicaciones
CREATE INDEX IF NOT EXISTS idx_compartir_publicacion_id ON compartir_publicaciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_compartir_usuario_id ON compartir_publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compartir_fecha ON compartir_publicaciones(fecha_compartir DESC);

-- Índices para la tabla publicaciones_favoritas
CREATE INDEX IF NOT EXISTS idx_favoritas_publicacion_id ON publicaciones_favoritas(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_favoritas_usuario_id ON publicaciones_favoritas(usuario_id);

-- Índices para la tabla reportes_publicaciones
CREATE INDEX IF NOT EXISTS idx_reportes_publicacion_id ON reportes_publicaciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario_id ON reportes_publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_publicaciones(estado);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion_social()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar fecha_actualizacion
DROP TRIGGER IF EXISTS trigger_update_fecha_actualizacion_publicaciones ON publicaciones;
CREATE TRIGGER trigger_update_fecha_actualizacion_publicaciones
  BEFORE UPDATE ON publicaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_actualizacion_social();

DROP TRIGGER IF EXISTS trigger_update_fecha_actualizacion_comentarios ON comentarios_publicaciones;
CREATE TRIGGER trigger_update_fecha_actualizacion_comentarios
  BEFORE UPDATE ON comentarios_publicaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_actualizacion_social();

-- Función para validar que solo dueños de negocio puedan crear publicaciones
CREATE OR REPLACE FUNCTION validar_creador_publicacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que el usuario sea dueño del negocio
  IF NOT EXISTS (
    SELECT 1 FROM negocios 
    WHERE id = NEW.negocio_id 
    AND usuario_id = NEW.usuario_id
  ) THEN
    RAISE EXCEPTION 'Solo los dueños de negocio pueden crear publicaciones';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar creador de publicación
DROP TRIGGER IF EXISTS trigger_validar_creador_publicacion ON publicaciones;
CREATE TRIGGER trigger_validar_creador_publicacion
  BEFORE INSERT ON publicaciones
  FOR EACH ROW
  EXECUTE FUNCTION validar_creador_publicacion();

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS (CORREGIDAS)
-- =====================================================

-- Vista para publicaciones con información completa
CREATE OR REPLACE VIEW vista_publicaciones_completa AS
SELECT 
  p.id,
  p.negocio_id,
  p.usuario_id,
  p.contenido,
  p.tipo_publicacion,
  p.producto_id,
  p.estado,
  p.fecha_publicacion,
  p.fecha_actualizacion,
  p.metadata,
  n.nombre as nombre_negocio,
  n.categoria as categoria_negocio,
  n.logo_url as logo_negocio,
  u.nombre as nombre_usuario,
  u.correo as email_usuario, -- CORREGIDO: usar 'correo' en lugar de 'email'
  pr.nombre as nombre_producto,
  pr.valor as precio_producto, -- CORREGIDO: usar 'valor' en lugar de 'precio'
  pr.imagen_url as imagen_producto,
  -- Contadores
  (SELECT COUNT(*) FROM likes_publicaciones WHERE publicacion_id = p.id) as total_likes,
  (SELECT COUNT(*) FROM comentarios_publicaciones WHERE publicacion_id = p.id AND estado = 'activo') as total_comentarios,
  (SELECT COUNT(*) FROM compartir_publicaciones WHERE publicacion_id = p.id) as total_compartidos,
  (SELECT COUNT(*) FROM fotos_publicaciones WHERE publicacion_id = p.id) as total_fotos
FROM publicaciones p
JOIN negocios n ON p.negocio_id = n.id
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN productos pr ON p.producto_id = pr.id
WHERE p.estado = 'activo';

-- Vista para comentarios con información del usuario
CREATE OR REPLACE VIEW vista_comentarios_completa AS
SELECT 
  c.id,
  c.publicacion_id,
  c.usuario_id,
  c.contenido,
  c.comentario_padre_id,
  c.estado,
  c.fecha_comentario,
  c.fecha_actualizacion,
  u.nombre as nombre_usuario,
  u.correo as email_usuario, -- CORREGIDO: usar 'correo' en lugar de 'email'
  -- Contador de likes
  (SELECT COUNT(*) FROM likes_comentarios WHERE comentario_id = c.id) as total_likes
FROM comentarios_publicaciones c
JOIN usuarios u ON c.usuario_id = u.id
WHERE c.estado = 'activo';

-- Vista para estadísticas de publicaciones por negocio
CREATE OR REPLACE VIEW vista_estadisticas_publicaciones_negocio AS
SELECT 
  n.id as negocio_id,
  n.nombre as nombre_negocio,
  COUNT(p.id) as total_publicaciones,
  COUNT(CASE WHEN p.tipo_publicacion = 'promocion' THEN 1 END) as publicaciones_promocion,
  COUNT(CASE WHEN p.tipo_publicacion = 'producto' THEN 1 END) as publicaciones_producto,
  COUNT(CASE WHEN p.tipo_publicacion = 'evento' THEN 1 END) as publicaciones_evento,
  SUM((SELECT COUNT(*) FROM likes_publicaciones WHERE publicacion_id = p.id)) as total_likes,
  SUM((SELECT COUNT(*) FROM comentarios_publicaciones WHERE publicacion_id = p.id AND estado = 'activo')) as total_comentarios,
  SUM((SELECT COUNT(*) FROM compartir_publicaciones WHERE publicacion_id = p.id)) as total_compartidos,
  MAX(p.fecha_publicacion) as ultima_publicacion
FROM negocios n
LEFT JOIN publicaciones p ON n.id = p.negocio_id AND p.estado = 'activo'
GROUP BY n.id, n.nombre;

-- =====================================================
-- FUNCIONES DE UTILIDAD (CORREGIDAS)
-- =====================================================

-- Función para obtener el feed de publicaciones con paginación
CREATE OR REPLACE FUNCTION obtener_feed_publicaciones(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_categoria TEXT DEFAULT NULL
)
RETURNS TABLE (
  publicacion_id UUID,
  negocio_id UUID,
  nombre_negocio TEXT,
  categoria_negocio TEXT,
  logo_negocio TEXT,
  contenido TEXT,
  tipo_publicacion TEXT,
  nombre_producto TEXT,
  precio_producto DECIMAL, -- CORREGIDO: usar DECIMAL para 'valor'
  imagen_producto TEXT,
  total_likes BIGINT,
  total_comentarios BIGINT,
  total_compartidos BIGINT,
  total_fotos BIGINT,
  fecha_publicacion TIMESTAMP WITH TIME ZONE,
  fotos JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vpc.id,
    vpc.negocio_id,
    vpc.nombre_negocio,
    vpc.categoria_negocio,
    vpc.logo_negocio,
    vpc.contenido,
    vpc.tipo_publicacion,
    vpc.nombre_producto,
    vpc.precio_producto,
    vpc.imagen_producto,
    vpc.total_likes,
    vpc.total_comentarios,
    vpc.total_compartidos,
    vpc.total_fotos,
    vpc.fecha_publicacion,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', fp.id,
          'url', fp.url_imagen,
          'orden', fp.orden,
          'descripcion', fp.descripcion
        ) ORDER BY fp.orden
      ) FROM fotos_publicaciones fp WHERE fp.publicacion_id = vpc.id),
      '[]'::jsonb
    ) as fotos
  FROM vista_publicaciones_completa vpc
  WHERE (p_categoria IS NULL OR vpc.categoria_negocio = p_categoria)
  ORDER BY vpc.fecha_publicacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario dio like a una publicación
CREATE OR REPLACE FUNCTION usuario_dio_like_publicacion(
  p_publicacion_id UUID,
  p_usuario_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM likes_publicaciones 
    WHERE publicacion_id = p_publicacion_id 
    AND usuario_id = p_usuario_id
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS) - OPCIONAL
-- =====================================================

-- NOTA: Las políticas RLS pueden causar problemas si no están configuradas correctamente
-- Comenta estas líneas si tienes problemas con la autenticación

-- Habilitar RLS en todas las tablas
-- ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fotos_publicaciones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comentarios_publicaciones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes_publicaciones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes_comentarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compartir_publicaciones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE publicaciones_favoritas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reportes_publicaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para publicaciones
-- CREATE POLICY "Cualquiera puede ver publicaciones activas" ON publicaciones
--   FOR SELECT USING (estado = 'activo');

-- CREATE POLICY "Solo dueños de negocio pueden crear publicaciones" ON publicaciones
--   FOR INSERT WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM negocios 
--       WHERE id = negocio_id 
--       AND usuario_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Solo el creador puede actualizar sus publicaciones" ON publicaciones
--   FOR UPDATE USING (usuario_id = auth.uid());

-- CREATE POLICY "Solo el creador puede eliminar sus publicaciones" ON publicaciones
--   FOR DELETE USING (usuario_id = auth.uid());

-- Políticas para comentarios
-- CREATE POLICY "Cualquiera puede ver comentarios activos" ON comentarios_publicaciones
--   FOR SELECT USING (estado = 'activo');

-- CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON comentarios_publicaciones
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Solo el autor puede actualizar sus comentarios" ON comentarios_publicaciones
--   FOR UPDATE USING (usuario_id = auth.uid());

-- CREATE POLICY "Solo el autor puede eliminar sus comentarios" ON comentarios_publicaciones
--   FOR DELETE USING (usuario_id = auth.uid());

-- Políticas para likes
-- CREATE POLICY "Cualquiera puede ver likes" ON likes_publicaciones
--   FOR SELECT USING (true);

-- CREATE POLICY "Usuarios autenticados pueden dar/quitar likes" ON likes_publicaciones
--   FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- CONSULTAS DE PRUEBA
-- =====================================================

-- Consulta para verificar que las tablas se crearon correctamente
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%publicacion%' OR table_name LIKE '%comentario%' OR table_name LIKE '%like%';

-- Consulta para obtener publicaciones más populares
-- SELECT * FROM vista_publicaciones_completa 
-- ORDER BY total_likes DESC, total_comentarios DESC 
-- LIMIT 10;

-- Consulta para obtener feed de un usuario específico
-- SELECT * FROM obtener_feed_publicaciones(20, 0, 'Restaurante');

-- Consulta para estadísticas de un negocio
-- SELECT * FROM vista_estadisticas_publicaciones_negocio 
-- WHERE negocio_id = 'uuid-del-negocio';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. Este script está corregido para usar los nombres de columnas correctos de tu base de datos
-- 2. Las políticas RLS están comentadas para evitar problemas de autenticación
-- 3. Los triggers se ejecutarán automáticamente para mantener las fechas actualizadas
-- 4. Las vistas facilitan las consultas más comunes del feed social
-- 5. Los índices mejoran el rendimiento de las consultas
-- 6. El sistema permite múltiples fotos por publicación
-- 7. Se pueden linkear productos específicos a las publicaciones
-- 8. El sistema de comentarios permite respuestas anidadas
-- 9. Se incluye sistema de reportes para moderación
-- 10. Las funciones de utilidad facilitan operaciones comunes

-- =====================================================
-- CONFIGURACIÓN DE STORAGE (EJECUTAR EN SUPABASE DASHBOARD)
-- =====================================================

-- 1. Crear bucket 'publicaciones' en Storage
-- 2. Configurar políticas de Storage:
--    - Lectura pública: bucket_id = 'publicaciones'
--    - Escritura: solo usuarios autenticados
