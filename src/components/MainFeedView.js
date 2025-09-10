import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Text, Dimensions } from 'react-native';
import { Input, Button, Card, Layout, Icon, Text as UIText, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import CartView from './CartView';
import OrderManagementView from './OrderManagementView';
import SocialFeedView from './SocialFeedView';
import CreatePostView from './CreatePostView';
import FavoritesView from './FavoritesView';

export default function MainFeedView({ userProfile, onNavigateToBusiness, onLogout }) {
  const [publications, setPublications] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inicio');
  
  // Estados para gestión de pedidos
  const [userBusinessId, setUserBusinessId] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  
  // Estados para navegación
  const [currentView, setCurrentView] = useState('main'); // 'main' o 'createPost'
  
  const { width: screenWidth } = Dimensions.get('window');
  
  const CATEGORIAS = [
    'Todos', 'Restaurante', 'Tienda', 'Servicios', 'Salud', 
    'Educación', 'Transporte', 'Entretenimiento', 'Tecnología', 'Otros'
  ];

  useEffect(() => {
    if (activeTab === 'inicio') {
      loadPublications();
      loadBusinesses();
    }
  }, [activeTab]);

  // Recargar datos cuando cambie la categoría
  useEffect(() => {
    if (activeTab === 'inicio') {
      loadPublications();
      loadBusinesses();
    }
  }, [selectedCategory]);

  // Recargar publicaciones cuando cambie la búsqueda social
  useEffect(() => {
    if (activeTab === 'inicio') {
      loadPublications();
    }
  }, [socialSearchQuery]);

  // Cargar el negocio del usuario actual si es dueño de negocio
  useEffect(() => {
    if (userProfile?.rol === 'negocio' && activeTab === 'negocios') {
      loadUserBusiness();
    }
  }, [userProfile, activeTab]);

  // Cargar el negocio del usuario para gestión de pedidos
  useEffect(() => {
    const loadUserBusinessForOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('🔍 No se pudo obtener usuario autenticado');
          return;
        }

        console.log('🔍 Usuario autenticado:', user.id, user.email);

        // Buscar el negocio del usuario actual
        const { data: businessData, error: businessError } = await supabase
          .from('negocios')
          .select('id, nombre, categoria')
          .eq('usuario_id', user.id)
          .single();

        console.log('🔍 Resultado búsqueda negocio:', { businessData, businessError });

        if (businessError) {
          console.error('❌ Error al cargar negocio:', businessError);
          setUserBusinessId(null);
        } else {
          console.log('✅ Negocio encontrado:', businessData);
          setUserBusinessId(businessData?.id);
        }
      } catch (error) {
        console.error('❌ Error al cargar negocio:', error);
        setUserBusinessId(null);
      } finally {
        setLoadingBusiness(false);
      }
    };

    loadUserBusinessForOrders();
  }, []);

  // Filtrar negocios cuando cambie la búsqueda o categoría
  useEffect(() => {
    let filtered = businesses;
    
    // Primero filtrar por categoría
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(business => 
        business.categoria === selectedCategory
      );
    }
    
    // Luego filtrar por búsqueda de texto
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(business => 
        business.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.categoria?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.direccion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredBusinesses(filtered);
  }, [searchQuery, businesses, selectedCategory]);

  // Iconos
  const SearchIcon = (props) => <Icon {...props} name='search'/>;
  const BellIcon = (props) => <Icon {...props} name='bell'/>;
  const HomeIcon = (props) => <Icon {...props} name='home'/>;
  const BriefcaseIcon = (props) => <Icon {...props} name='briefcase'/>;
  const HeartIcon = (props) => <Icon {...props} name='heart'/>;
  const ShoppingCartIcon = (props) => <Icon {...props} name='shopping-cart'/>;
  const PersonIcon = (props) => <Icon {...props} name='person'/>;
  const ContactIcon = (props) => <Icon {...props} name='phone'/>;
  const BackIcon = (props) => <Icon {...props} name='arrow-back'/>;
  const EditIcon = (props) => <Icon {...props} name='edit'/>;
  const PlusIcon = (props) => <Icon {...props} name='plus'/>;
  const SettingsIcon = (props) => <Icon {...props} name='settings'/>;
  const CreateIcon = (props) => <Icon {...props} name='plus'/>;



  // Cargar publicaciones
  const loadPublications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vista_publicaciones_completa')
        .select('*')
        .order('fecha_publicacion', { ascending: false });

      if (selectedCategory !== 'Todos') {
        query = query.eq('categoria_negocio', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al cargar publicaciones:', error);
        setPublications([]);
        return;
      }

      // Filtrar por búsqueda de texto si existe
      let filteredData = data || [];
      if (socialSearchQuery.trim() !== '') {
        filteredData = filteredData.filter(publication => 
          publication.contenido?.toLowerCase().includes(socialSearchQuery.toLowerCase()) ||
          publication.nombre_negocio?.toLowerCase().includes(socialSearchQuery.toLowerCase()) ||
          publication.categoria_negocio?.toLowerCase().includes(socialSearchQuery.toLowerCase())
        );
      }

      setPublications(filteredData);
    } catch (error) {
      console.error('Error general:', error);
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar el negocio del usuario actual
  const loadUserBusiness = async () => {
    try {
      if (!userProfile?.id) return;
      
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('usuario_id', userProfile.id)
        .single();

      if (error) {
        console.error('Error al cargar negocio del usuario:', error);
        return;
      }

      if (data) {
        // Agregar el negocio del usuario a la lista si no está ya
        setBusinesses(prevBusinesses => {
          const exists = prevBusinesses.find(b => b.id === data.id);
          if (!exists) {
            return [...prevBusinesses, { ...data, ultimaFotoProducto: null }];
          }
          return prevBusinesses;
        });
      }
    } catch (error) {
      console.error('Error general en loadUserBusiness:', error);
    }
  };

  // Cargar negocios con última foto de producto
  const loadBusinesses = async () => {
    try {
      // Primero cargar todos los negocios (sin restricción de productos)
      let query = supabase
        .from('negocios')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'Todos') {
        query = query.eq('categoria', selectedCategory);
      }

      const { data: allBusinesses, error: allError } = await query;

      if (allError) {
        console.error('Error al cargar negocios:', allError);
        return;
      }

      // Luego cargar negocios con productos para obtener las fotos
      let productsQuery = supabase
        .from('negocios')
        .select(`
          *,
          productos!inner(
            id,
            imagen_url,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'Todos') {
        productsQuery = productsQuery.eq('categoria', selectedCategory);
      }

      const { data: businessesWithProducts, error: productsError } = await productsQuery;

      if (productsError) {
        console.error('Error al cargar negocios con productos:', productsError);
        return;
      }

      // Combinar ambos resultados, priorizando los que tienen productos
      const businessesWithPhotos = businessesWithProducts?.map(business => {
        if (business.productos && business.productos.length > 0) {
          // Ordenar productos por fecha y tomar el más reciente
          const latestProduct = business.productos
            .filter(p => p.imagen_url)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
          
          return {
            ...business,
            ultimaFotoProducto: latestProduct?.imagen_url || null
          };
        }
        return {
          ...business,
          ultimaFotoProducto: null
        };
      }) || [];

      // Agregar negocios sin productos que no estén en la lista
      const allBusinessesMap = new Map();
      allBusinesses?.forEach(business => {
        allBusinessesMap.set(business.id, business);
      });

      businessesWithPhotos.forEach(business => {
        allBusinessesMap.delete(business.id);
      });

      // Agregar negocios sin productos al final
      const finalBusinesses = [
        ...businessesWithPhotos,
        ...Array.from(allBusinessesMap.values()).map(business => ({
          ...business,
          ultimaFotoProducto: null
        }))
      ];

      setBusinesses(finalBusinesses);
    } catch (error) {
      console.error('Error general:', error);
    }
  };

  // Renderizar publicación
  const renderPublication = (publication) => (
    <View key={publication.id} style={styles.publicationItem}>
      <View style={styles.publicationHeader}>
        <View style={styles.businessInfo}>
          <View style={styles.businessLogoContainer}>
            {publication.logo_negocio ? (
              <Image 
                source={{ uri: publication.logo_negocio }} 
                style={styles.businessLogo}
              />
            ) : (
              <View style={styles.businessLogoPlaceholder}>
                <BriefcaseIcon style={styles.businessLogoIcon} fill={colors.secondary} />
              </View>
            )}
          </View>
          
          <View style={styles.businessDetails}>
            <Text style={styles.businessName}>
              {publication.nombre_negocio || 'Negocio'}
            </Text>
            <Text style={styles.businessCategory}>
              {publication.categoria_negocio || 'Categoría'}
            </Text>
            <Text style={styles.publicationTime}>
              Hace {getTimeAgo(publication.fecha_publicacion)}
            </Text>
          </View>
        </View>
        
        <Button
          size="small"
          appearance="filled"
          status="primary"
          accessoryLeft={ContactIcon}
          style={styles.contactButton}
        >
          Contactar
        </Button>
      </View>
      
      {publication.contenido && (
        <Text style={styles.publicationContent}>
          {publication.contenido}
        </Text>
      )}
      
      {publication.imagen_url && (
        <View style={styles.publicationImageContainer}>
          <Image 
            source={{ uri: publication.imagen_url }} 
            style={styles.publicationImage}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );

  // Obtener tiempo transcurrido
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'un momento';
    
    const now = new Date();
    const created = new Date(timestamp);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'unos minutos';
    if (diffInHours === 1) return '1 hora';
    if (diffInHours < 24) return `${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 día';
    return `${diffInDays} días`;
  };

  // Manejar creación de publicación
  const handleCreatePost = () => {
    if (userProfile?.rol === 'negocio') {
      setCurrentView('createPost');
    }
  };

  // Navegar a crear publicación
  const handleOpenCreatePost = () => {
    setCurrentView('createPost');
  };

  // Cerrar vista de crear publicación
  const handleCloseCreatePost = () => {
    setCurrentView('main');
  };

  // Manejar publicación creada
  const handlePostCreated = () => {
    setCurrentView('main');
    // Recargar publicaciones
    loadPublications();
  };

  // Navegar a gestión de negocio (solo para usuarios negocio)
  const handleBusinessManagement = async () => {
    console.log('handleBusinessManagement llamado');
    console.log('userProfile:', userProfile);
    console.log('businesses:', businesses);
    
    if (userProfile?.rol === 'negocio') {
      // Buscar datos del negocio del usuario en la lista actual
      let userBusiness = businesses.find(b => b.usuario_id === userProfile.id);
      console.log('userBusiness encontrado en lista:', userBusiness);
      
      // Si no se encuentra en la lista, cargarlo directamente de la base de datos
      if (!userBusiness) {
        console.log('Negocio no encontrado en lista, cargando desde BD...');
        try {
          const { data, error } = await supabase
            .from('negocios')
            .select('*')
            .eq('usuario_id', userProfile.id)
            .single();
          
          if (error) {
            console.error('Error al cargar negocio del usuario:', error);
            return;
          }
          
          if (data) {
            userBusiness = data;
            console.log('Negocio cargado desde BD:', userBusiness);
          }
        } catch (error) {
          console.error('Error al cargar negocio:', error);
          return;
        }
      }
      
      if (userBusiness && onNavigateToBusiness) {
        console.log('Navegando a catálogo con:', userBusiness);
        onNavigateToBusiness(userBusiness);
      } else {
        console.log('No se pudo navegar - userBusiness:', userBusiness, 'onNavigateToBusiness:', onNavigateToBusiness);
      }
    } else {
      console.log('Usuario no es de tipo negocio');
    }
  };

  // Renderizar vista de inicio (feed social)
  const renderInicioView = () => (
    <>
      {/* Header original para feed social */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerBackground}>
          <View style={styles.headerGradient} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appLogoContainer}>
              <HomeIcon style={styles.appLogoIcon} fill={colors.secondary} />
            </View>
            <View style={styles.appTitleContainer}>
              <Text style={styles.appTitle}>Muro Social</Text>
              <Text style={styles.appSubtitle}>Descubre lo que comparten los negocios</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contenido del feed social */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Buscar publicaciones..."
            value={socialSearchQuery}
            onChangeText={setSocialSearchQuery}
            accessoryLeft={SearchIcon}
            style={styles.searchInput}
            textStyle={styles.searchInputText}
          />
        </View>

        {/* Filtros de categoría */}
        <View style={styles.categoryFiltersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFiltersScroll}
          >
            {CATEGORIAS.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryFilterChip,
                  selectedCategory === category && styles.categoryFilterChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryFilterText,
                  selectedCategory === category && styles.categoryFilterTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de publicaciones */}
        {loading ? (
          <View style={styles.loadingState}>
            <View style={styles.loadingSpinner}>
              <Text style={styles.loadingSpinnerText}>📱</Text>
            </View>
            <Text style={styles.loadingText}>Cargando publicaciones...</Text>
            <Text style={styles.loadingSubtext}>Descubre lo que comparten los negocios</Text>
          </View>
        ) : publications.length > 0 ? (
          publications.map((publication) => renderPublication(publication))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📢</Text>
            <Text style={styles.emptyStateText}>No hay publicaciones aún</Text>
            <Text style={styles.emptyStateSubtext}>
              Los negocios aparecerán aquí cuando compartan contenido
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB para crear publicación - Solo para dueños de negocio */}
      {userProfile?.rol === 'negocio' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePost}
          activeOpacity={0.8}
        >
          <CreateIcon style={styles.fabIcon} fill={colors.white} />
        </TouchableOpacity>
      )}
    </>
  );

  // Renderizar vista de negocios
  const renderNegociosView = () => (
    <>
      {/* Header mejorado para negocios */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerBackground}>
          <View style={styles.headerGradient} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appLogoContainer}>
              <BriefcaseIcon style={styles.appLogoIcon} fill={colors.secondary} />
            </View>
            <View style={styles.appTitleContainer}>
              <Text style={styles.appTitle}>Negocios</Text>
              <Text style={styles.appSubtitle}>
                {userProfile?.rol === 'negocio' 
                  ? 'Gestiona tu presencia digital' 
                  : 'Descubre negocios locales'
                }
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.notificationButton}>
            <BellIcon style={styles.notificationIcon} fill={colors.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>90</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

            {/* Contenido de negocios */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Vista para TODOS los usuarios (clientes y dueños de negocio) */}
        <View style={styles.businessesListView}>
          {/* Buscador */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Buscar negocios..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessoryLeft={SearchIcon}
              style={styles.searchInput}
              textStyle={styles.searchInputText}
            />
          </View>

          {/* Filtros de categoría */}
          <View style={styles.categoryFiltersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFiltersScroll}
            >
              {CATEGORIAS.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryFilterChip,
                    selectedCategory === category && styles.categoryFilterChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategory === category && styles.categoryFilterTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Lista de negocios */}
          <Text style={styles.sectionTitle}>
            Negocios Disponibles
          </Text>
          
          {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map((business) => (
              <View key={business.id} style={styles.businessCard}>
                {/* Header del negocio */}
                <View style={styles.businessCardHeader}>
                  <View style={styles.businessLogoContainer}>
                    {business.logo_url ? (
                      <Image 
                        source={{ uri: business.logo_url }} 
                        style={styles.businessLogo}
                      />
                    ) : (
                      <View style={styles.businessLogoPlaceholder}>
                        <BriefcaseIcon style={styles.businessLogoIcon} fill={colors.secondary} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.businessCardDetails}>
                    <Text style={styles.businessName}>
                      {business.nombre || 'Negocio'}
                    </Text>
                    <Text style={styles.businessDescription}>
                      {business.descripcion || 'Sin descripción disponible'}
                    </Text>
                    <Text style={styles.businessCategory}>
                      {business.categoria || 'Categoría'}
                    </Text>
                    <Text style={styles.businessAddress}>
                      📍 {business.direccion || 'Dirección no disponible'}
                    </Text>
                  </View>
                </View>
                
                {/* Última foto de producto */}
                {business.ultimaFotoProducto && (
                  <View style={styles.latestProductImageContainer}>
                    <Image 
                      source={{ uri: business.ultimaFotoProducto }} 
                      style={styles.latestProductImage}
                      resizeMode="cover"
                    />
                    <View style={styles.latestProductImageOverlay}>
                      <Text style={styles.latestProductImageText}>Último producto</Text>
                    </View>
                  </View>
                )}
                
                {/* Acciones */}
                <View style={styles.businessCardActions}>
                  <Button
                    size="small"
                    appearance="outline"
                    status="primary"
                    style={styles.viewBusinessButton}
                    onPress={() => onNavigateToBusiness && onNavigateToBusiness(business)}
                  >
                    Ver Catálogo
                  </Button>
                  <Button
                    size="small"
                    appearance="filled"
                    status="primary"
                    accessoryLeft={ContactIcon}
                    style={styles.contactButton}
                    onPress={() => {
                      // Aquí se puede implementar la funcionalidad de contacto
                      console.log('Contactar negocio:', business.nombre);
                    }}
                  >
                    Contactar
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>
                {searchQuery ? '🔍' : selectedCategory !== 'Todos' ? '🏷️' : '🏪'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? 'No se encontraron negocios' 
                  : selectedCategory !== 'Todos' 
                    ? `No hay negocios en la categoría "${selectedCategory}"`
                    : 'No hay negocios registrados'
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery 
                  ? 'Intenta con otros términos de búsqueda'
                  : selectedCategory !== 'Todos'
                    ? 'Prueba con otra categoría o cambia a "Todos"'
                    : 'Los negocios aparecerán aquí cuando se registren'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );

  // Renderizar vista de favoritos
  const renderFavoritosView = () => (
    <FavoritesView />
  );

  // Renderizar vista de carrito
  const renderCarritoView = () => (
    <CartView onNavigateToTab={(tabIndex) => setActiveTab(['inicio', 'negocios', 'favoritos', 'carrito', 'negocio', 'perfil'][tabIndex])} />
  );

  // Renderizar vista de perfil
  const renderPerfilView = () => (
    <>
      <View style={styles.enhancedHeader}>
        <View style={styles.headerBackground}>
          <View style={styles.headerGradient} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appLogoContainer}>
              <PersonIcon style={styles.appLogoIcon} fill={colors.secondary} />
            </View>
            <View style={styles.appTitleContainer}>
              <Text style={styles.appTitle}>Mi Perfil</Text>
              <Text style={styles.appSubtitle}>Gestiona tu cuenta</Text>
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <PersonIcon style={styles.profileAvatarIcon} fill={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userProfile?.nombre || 'Usuario'}
              </Text>
              <Text style={styles.profileEmail}>
                {userProfile?.email || 'usuario@email.com'}
              </Text>
              <Text style={styles.profileRole}>
                {userProfile?.rol === 'negocio' ? '🏪 Dueño de Negocio' : '👤 Cliente'}
              </Text>
            </View>
          </View>
          
          <Button
            size="large"
            appearance="outline"
            status="danger"
            onPress={onLogout}
            style={styles.logoutButton}
          >
            Cerrar Sesión
          </Button>
        </View>
      </ScrollView>
    </>
  );

  // Renderizar vista de gestión de pedidos
  const renderPedidosView = () => {
    if (loadingBusiness) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando información del negocio...</Text>
        </View>
      );
    }
    
    if (!userBusinessId) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            No se pudo obtener la información de tu negocio.{'\n\n'}
            Asegúrate de que tu cuenta esté vinculada a un negocio.
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Header para gestión de pedidos */}
        <View style={styles.enhancedHeader}>
          <View style={styles.headerBackground}>
            <View style={styles.headerGradient} />
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveTab('negocio')}
              >
                <BackIcon style={styles.backIcon} fill={colors.white} />
              </TouchableOpacity>
              <View style={styles.appTitleContainer}>
                <Text style={styles.appTitle}>Gestión de Pedidos</Text>
                <Text style={styles.appSubtitle}>Gestiona los pedidos de tus clientes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Componente de gestión de pedidos */}
        <OrderManagementView businessId={userBusinessId} />
      </>
    );
  };

  // Renderizar vista de gestión del negocio (solo para dueños de negocio)
  const renderNegocioView = () => (
    <>
      {/* Header mejorado para gestión del negocio */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerBackground}>
          <View style={styles.headerGradient} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appLogoContainer}>
              <BriefcaseIcon style={styles.appLogoIcon} fill={colors.secondary} />
            </View>
            <View style={styles.appTitleContainer}>
              <Text style={styles.appTitle}>Mi Negocio</Text>
              <Text style={styles.appSubtitle}>Gestiona tu presencia digital</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.notificationButton}>
            <BellIcon style={styles.notificationIcon} fill={colors.white} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>90</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido de gestión del negocio */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.businessOwnerView}>
          {/* Header del negocio */}
          <View style={styles.businessHeader}>
            <View style={styles.businessHeaderInfo}>
              <View style={styles.businessHeaderLogo}>
                <BriefcaseIcon style={styles.businessHeaderIcon} fill={colors.secondary} />
              </View>
              <View style={styles.businessHeaderText}>
                <Text style={styles.businessHeaderTitle}>
                  Mi Negocio
                </Text>
                <Text style={styles.businessHeaderSubtitle}>
                  Gestiona tu presencia digital
                </Text>
                <View style={styles.businessStatusBadge}>
                  <Text style={styles.businessStatusText}>🟢 Activo</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.editBusinessButton}>
              <EditIcon style={styles.editIcon} fill={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Acciones principales */}
          <View style={styles.mainActionsContainer}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.mainActionButton}
                onPress={handleBusinessManagement}
                activeOpacity={0.7}
              >
                <View style={styles.mainActionIcon}>
                  <Text style={styles.mainActionEmoji}>📦</Text>
                </View>
                <Text style={styles.mainActionTitle}>Gestionar Catálogo</Text>
                <Text style={styles.mainActionSubtitle}>Productos y precios</Text>
                <View style={styles.actionButtonIndicator}>
                  <Text style={styles.actionButtonIndicatorText}>👆 Toca aquí</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mainActionButton}
                onPress={() => setActiveTab('pedidos')}
                activeOpacity={0.7}
              >
                <View style={styles.mainActionIcon}>
                  <Text style={styles.mainActionEmoji}>📋</Text>
                </View>
                <Text style={styles.mainActionTitle}>Gestión de Pedidos</Text>
                <Text style={styles.mainActionSubtitle}>Confirma y gestiona pedidos</Text>
                <View style={styles.actionButtonIndicator}>
                  <Text style={styles.actionButtonIndicatorText}>👆 Toca aquí</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.mainActionButton}
                onPress={() => setActiveTab('social')}
                activeOpacity={0.7}
              >
                <View style={styles.mainActionIcon}>
                  <Text style={styles.mainActionEmoji}>📢</Text>
                </View>
                <Text style={styles.mainActionTitle}>Crear Publicación</Text>
                <Text style={styles.mainActionSubtitle}>Promociona tu negocio</Text>
                <View style={styles.actionButtonIndicator}>
                  <Text style={styles.actionButtonIndicatorText}>👆 Toca aquí</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mainActionButton}>
                <View style={styles.mainActionIcon}>
                  <Text style={styles.mainActionEmoji}>📊</Text>
                </View>
                <Text style={styles.mainActionTitle}>Analíticas</Text>
                <Text style={styles.mainActionSubtitle}>Métricas y reportes</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.mainActionButton}>
                <View style={styles.mainActionIcon}>
                  <Text style={styles.mainActionEmoji}>⚙️</Text>
                </View>
                <Text style={styles.mainActionTitle}>Configuración</Text>
                <Text style={styles.mainActionSubtitle}>Ajustes del negocio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );

  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <SocialFeedView 
            userProfile={userProfile} 
            onNavigateToBusiness={onNavigateToBusiness}
          />
        );
      case 'negocios':
        return renderNegociosView();
      case 'negocio':
        return renderNegocioView();
      case 'pedidos':
        return renderPedidosView();
      case 'social':
        return (
          <SocialFeedView 
            userProfile={userProfile} 
            onNavigateToBusiness={onNavigateToBusiness}
          />
        );
      case 'favoritos':
        return renderFavoritosView();
      case 'carrito':
        return renderCarritoView();
      case 'perfil':
        return renderPerfilView();
      default:
        return (
          <SocialFeedView 
            userProfile={userProfile} 
            onNavigateToBusiness={onNavigateToBusiness}
          />
        );
    }
  };

  // Renderizar vista actual
  const renderCurrentView = () => {
    if (currentView === 'createPost') {
      return (
        <CreatePostView
          userProfile={userProfile}
          onClose={handleCloseCreatePost}
          onPostCreated={handlePostCreated}
        />
      );
    }
    
    return (
      <Layout style={styles.container}>
        {renderContent()}

        {/* Barra de navegación inferior */}
        <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'inicio' && styles.navItemActive]}
          onPress={() => setActiveTab('inicio')}
        >
          <HomeIcon 
            style={[styles.navIcon, activeTab === 'inicio' && styles.navIconActive]} 
            fill={activeTab === 'inicio' ? colors.secondary : colors.primary} 
          />
          <Text style={[styles.navText, activeTab === 'inicio' && styles.navTextActive]}>
            Inicio
          </Text>
        </TouchableOpacity>

        {/* Botón Negocios - Para TODOS los usuarios (clientes y dueños de negocio) */}
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'negocios' && styles.navItemActive]}
          onPress={() => setActiveTab('negocios')}
        >
          <BriefcaseIcon 
            style={[styles.navIcon, activeTab === 'negocios' && styles.navIconActive]} 
            fill={activeTab === 'negocios' ? colors.secondary : colors.primary} 
          />
          <Text style={[styles.navText, activeTab === 'negocios' && styles.navTextActive]}>
            Negocios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'favoritos' && styles.navItemActive]}
          onPress={() => setActiveTab('favoritos')}
        >
          <HeartIcon 
            style={[styles.navIcon, activeTab === 'favoritos' && styles.navIconActive]} 
            fill={activeTab === 'favoritos' ? colors.secondary : colors.primary} 
          />
          <Text style={[styles.navText, activeTab === 'favoritos' && styles.navTextActive]}>
            Favoritos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'carrito' && styles.navItemActive]}
          onPress={() => setActiveTab('carrito')}
        >
          <ShoppingCartIcon 
            style={[styles.navIcon, activeTab === 'carrito' && styles.navIconActive]} 
            fill={activeTab === 'carrito' ? colors.secondary : colors.primary} 
          />
          <Text style={[styles.navText, activeTab === 'carrito' && styles.navTextActive]}>
            Carrito
          </Text>
        </TouchableOpacity>

        {/* Botón Negocio - Solo para dueños de negocio */}
        {userProfile?.rol === 'negocio' && (
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'negocio' && styles.navItemActive]}
            onPress={() => setActiveTab('negocio')}
          >
            <SettingsIcon 
              style={[styles.navIcon, activeTab === 'negocio' && styles.navIconActive]} 
              fill={activeTab === 'negocio' ? colors.secondary : colors.primary} 
            />
            <Text style={[styles.navText, activeTab === 'negocio' && styles.navTextActive]}>
              MiNegocio
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'perfil' && styles.navItemActive]}
          onPress={() => setActiveTab('perfil')}
        >
          <PersonIcon 
            style={[styles.navIcon, activeTab === 'perfil' && styles.navIconActive]} 
            fill={activeTab === 'perfil' ? colors.secondary : colors.primary} 
          />
          <Text style={[styles.navText, activeTab === 'perfil' && styles.navTextActive]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </Layout>
    );
  };

  return renderCurrentView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    width: 24,
    height: 24,
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
  notificationBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    width: 20,
    height: 20,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 48,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoriesContainer: {
    marginBottom: 6,
    paddingHorizontal: 20,
    height: 44,
    flexGrow: 0,
  },
  categoriesContent: {
    paddingRight: 20,
    alignItems: 'center',
    height: 44,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    borderWidth: 0,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  categoryButtonActive: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.primary,
  },
  seeAllText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  publicationHeader: {
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
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  publicationTime: {
    fontSize: 12,
    color: colors.secondary,
    opacity: 0.7,
  },
  contactButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  publicationContent: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  publicationImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  publicationImage: {
    width: '100%',
    height: 200,
  },
  emptyState: {
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
    color: colors.secondary,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  // Estilos para vista de negocios
  businessOwnerView: {
    flex: 1,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  businessHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessHeaderLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  businessHeaderIcon: {
    width: 30,
    height: 30,
  },
  businessHeaderText: {
    flex: 1,
  },
  businessHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  businessHeaderSubtitle: {
    fontSize: 14,
    color: colors.secondary,
    opacity: 0.8,
  },
  editBusinessButton: {
    padding: 8,
  },
  editIcon: {
    width: 24,
    height: 24,
  },
  mainActionsContainer: {
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mainActionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  mainActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mainActionEmoji: {
    fontSize: 24,
  },
  mainActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  mainActionSubtitle: {
    fontSize: 12,
    color: colors.secondary,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 16,
  },
  businessesListView: {
    flex: 1,
  },
  businessItem: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    padding: 20,
  },
  businessCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  businessCardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  businessDescription: {
    fontSize: 14,
    color: colors.secondary,
    opacity: 0.8,
    lineHeight: 20,
  },
  businessCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewBusinessButton: {
    flex: 1,
    marginRight: 8,
  },
  // Estilos para vista de perfil
  profileSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileAvatarIcon: {
    width: 40,
    height: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  logoutButton: {
    width: '100%',
    borderColor: colors.danger,
  },
  // Estilos para publicaciones
  publicationItem: {
    marginBottom: 15,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    minWidth: 0,
  },
  navItemActive: {
    // Estilo para el item activo
  },
  navIcon: {
    width: 22,
    height: 22,
    marginBottom: 3,
  },
  navIconActive: {
    // El icono activo mantiene el color secondary
  },
  navText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  navTextActive: {
    color: colors.secondary,
    fontWeight: '600',
  },
  // Estilos para el estado de carga
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.secondary,
    opacity: 0.7,
    marginTop: 8,
  },
  loadingSpinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingSpinnerText: {
    fontSize: 25,
  },
  actionButtonIndicator: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonIndicatorText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Estilos para el nuevo encabezado mejorado
  enhancedHeader: {
    position: 'relative',
    height: 130,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondary,
    opacity: 0.9,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: colors.white + '20',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  appLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  appLogoIcon: {
    width: 28,
    height: 28,
    opacity: 0.8,
  },
  appTitleContainer: {
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.8,
  },
  businessStatusBadge: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  businessStatusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Estilos para la vista de negocios mejorada
  businessesListView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputText: {
    fontSize: 16,
    color: colors.primary,
  },
  categoryFiltersContainer: {
    marginBottom: 20,
  },
  categoryFiltersScroll: {
    paddingRight: 20,
  },
  categoryFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryFilterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 0.2,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  categoryFilterTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.primary,
    marginBottom: 16,
  },

  businessCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  businessLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  businessLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogoIcon: {
    width: 40,
    height: 40,
    opacity: 0.6,
  },
  businessCardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  businessCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessAddress: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.7,
  },
  latestProductImageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  latestProductImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  latestProductImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  latestProductImageText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  businessCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewBusinessButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: colors.secondary,
  },
  contactButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Estilos para contenedor de error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para contenedor de carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para FAB (Floating Action Button)
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
