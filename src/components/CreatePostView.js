import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, TextInput, Animated, Dimensions, SafeAreaView } from 'react-native';
import { Button, Card, Layout } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

export default function CreatePostView({ userProfile, onClose, onPostCreated }) {
  const [contenido, setContenido] = useState('');
  const [tipoPublicacion, setTipoPublicacion] = useState('general');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [negocioId, setNegocioId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const TIPOS_PUBLICACION = [
    { text: 'General', value: 'general', icon: 'chatbubble-outline', color: '#6B7280' },
    { text: 'Promoción', value: 'promocion', icon: 'pricetag-outline', color: '#F59E0B' },
    { text: 'Producto', value: 'producto', icon: 'cube-outline', color: '#10B981' },
    { text: 'Evento', value: 'evento', icon: 'calendar-outline', color: '#8B5CF6' },
    { text: 'Noticia', value: 'noticia', icon: 'newspaper-outline', color: '#EF4444' }
  ];

  useEffect(() => {
    loadUserBusiness();
    loadProducts();
    testSupabaseConnection();
    
    // Animar entrada del modal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Probar conexión con Supabase Storage
  const testSupabaseConnection = async () => {
    try {
      console.log('=== DIAGNÓSTICO COMPLETO DE SUPABASE STORAGE ===');
      
      // 1. Verificar configuración básica
      console.log('1. Verificando configuración de Supabase...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        Alert.alert('Error de Autenticación', 'No se pudo verificar la autenticación');
        return;
      }
      console.log('✅ Usuario autenticado:', user?.email);
      
      // 2. Verificar configuración del cliente
      console.log('2. Verificando configuración del cliente...');
      console.log('URL de Supabase:', supabase.supabaseUrl);
      console.log('Clave anónima configurada:', supabase.supabaseKey ? 'Sí' : 'No');
      
      // 3. Probar acceso directo a buckets conocidos
      console.log('3. Probando acceso directo a buckets...');
      const knownBuckets = ['publicaciones', 'Productos Imagenes', 'Perfiles', 'Logo Negocios'];
      
      for (const bucketName of knownBuckets) {
        try {
          console.log(`🔄 Probando acceso directo a "${bucketName}"...`);
          const { data: files, error: filesError } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 1 });
            
          if (filesError) {
            console.log(`❌ Error con "${bucketName}":`, filesError.message);
          } else {
            console.log(`✅ Acceso exitoso a "${bucketName}". Archivos:`, files);
            // Si podemos acceder directamente, usar este bucket
            Alert.alert(
              'Bucket Encontrado', 
              `Se encontró acceso directo al bucket "${bucketName}". La aplicación funcionará correctamente.`
            );
            return;
          }
        } catch (bucketError) {
          console.log(`❌ Error general con "${bucketName}":`, bucketError.message);
        }
      }
      
      // 4. Intentar listar buckets (esto puede fallar por RLS)
      console.log('4. Intentando listar buckets...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error al listar buckets:', bucketsError);
        console.log('Detalles del error:', {
          message: bucketsError.message,
          details: bucketsError.details,
          hint: bucketsError.hint,
          code: bucketsError.code
        });
        
        // Esto es normal - listBuckets puede fallar por RLS
        console.log('ℹ️ Error al listar buckets es normal si las políticas RLS no permiten listar buckets');
        Alert.alert(
          'Diagnóstico Completado', 
          'No se pueden listar buckets (normal por RLS), pero se probará acceso directo al subir fotos.'
        );
        return;
      }
      
      console.log('✅ Buckets disponibles:', buckets);
      console.log('📋 Lista de buckets:', buckets.map(b => `- ${b.name} (${b.public ? 'Público' : 'Privado'})`));
      
      // 5. Buscar buckets específicos
      const productosBucket = buckets.find(bucket => bucket.name === 'Productos Imagenes');
      const publicacionesBucket = buckets.find(bucket => bucket.name === 'publicaciones');
      
      console.log('5. Análisis de buckets:');
      console.log('- Productos Imagenes:', productosBucket ? '✅ Encontrado' : '❌ No encontrado');
      console.log('- publicaciones:', publicacionesBucket ? '✅ Encontrado' : '❌ No encontrado');
      
      if (productosBucket || publicacionesBucket) {
        const bucketToUse = productosBucket || publicacionesBucket;
        console.log(`✅ Usando bucket "${bucketToUse.name}"`);
        
        // Probar acceso al bucket
        const { data: files, error: filesError } = await supabase.storage
          .from(bucketToUse.name)
          .list('', { limit: 1 });
          
        if (filesError) {
          console.error('❌ Error al acceder al bucket:', filesError);
        } else {
          console.log('✅ Acceso al bucket exitoso. Archivos:', files);
        }
      } else {
        console.log('ℹ️ No se encontraron buckets en la lista, pero se probará acceso directo');
      }
      
    } catch (error) {
      console.error('❌ Error general en diagnóstico:', error);
      Alert.alert('Error de Diagnóstico', 'Error inesperado al verificar Storage');
    }
  };

  // Cargar el negocio del usuario
  const loadUserBusiness = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business, error } = await supabase
        .from('negocios')
        .select('id, nombre')
        .eq('usuario_id', user.id)
        .single();

      if (error) {
        console.error('Error al cargar negocio:', error);
        Alert.alert('Error', 'No se pudo cargar la información del negocio');
        return;
      }

      setNegocioId(business?.id);
    } catch (error) {
      console.error('Error general:', error);
    }
  };

  // Cargar productos del negocio
  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business, error: businessError } = await supabase
        .from('negocios')
        .select('id')
        .eq('usuario_id', user.id)
        .single();

      if (businessError || !business) return;

      const { data: products, error: productsError } = await supabase
        .from('productos')
        .select('id, nombre, valor, imagen_url')
        .eq('negocio_id', business.id)
        .order('nombre');

      if (productsError) {
        console.error('Error al cargar productos:', productsError);
        return;
      }

      setProductos(products || []);
    } catch (error) {
      console.error('Error general:', error);
    }
  };

  // Seleccionar fotos
  const selectPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7, // Reducir calidad para mejor rendimiento
        maxImages: 5 - fotos.length,
        exif: false, // Deshabilitar EXIF para mejor rendimiento
      });

      if (!result.canceled && result.assets) {
        console.log('Fotos seleccionadas:', result.assets.length);
        
        const nuevasFotos = result.assets.map((asset, index) => ({
          id: `temp_${Date.now()}_${index}`,
          uri: asset.uri,
          orden: fotos.length + index + 1,
          isLocal: true,
          size: asset.fileSize || 0,
          width: asset.width || 0,
          height: asset.height || 0
        }));
        
        setFotos(prev => [...prev, ...nuevasFotos]);
        console.log('Fotos agregadas al estado:', nuevasFotos.length);
      }
    } catch (error) {
      console.error('Error al seleccionar fotos:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las fotos');
    }
  };

  // Eliminar foto
  const removePhoto = (photoId) => {
    setFotos(prev => prev.filter(foto => foto.id !== photoId));
  };

  // Subir foto a Supabase Storage (con múltiples intentos)
  const uploadPhoto = async (photoUri, publicacionId, orden) => {
    try {
      console.log('=== INICIANDO SUBIDA DE FOTO ===');
      console.log('URI:', photoUri);
      console.log('Publicación ID:', publicacionId);
      console.log('Orden:', orden);
      
      const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${publicacionId}_${orden}_${Date.now()}.${fileExt}`;
      
      console.log('Preparando archivo:', { fileName, fileExt });

      const response = await fetch(photoUri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('ArrayBuffer creado, tamaño:', arrayBuffer.byteLength);

      // Lista de buckets a probar en orden de prioridad (basado en los que viste en el dashboard)
      const bucketsToTry = [
        'publicaciones',
        'Productos Imagenes',
        'Perfiles',
        'Logo Negocios',
        'test-uploads'
      ];

      for (const bucketName of bucketsToTry) {
        try {
          console.log(`🔄 Intentando subir a bucket: "${bucketName}"`);
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, arrayBuffer, {
              contentType: `image/${fileExt}`,
              upsert: false
            });

          if (error) {
            console.log(`❌ Error con bucket "${bucketName}":`, error.message);
            continue; // Intentar siguiente bucket
          }

          console.log(`✅ Foto subida exitosamente a "${bucketName}":`, data);

          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          console.log('✅ URL pública generada:', publicUrl);
          return publicUrl;
          
        } catch (bucketError) {
          console.log(`❌ Error general con bucket "${bucketName}":`, bucketError.message);
          continue;
        }
      }

      // Si llegamos aquí, ningún bucket funcionó
      console.error('❌ No se pudo subir la foto a ningún bucket');
      Alert.alert(
        'Error de Subida', 
        'No se pudo subir la foto. Verifica que tengas buckets configurados en Supabase Storage.'
      );
      return null;

    } catch (error) {
      console.error('❌ Error general al subir foto:', error);
      Alert.alert('Error', 'Error inesperado al subir la foto');
      return null;
    }
  };

  // Función de prueba para verificar fotos
  const testPhotoUpload = async () => {
    console.log('=== PRUEBA DE SUBIDA DE FOTOS ===');
    console.log('Fotos seleccionadas:', fotos);
    
    if (fotos.length === 0) {
      Alert.alert('Sin fotos', 'No hay fotos seleccionadas para probar');
      return;
    }

    try {
      const testPhoto = fotos[0];
      console.log('Probando subida de foto:', testPhoto);
      
      const publicUrl = await uploadPhoto(testPhoto.uri, 'test_' + Date.now(), 1);
      
      if (publicUrl) {
        console.log('✅ Foto subida exitosamente:', publicUrl);
        Alert.alert('Éxito', `Foto subida correctamente:\n${publicUrl}`);
      } else {
        console.log('❌ Error al subir foto');
        Alert.alert('Error', 'No se pudo subir la foto');
      }
    } catch (error) {
      console.error('Error en prueba:', error);
      Alert.alert('Error', 'Error al probar subida de foto');
    }
  };

  // Crear publicación
  const createPost = async () => {
    if (!contenido.trim()) {
      Alert.alert('Error', 'El contenido de la publicación es obligatorio');
      return;
    }

    if (!negocioId) {
      Alert.alert('Error', 'No se pudo obtener la información del negocio');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      // Crear la publicación
      const { data: publicacion, error: publicacionError } = await supabase
        .from('publicaciones')
        .insert({
          negocio_id: negocioId,
          usuario_id: user.id,
          contenido: contenido.trim(),
          tipo_publicacion: tipoPublicacion,
          producto_id: productoSeleccionado?.id || null,
          estado: 'activo'
        })
        .select()
        .single();

      if (publicacionError) {
        console.error('Error al crear publicación:', publicacionError);
        Alert.alert('Error', 'No se pudo crear la publicación');
        return;
      }

      // Subir fotos si las hay
      if (fotos.length > 0) {
        console.log('Iniciando subida de', fotos.length, 'fotos');
        const fotosData = [];
        let fotosSubidas = 0;
        
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          console.log(`Subiendo foto ${i + 1}/${fotos.length}:`, foto.uri);
          
          const url = await uploadPhoto(foto.uri, publicacion.id, foto.orden);
          
          if (url) {
            fotosData.push({
              publicacion_id: publicacion.id,
              url_imagen: url,
              orden: foto.orden,
              descripcion: null
            });
            fotosSubidas++;
            console.log(`Foto ${i + 1} subida exitosamente`);
          } else {
            console.log(`Error al subir foto ${i + 1}`);
          }
        }

        console.log(`Fotos subidas: ${fotosSubidas}/${fotos.length}`);

        // Insertar fotos en la base de datos
        if (fotosData.length > 0) {
          const { error: fotosError } = await supabase
            .from('fotos_publicaciones')
            .insert(fotosData);

          if (fotosError) {
            console.error('Error al guardar fotos en BD:', fotosError);
            Alert.alert('Advertencia', 'La publicación se creó pero algunas fotos no se pudieron guardar');
          } else {
            console.log('Fotos guardadas en BD exitosamente');
          }
        } else if (fotos.length > 0) {
          Alert.alert('Advertencia', 'La publicación se creó pero no se pudieron subir las fotos');
        }
      }

      Alert.alert('Éxito', 'Publicación creada correctamente', [
        {
          text: 'OK',
          onPress: () => {
            onPostCreated && onPostCreated();
            onClose && onClose();
          }
        }
      ]);

    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la publicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.viewContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Crear Publicación</Text>
            <Text style={styles.headerSubtitle}>Comparte con tu comunidad</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Indicador de progreso moderno */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso del contenido</Text>
              <Text style={styles.progressText}>
                {contenido.length}/500
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, (contenido.length / 500) * 100)}%` }
                ]}
              />
            </View>
          </View>

          {/* Contenido */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Contenido de la publicación</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                multiline
                placeholder="¿Qué está pasando en tu negocio? Comparte novedades, promociones o eventos..."
                placeholderTextColor="#9CA3AF"
                value={contenido}
                onChangeText={setContenido}
                style={styles.contentInput}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </View>

          {/* Tipo de publicación */}
          <View style={styles.selectorContainer}>
            <View style={styles.selectorLabelContainer}>
              <Ionicons name="layers-outline" size={20} color={colors.primary} />
              <Text style={styles.selectorLabel}>Tipo de publicación</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipoScrollContainer}>
              <View style={styles.tipoButtonsContainer}>
                {TIPOS_PUBLICACION.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.tipoButton,
                      tipoPublicacion === tipo.value && [styles.tipoButtonActive, { backgroundColor: tipo.color }]
                    ]}
                    onPress={() => setTipoPublicacion(tipo.value)}
                  >
                    <Ionicons 
                      name={tipo.icon} 
                      size={18} 
                      color={tipoPublicacion === tipo.value ? 'white' : tipo.color} 
                      style={styles.tipoButtonIcon}
                    />
                    <Text style={[
                      styles.tipoButtonText,
                      tipoPublicacion === tipo.value && styles.tipoButtonTextActive
                    ]}>
                      {tipo.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Selector de producto */}
          <View style={styles.selectorContainer}>
            <View style={styles.selectorLabelContainer}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <Text style={styles.selectorLabel}>Producto relacionado (opcional)</Text>
            </View>
            <TouchableOpacity
              style={styles.productSelector}
              onPress={() => setShowProductModal(true)}
            >
              <View style={styles.productSelectorContent}>
                <Ionicons 
                  name={productoSeleccionado ? "checkmark-circle" : "add-circle-outline"} 
                  size={24} 
                  color={productoSeleccionado ? colors.success : colors.primary} 
                />
                <Text style={styles.productSelectorText}>
                  {productoSeleccionado ? productoSeleccionado.nombre : 'Seleccionar producto'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {productoSeleccionado && (
              <TouchableOpacity
                style={styles.removeProductButton}
                onPress={() => setProductoSeleccionado(null)}
              >
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.removeProductText}>Quitar producto</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Fotos */}
          <View style={styles.photosContainer}>
            <View style={styles.selectorLabelContainer}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.selectorLabel}>Fotos ({fotos.length}/5)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollContainer}>
              <View style={styles.photosList}>
                {fotos.map((foto) => (
                  <View key={foto.id} style={styles.photoItem}>
                    <Image source={{ uri: foto.uri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(foto.id)}
                    >
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {fotos.length < 5 && (
                  <TouchableOpacity style={styles.addPhotoButton} onPress={selectPhotos}>
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addPhotoGradient}
                    >
                      <Ionicons name="camera" size={24} color="white" />
                      <Text style={styles.addPhotoText}>Agregar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Botón de prueba temporal */}
          {fotos.length > 0 && (
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.danger, marginBottom: 10 }]}
              onPress={testPhotoUpload}
            >
              <Text style={styles.createButtonText}>🧪 Probar Subida de Foto</Text>
            </TouchableOpacity>
          )}

          {/* Botón crear */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (!contenido.trim() || loading) && styles.createButtonDisabled
            ]}
            onPress={createPost}
            disabled={loading || !contenido.trim()}
          >
            <LinearGradient
              colors={(!contenido.trim() || loading) ? ['#9CA3AF', '#6B7280'] : [colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <Ionicons 
                name={loading ? "cloud-upload-outline" : "rocket-outline"} 
                size={20} 
                color="white" 
                style={styles.createButtonIcon}
              />
              <Text style={styles.createButtonText}>
                {loading ? 'Publicando...' : 'Crear Publicación'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Modal de selección de producto */}
      {showProductModal && (
        <View style={styles.productModalOverlay}>
          <View style={styles.productModal}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.productModalHeader}
            >
              <Text style={styles.productModalTitle}>Seleccionar Producto</Text>
              <TouchableOpacity style={styles.productModalCloseButton} onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.productOption}
                onPress={() => {
                  setProductoSeleccionado(null);
                  setShowProductModal(false);
                }}
              >
                <View style={styles.productOptionContent}>
                  <Ionicons name="remove-circle-outline" size={24} color="#6B7280" />
                  <Text style={styles.productOptionText}>Sin producto</Text>
                </View>
              </TouchableOpacity>
              
              {productos.map((producto) => (
                <TouchableOpacity
                  key={producto.id}
                  style={styles.productOption}
                  onPress={() => {
                    setProductoSeleccionado(producto);
                    setShowProductModal(false);
                  }}
                >
                  <View style={styles.productOptionContent}>
                    {producto.imagen_url ? (
                      <Image source={{ uri: producto.imagen_url }} style={styles.productOptionImage} />
                    ) : (
                      <View style={styles.productOptionImagePlaceholder}>
                        <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.productOptionInfo}>
                      <Text style={styles.productOptionName}>{producto.nombre}</Text>
                      <Text style={styles.productOptionPrice}>${producto.valor}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  viewContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  productModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 40,
  },
  closeButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 8,
  },
  inputWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    minHeight: 140,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    color: '#374151',
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 8,
  },
  tipoScrollContainer: {
    marginHorizontal: -4,
  },
  tipoButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 12,
  },
  tipoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  tipoButtonActive: {
    borderColor: 'transparent',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tipoButtonIcon: {
    marginRight: 6,
  },
  tipoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tipoButtonTextActive: {
    color: 'white',
  },
  productSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productSelectorText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 12,
  },
  removeProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  removeProductText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
    marginLeft: 6,
  },
  photosContainer: {
    marginBottom: 24,
  },
  photosScrollContainer: {
    marginHorizontal: -4,
  },
  photosList: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 15,
  },
  photoItem: {
    position: 'relative',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addPhotoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    marginTop: 4,
  },
  createButton: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  createButtonDisabled: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productModal: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  productModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  productModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  productModalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  productList: {
    maxHeight: 500,
    paddingHorizontal: 16,
  },
  productOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 12,
  },
  productOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  productOptionImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  productOptionPrice: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },
});