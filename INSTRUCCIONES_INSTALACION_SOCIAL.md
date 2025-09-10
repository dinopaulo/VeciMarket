# 📋 Instrucciones de Instalación - Sistema Social

## 🚨 IMPORTANTE: Script Corregido

He creado un script corregido que es compatible con tu esquema de base de datos actual. Usa el archivo `database_social_system_corregido.sql` en lugar del original.

## 🔧 Pasos de Instalación

### 1. Ejecutar Script de Base de Datos

```sql
-- Ejecuta este archivo en tu base de datos Supabase:
-- database_social_system_corregido.sql
```

**Cambios realizados en el script corregido:**
- ✅ Usa `correo` en lugar de `email` (tabla usuarios)
- ✅ Usa `valor` en lugar de `precio` (tabla productos)
- ✅ Políticas RLS comentadas para evitar problemas de autenticación
- ✅ Compatible con tu esquema actual

### 2. Configurar Supabase Storage

1. Ve a tu dashboard de Supabase
2. Navega a **Storage**
3. Crea un nuevo bucket llamado `publicaciones`
4. Configura las políticas de acceso:

```sql
-- Política para lectura pública
CREATE POLICY "Publicaciones son públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'publicaciones');

-- Política para subida (solo usuarios autenticados)
CREATE POLICY "Usuarios pueden subir fotos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'publicaciones' AND auth.role() = 'authenticated');
```

### 3. Verificar Instalación

Ejecuta estas consultas para verificar que todo se instaló correctamente:

```sql
-- Verificar que las tablas se crearon
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%publicacion%' OR table_name LIKE '%comentario%' OR table_name LIKE '%like%');

-- Verificar que las vistas se crearon
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE '%publicacion%';
```

### 4. Probar el Sistema

```sql
-- Insertar una publicación de prueba (reemplaza los UUIDs con valores reales)
INSERT INTO publicaciones (negocio_id, usuario_id, contenido, tipo_publicacion)
VALUES (
  'tu-negocio-id-aqui',
  'tu-usuario-id-aqui', 
  '¡Hola! Esta es mi primera publicación en VeciMarket',
  'general'
);

-- Ver la publicación en la vista
SELECT * FROM vista_publicaciones_completa LIMIT 5;
```

## 🎯 Componentes React Native

Los componentes ya están actualizados y son compatibles con tu esquema:

- ✅ `CreatePostView.js` - Usa `valor` en lugar de `precio`
- ✅ `PostCard.js` - Compatible con la vista corregida
- ✅ `CommentsModal.js` - Usa `correo` en lugar de `email`
- ✅ `SocialFeedView.js` - Usa la vista corregida

## 🔍 Solución de Problemas

### Error: "column does not exist"
- **Causa**: El script original usaba nombres de columnas incorrectos
- **Solución**: Usa el script corregido `database_social_system_corregido.sql`

### Error: "permission denied"
- **Causa**: Políticas RLS muy restrictivas
- **Solución**: Las políticas están comentadas en el script corregido

### Error: "bucket does not exist"
- **Causa**: No se creó el bucket de Storage
- **Solución**: Crea el bucket `publicaciones` en Supabase Storage

### Error: "function does not exist"
- **Causa**: Las funciones no se crearon correctamente
- **Solución**: Ejecuta solo la sección de funciones del script

## 📱 Próximos Pasos

1. **Ejecuta el script corregido**
2. **Configura Storage**
3. **Prueba la app**
4. **Crea tu primera publicación**

## 🆘 Si Tienes Problemas

1. Verifica que todas las tablas base existan (`usuarios`, `negocios`, `productos`)
2. Asegúrate de usar el script corregido
3. Revisa los logs de Supabase para errores específicos
4. Las políticas RLS están comentadas por defecto para evitar problemas

## ✅ Lista de Verificación

- [ ] Script corregido ejecutado
- [ ] Bucket `publicaciones` creado
- [ ] Políticas de Storage configuradas
- [ ] Tablas sociales creadas
- [ ] Vistas funcionando
- [ ] App probada

¡El sistema social estará listo para usar! 🎉
