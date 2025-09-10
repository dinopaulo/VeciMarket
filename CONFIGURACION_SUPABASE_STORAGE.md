# Configuración de Supabase Storage para Subida de Fotos

## Problema
Error "Network request failed" al intentar subir fotos a Supabase Storage.
**Error específico**: `new row violates row-level security policy` - Las políticas RLS bloquean la creación del bucket.

## Solución Implementada
**Se cambió el bucket de "publicaciones" a "Productos Imagenes"** - Este bucket ya existe y funciona correctamente en la aplicación.

## Solución

### ✅ SOLUCIÓN IMPLEMENTADA: Usar Bucket Existente

**Se cambió la lógica para usar el bucket "Productos Imagenes" que ya funciona correctamente.**

**Ventajas de esta solución:**
- ✅ No requiere crear nuevos buckets
- ✅ Usa la misma lógica probada de `AddProductView.js`
- ✅ Evita problemas de políticas RLS
- ✅ Funciona inmediatamente

### 2. Verificar Bucket "Productos Imagenes"

**El bucket "Productos Imagenes" ya debe existir y estar configurado correctamente.**

Para verificar:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Storage** en el menú lateral
3. Verifica que el bucket "Productos Imagenes" esté marcado como **Public**
4. Si no está marcado como público, haz clic en el botón "Public" para activarlo

### 3. Políticas de Seguridad (RLS)

**El bucket "Productos Imagenes" ya debe tener las políticas configuradas.**

Si necesitas verificar o crear las políticas, ve a **Policies** en el bucket "Productos Imagenes":

#### Política de Lectura (SELECT)
```sql
CREATE POLICY "Permitir lectura pública de fotos de productos" ON storage.objects
FOR SELECT USING (bucket_id = 'Productos Imagenes');
```

#### Política de Inserción (INSERT)
```sql
CREATE POLICY "Permitir inserción de fotos para usuarios autenticados" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Productos Imagenes' 
  AND auth.role() = 'authenticated'
);
```

**O más simple (para pruebas):**
```sql
CREATE POLICY "Permitir inserción pública" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'Productos Imagenes');
```

#### Política de Actualización (UPDATE)
```sql
CREATE POLICY "Permitir actualización de fotos propias" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Productos Imagenes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Política de Eliminación (DELETE)
```sql
CREATE POLICY "Permitir eliminación de fotos propias" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Productos Imagenes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Verificar Configuración

1. Asegúrate de que el bucket `Productos Imagenes` esté marcado como **público**
2. Verifica que las políticas RLS estén activas
3. Confirma que tu aplicación tenga permisos de Storage

### 5. Configuración de la Aplicación

El código ya está actualizado para:
- **Usar el bucket "Productos Imagenes"** que ya funciona correctamente
- Usar la nueva sintaxis de ImagePicker
- Manejar errores de red
- Proporcionar logs detallados
- Verificar la conexión con Supabase

### 6. Pruebas

1. Abre la vista de crear publicación
2. Revisa los logs en la consola para verificar la conexión
3. Intenta subir una foto
4. Verifica que aparezcan los logs de subida

### 7. Solución de Problemas Específicos

**Para tu caso específico** (ahora usando bucket existente):

1. **Verifica que el bucket "Productos Imagenes" existe** y está marcado como público
2. **Reinicia la aplicación** - Es necesario reiniciar para que los cambios surtan efecto
3. **Verifica la conexión a internet** - Asegúrate de tener conexión estable
4. **Revisa los logs de la consola** - El código ahora muestra más detalles
5. **Prueba con una imagen más pequeña** (menos de 1MB)

### 8. Pasos de Diagnóstico

1. **Abre la vista de crear publicación**
2. **Revisa los logs en la consola**:
   - `Usuario autenticado: [email]`
   - `Buckets disponibles: [...]`
   - `Bucket "Productos Imagenes" encontrado: {...}`
3. **Si aparece "Buckets disponibles: []"**:
   - Verifica que el bucket esté marcado como público
   - Confirma que las políticas RLS estén activas
   - Revisa la conexión a internet

### 9. Logs Útiles

El código ahora incluye logs detallados:
- `Probando conexión con Supabase Storage...`
- `Buckets disponibles: [...]`
- `Bucket "Productos Imagenes" encontrado: {...}`
- `Iniciando subida de foto: ...`
- `Foto subida exitosamente: ...`

Revisa estos logs en la consola para diagnosticar problemas.
