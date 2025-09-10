import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { Layout, Text, Card, Button, Icon, Input } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

// Iconos
const SearchIcon = (props) => (
  <Icon {...props} name='search-outline'/>
);

const HeartIcon = (props) => (
  <Icon {...props} name='heart'/>
);

const HeartOutlineIcon = (props) => (
  <Icon {...props} name='heart-outline'/>
);

const StarIcon = (props) => (
  <Icon {...props} name='star'/>
);

const LocationIcon = (props) => (
  <Icon {...props} name='pin-outline'/>
);

const PhoneIcon = (props) => (
  <Icon {...props} name='phone-outline'/>
);

const TrashIcon = (props) => (
  <Icon {...props} name='trash-2-outline'/>
);

export default function FavoritesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredFavorites = favorites.filter(post =>
    post.contenido.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.nombre_negocio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.categoria_negocio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cargar publicaciones favoritas
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No hay usuario autenticado');
        return;
      }

      console.log('Cargando favoritos para usuario:', user.id);

      // Primero obtener los IDs de las publicaciones favoritas
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('publicaciones_favoritas')
        .select('id, publicacion_id, fecha_guardado')
        .eq('usuario_id', user.id)
        .order('fecha_guardado', { ascending: false });

      console.log('Favoritos encontrados:', favoritesData);

      if (favoritesError) {
        console.error('Error al cargar favoritos:', favoritesError);
        return;
      }

      if (!favoritesData || favoritesData.length === 0) {
        console.log('No se encontraron favoritos');
        setFavorites([]);
        return;
      }

      // Obtener los IDs de las publicaciones
      const publicacionIds = favoritesData.map(fav => fav.publicacion_id);
      console.log('IDs de publicaciones a cargar:', publicacionIds);

      // Cargar las publicaciones
      const { data: publicacionesData, error: publicacionesError } = await supabase
        .from('publicaciones')
        .select(`
          id,
          contenido,
          fecha_publicacion,
          tipo_publicacion,
          producto_id,
          estado,
          fecha_publicacion,
          fecha_actualizacion,
          metadata,
          negocio_id,
          usuario_id
        `)
        .in('id', publicacionIds);

      console.log('Publicaciones cargadas:', publicacionesData);

      if (publicacionesError) {
        console.error('Error al cargar publicaciones:', publicacionesError);
        return;
      }

      // Cargar fotos para cada publicación
      const publicacionesConFotos = await Promise.all(
        publicacionesData.map(async (publicacion) => {
          const { data: fotosData } = await supabase
            .from('fotos_publicaciones')
            .select('url_imagen, orden')
            .eq('publicacion_id', publicacion.id)
            .order('orden');

          return {
            ...publicacion,
            fotos: fotosData ? fotosData.map(foto => foto.url_imagen) : []
          };
        })
      );

      // Cargar información de negocios
      const negocioIds = [...new Set(publicacionesConFotos.map(p => p.negocio_id))];
      const { data: negociosData } = await supabase
        .from('negocios')
        .select('id, nombre, categoria, logo_url, whatsapp')
        .in('id', negocioIds);

      // Cargar información de productos
      const productoIds = [...new Set(publicacionesConFotos.map(p => p.producto_id).filter(Boolean))];
      let productosData = [];
      if (productoIds.length > 0) {
        const { data: productos } = await supabase
          .from('productos')
          .select('id, nombre, descripcion, precio, imagen_url, tipo_producto, categoria, stock, disponibilidad, descuento, precio_especial, es_promocion')
          .in('id', productoIds);
        productosData = productos || [];
      }

      // Combinar todos los datos
      const favoritePosts = publicacionesConFotos.map(publicacion => {
        const favoriteInfo = favoritesData.find(fav => fav.publicacion_id === publicacion.id);
        const negocio = negociosData?.find(n => n.id === publicacion.negocio_id);
        const producto = productosData.find(p => p.id === publicacion.producto_id);

        return {
          ...publicacion,
          favorite_id: favoriteInfo.id,
          fecha_guardado: favoriteInfo.fecha_guardado,
          nombre_negocio: negocio?.nombre || 'Negocio',
          categoria_negocio: negocio?.categoria || 'General',
          logo_negocio: negocio?.logo_url,
          whatsapp_negocio: negocio?.whatsapp,
          nombre_producto: producto?.nombre,
          descripcion_producto: producto?.descripcion,
          precio_producto: producto?.precio,
          imagen_producto: producto?.imagen_url,
          tipo_producto: producto?.tipo_producto,
          categoria_producto: producto?.categoria,
          stock_producto: producto?.stock,
          disponibilidad_producto: producto?.disponibilidad,
          descuento_producto: producto?.descuento,
          precio_especial_producto: producto?.precio_especial,
          es_promocion_producto: producto?.es_promocion
        };
      });

      console.log('Favoritos procesados:', favoritePosts);
      setFavorites(favoritePosts);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quitar de favoritos
  const removeFavorite = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from('publicaciones_favoritas')
        .delete()
        .eq('id', favoriteId);

      if (error) {
        console.error('Error al quitar de favoritos:', error);
        Alert.alert('Error', 'No se pudo quitar de favoritos');
        return;
      }

      // Actualizar la lista local
      setFavorites(prev => prev.filter(post => post.favorite_id !== favoriteId));
      Alert.alert('Éxito', 'Se quitó de favoritos');
    } catch (error) {
      console.error('Error al quitar de favoritos:', error);
      Alert.alert('Error', 'No se pudo quitar de favoritos');
    }
  };

  // Toggle favorite con confirmación
  const toggleFavorite = (favoriteId) => {
    Alert.alert(
      'Eliminar de Favoritos',
      '¿Estás seguro de que quieres eliminar esta publicación de tus favoritos?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeFavorite(favoriteId)
        },
      ]
    );
  };

  // Refresh control
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  // Cargar favoritos al montar el componente
  useEffect(() => {
    loadFavorites();
  }, []);

  // Función para formatear tiempo
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'unos segundos';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} días`;
    return `${Math.floor(diffInSeconds / 2592000)} meses`;
  };

  const handleContact = (business) => {
    // Aquí iría la lógica para contactar al negocio
    console.log('Contactando:', business.name);
  };

  const handleViewDetails = (business) => {
    // Aquí iría la lógica para ver detalles del negocio
    console.log('Ver detalles de:', business.name);
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Input
        placeholder="Buscar en favoritos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessoryLeft={SearchIcon}
        style={styles.searchInput}
        size="medium"
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <HeartOutlineIcon style={styles.emptyIcon} fill={colors.lightGray} />
      <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
      <Text style={styles.emptySubtitle}>
        Las publicaciones que marques como favoritas aparecerán aquí
      </Text>
    </View>
  );

  const renderFavoriteCard = (post) => (
    <View key={post.id} style={styles.postCard}>
      {/* Header del post - idéntico a PostCard */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <View style={styles.businessLogoContainer}>
            {post.logo_negocio ? (
              <Image 
                source={{ uri: post.logo_negocio }} 
                style={styles.businessLogo}
              />
            ) : (
              <View style={styles.businessLogoPlaceholder}>
                <Icon name="briefcase" style={styles.businessLogoIcon} fill={colors.secondary} />
              </View>
            )}
          </View>
          
          <View style={styles.businessDetails}>
            <Text style={styles.businessName}>{post.nombre_negocio}</Text>
            <Text style={styles.businessCategory}>{post.categoria_negocio}</Text>
            <Text style={styles.postTime}>
              Guardado hace {getTimeAgo(post.fecha_guardado)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(post.favorite_id)}
        >
          <HeartIcon style={styles.favoriteIcon} fill={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Contenido del post - idéntico a PostCard */}
      <Text style={styles.content}>{post.contenido}</Text>

      {/* Información del producto - idéntico a PostCard */}
      {post.nombre_producto && (
        <View style={styles.productInfo}>
          <View style={styles.productImageContainer}>
            {post.imagen_producto ? (
              <Image 
                source={{ uri: post.imagen_producto }} 
                style={styles.productImage}
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Icon name="cube" style={styles.productIcon} fill={colors.white} />
              </View>
            )}
          </View>
          
          <View style={styles.productDetails}>
            <Text style={styles.productLabel}>Producto relacionado:</Text>
            <Text style={styles.productName}>{post.nombre_producto}</Text>
            <Text style={styles.productPrice}>${post.precio_producto}</Text>
          </View>
          
          <View style={styles.productArrow}>
            <Icon name="arrow-forward" style={styles.arrowIcon} fill={colors.white} />
          </View>
        </View>
      )}

      {/* Fotos - idéntico a PostCard */}
      {post.fotos && post.fotos.length > 0 && (
        <View style={styles.photosContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {post.fotos.map((foto, index) => (
              <Image
                key={index}
                source={{ uri: foto }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <Layout style={styles.container}>
      {/* Header consistente con otras vistas */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerBackground}>
          <View style={styles.headerGradient} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appLogoContainer}>
              <HeartIcon style={styles.appLogoIcon} fill={colors.white} />
            </View>
            <View style={styles.appTitleContainer}>
              <Text style={styles.appTitle}>Favoritos</Text>
              <Text style={styles.appSubtitle}>Tus productos preferidos</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        {renderSearchBar()}
        
        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Cargando favoritos...</Text>
          </View>
        ) : filteredFavorites.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.favoritesContainer}>
            {filteredFavorites.map(renderFavoriteCard)}
          </View>
        )}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Header consistente con otras vistas
  enhancedHeader: {
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
  },
  headerGradient: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appLogoIcon: {
    width: 24,
    height: 24,
  },
  appTitleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 18,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  // Estilos idénticos a PostCard
  postCard: {
    backgroundColor: colors.white,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  businessLogoContainer: {
    marginRight: 12,
  },
  businessLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  businessLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogoIcon: {
    width: 24,
    height: 24,
  },
  businessDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.7,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
  },
  content: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIcon: {
    width: 24,
    height: 24,
  },
  productDetails: {
    flex: 1,
  },
  productLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  productArrow: {
    marginLeft: 8,
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  photosContainer: {
    marginBottom: 12,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 8,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  favoritesContainer: {
    gap: 16,
  },
});
