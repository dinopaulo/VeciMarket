import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, RefreshControl, Alert } from 'react-native';
import { Button, Icon, Input } from '@ui-kitten/components';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import PostCard from './PostCard';
import CreatePostView from './CreatePostView';
import ProductDetailView from './ProductDetailView';

export default function SocialFeedView({ userProfile, onNavigateToBusiness }) {
  console.log('🚀 SocialFeedView: Componente iniciado');
  console.log('👤 userProfile:', userProfile);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const POSTS_PER_PAGE = 10;

  const CATEGORIAS = [
    'Todos', 'Restaurante', 'Tienda', 'Servicios', 'Salud', 
    'Educación', 'Transporte', 'Entretenimiento', 'Tecnología', 'Otros'
  ];

  // Iconos
  const SearchIcon = (props) => <Icon {...props} name='search'/>;
  const PlusIcon = (props) => <Icon {...props} name='plus'/>;
  const FilterIcon = (props) => <Icon {...props} name='funnel'/>;

  useEffect(() => {
    testDatabaseConnection();
    loadPosts(true);
  }, [selectedCategory]);

  // Función para probar la conexión a la base de datos
  const testDatabaseConnection = async () => {
    try {
      console.log('=== PROBANDO CONEXIÓN A BASE DE DATOS ===');
      
      // Probar tabla publicaciones
      const { data: publicaciones, error: publicacionesError } = await supabase
        .from('publicaciones')
        .select('*')
        .limit(1);
      
      if (publicacionesError) {
        console.error('❌ Error en tabla publicaciones:', publicacionesError);
      } else {
        console.log('✅ Tabla publicaciones accesible:', publicaciones?.length || 0, 'registros');
      }

      // Probar vista vista_publicaciones_completa
      const { data: vista, error: vistaError } = await supabase
        .from('vista_publicaciones_completa')
        .select('*')
        .limit(1);
      
      if (vistaError) {
        console.error('❌ Error en vista vista_publicaciones_completa:', vistaError);
        console.log('Detalles del error:', {
          message: vistaError.message,
          details: vistaError.details,
          hint: vistaError.hint,
          code: vistaError.code
        });
      } else {
        console.log('✅ Vista vista_publicaciones_completa accesible:', vista?.length || 0, 'registros');
      }

      // Probar tabla fotos_publicaciones
      const { data: fotos, error: fotosError } = await supabase
        .from('fotos_publicaciones')
        .select('*')
        .limit(1);
      
      if (fotosError) {
        console.error('❌ Error en tabla fotos_publicaciones:', fotosError);
      } else {
        console.log('✅ Tabla fotos_publicaciones accesible:', fotos?.length || 0, 'registros');
      }

      console.log('=== FIN PRUEBA BASE DE DATOS ===');
    } catch (error) {
      console.error('❌ Error general en prueba de base de datos:', error);
    }
  };

  // Cargar publicaciones
  const loadPosts = async (reset = false) => {
    try {
      console.log('=== CARGANDO PUBLICACIONES ===');
      console.log('Reset:', reset);
      console.log('Categoría seleccionada:', selectedCategory);
      console.log('Query de búsqueda:', searchQuery);
      
      if (reset) {
        setLoading(true);
        setCurrentPage(0);
        setHasMore(true);
      }

      const offset = reset ? 0 : currentPage * POSTS_PER_PAGE;
      console.log('Offset:', offset, 'POSTS_PER_PAGE:', POSTS_PER_PAGE);
      
      // Construir query base
      let query = supabase
        .from('vista_publicaciones_completa')
        .select('*')
        .eq('estado', 'activo')
        .order('fecha_publicacion', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);
      
      console.log('Query base construido');

      // Aplicar filtro de categoría
      if (selectedCategory !== 'Todos') {
        query = query.eq('categoria_negocio', selectedCategory);
      }

      // Aplicar búsqueda si existe
      if (searchQuery.trim()) {
        query = query.or(`contenido.ilike.%${searchQuery}%,nombre_negocio.ilike.%${searchQuery}%`);
      }

      console.log('Ejecutando query...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Error al cargar publicaciones:', error);
        console.log('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        Alert.alert('Error', 'No se pudieron cargar las publicaciones');
        return;
      }

      console.log('✅ Query ejecutado exitosamente');
      console.log('Publicaciones encontradas:', data?.length || 0);
      console.log('Datos de publicaciones:', data);

      // Cargar fotos para cada publicación
      const postsWithPhotos = await Promise.all(
        (data || []).map(async (post) => {
          console.log(`Cargando fotos para publicación ${post.id}...`);
          
          const { data: fotos, error: fotosError } = await supabase
            .from('fotos_publicaciones')
            .select('*')
            .eq('publicacion_id', post.id)
            .order('orden');

          if (fotosError) {
            console.error(`Error al cargar fotos para publicación ${post.id}:`, fotosError);
          } else {
            console.log(`Fotos cargadas para publicación ${post.id}:`, fotos);
          }

          return {
            ...post,
            fotos: fotos || []
          };
        })
      );

      if (reset) {
        setPosts(postsWithPhotos);
      } else {
        setPosts(prev => [...prev, ...postsWithPhotos]);
      }

      setHasMore((data || []).length === POSTS_PER_PAGE);
      setCurrentPage(prev => prev + 1);

    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar las publicaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar feed
  const onRefresh = () => {
    setRefreshing(true);
    loadPosts(true);
  };

  // Cargar más publicaciones
  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  };

  // Crear nueva publicación
  const handleCreatePost = () => {
    if (userProfile?.rol !== 'negocio') {
      Alert.alert(
        'Acceso restringido',
        'Solo los dueños de negocio pueden crear publicaciones',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowCreatePost(true);
  };

  // Publicación creada
  const handlePostCreated = () => {
    loadPosts(true);
  };

  // Navegar al detalle del producto
  const handleNavigateToProduct = (product) => {
    setSelectedProduct(product);
  };

  // Cerrar vista de producto
  const handleCloseProduct = () => {
    setSelectedProduct(null);
  };

  // Filtrar publicaciones por búsqueda
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      post.contenido?.toLowerCase().includes(query) ||
      post.nombre_negocio?.toLowerCase().includes(query) ||
      post.categoria_negocio?.toLowerCase().includes(query) ||
      post.nombre_producto?.toLowerCase().includes(query)
    );
  });

  // Renderizar filtros de categoría
  const renderCategoryFilters = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScrollView}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIAS.map((categoria) => (
          <TouchableOpacity
            key={categoria}
            style={[
              styles.categoryButton,
              selectedCategory === categoria && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(categoria)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === categoria && styles.categoryButtonTextActive
            ]}>
              {categoria}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Renderizar barra de búsqueda
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <SearchIcon style={styles.searchIcon} fill={colors.primary} />
      <Input
        placeholder="Buscar publicaciones..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        size="medium"
      />
    </View>
  );



  // Renderizar estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'No se encontraron publicaciones' 
          : selectedCategory !== 'Todos'
            ? `No hay publicaciones en la categoría "${selectedCategory}"`
            : 'No hay publicaciones aún'
        }
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery 
          ? 'Intenta con otros términos de búsqueda'
          : selectedCategory !== 'Todos'
            ? 'Prueba con otra categoría o cambia a "Todos"'
            : 'Los negocios aparecerán aquí cuando publiquen contenido'
        }
      </Text>
      {userProfile?.rol === 'negocio' && (
        <Button
          size="large"
          appearance="filled"
          status="primary"
          accessoryLeft={PlusIcon}
          onPress={handleCreatePost}
          style={styles.emptyStateButton}
        >
          Crear Primera Publicación
        </Button>
      )}
    </View>
  );

  // Renderizar loading
  const renderLoading = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>Cargando publicaciones...</Text>
    </View>
  );

  if (showCreatePost) {
    return (
      <CreatePostView
        userProfile={userProfile}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
      />
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onBack={handleCloseProduct}
        onEdit={() => {}} // No implementado aún
        onDelete={() => {}} // No implementado aún
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={28} color={colors.white} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Muro Social</Text>
              <Text style={styles.headerSubtitle}>Descubre lo que comparten los negocios</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={28} color={colors.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda */}
      {renderSearchBar()}

      {/* Filtros de categoría */}
      {renderCategoryFilters()}

      {/* Lista de publicaciones */}
      <ScrollView
        style={styles.postsScrollView}
        contentContainerStyle={styles.postsContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
        onScrollEndDrag={loadMore}
      >
        {loading && posts.length === 0 ? (
          renderLoading()
        ) : filteredPosts.length > 0 ? (
          <>
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userProfile={userProfile}
                onPostUpdated={() => loadPosts(true)}
                onNavigateToProduct={handleNavigateToProduct}
              />
            ))}
            
            {loading && (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Cargando más publicaciones...</Text>
              </View>
            )}
            
            {!hasMore && posts.length > 0 && (
              <View style={styles.endOfList}>
                <Text style={styles.endOfListText}>No hay más publicaciones</Text>
              </View>
            )}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* FAB para crear publicación - Solo para dueños de negocio */}
      {userProfile?.rol === 'negocio' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreatePost(true)}
          activeOpacity={0.8}
        >
          <PlusIcon style={styles.fabIcon} fill={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 40,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 20,
    height: 20,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 48,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  categoriesContainer: {
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 0,
    height: 60,
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesContent: {
    paddingRight: 16,
    alignItems: 'center',
    height: 52,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  categoryButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  postsScrollView: {
    flex: 1,
  },
  postsContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  loadingState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.primary,
    opacity: 0.7,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.7,
  },
  endOfList: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 70,
    marginBottom: 15,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyStateButton: {
    borderRadius: 25,
  },
  // Estilos para FAB
  fab: {
    position: 'absolute',
    bottom: 100, // Por encima de la barra de navegación
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  fabIcon: {
    width: 24,
    height: 24,
  },
});
