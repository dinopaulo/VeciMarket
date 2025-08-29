import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image, FlatList } from 'react-native';
import { 
  Button, 
  Text, 
  Layout, 
  Icon, 
  Card, 
  Modal,
  Spinner
} from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import AddProductView from './AddProductView';
import ProductDetailView from './ProductDetailView';
import CategoryProductsView from './CategoryProductsView';

export default function BusinessCatalogView({ businessData, onBack, userProfile }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProductView, setShowAddProductView] = useState(false);
  const [showEditProductView, setShowEditProductView] = useState(false);
  const [showProductDetailView, setShowProductDetailView] = useState(false);
  const [showCategoryView, setShowCategoryView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [businessStats, setBusinessStats] = useState({
    totalPedidos: 0,
    ingresosTotales: 0
  });
  
  // Estados para modales de confirmación y feedback
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);

  // Función para formatear números grandes (estilo Facebook)
  const formatLargeNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Función para formatear precios con formato de números grandes
  const formatPrice = (price) => {
    if (price >= 1000000) {
      return '$' + (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (price >= 1000) {
      return '$' + (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return '$' + price.toFixed(2);
  };

  // Función para detectar si el usuario actual es el dueño del negocio
  const isBusinessOwner = () => {
    return userProfile?.rol === 'negocio' && userProfile?.id === businessData?.usuario_id;
  };

  useEffect(() => {
    loadProducts();
    loadBusinessStats();
    setDimensions(Dimensions.get('window'));
  }, [userProfile, businessData]);

  // Mostrar vista de agregar producto
  const showAddProductForm = () => {
    // Solo permitir agregar productos si es el dueño del negocio
    if (!isBusinessOwner()) {
      return;
    }
    setShowAddProductView(true);
  };

  // Ocultar vista de agregar producto
  const hideAddProductForm = () => {
    setShowAddProductView(false);
  };

  // Mostrar vista de editar producto
  const showEditProductForm = (product) => {
    // Solo permitir editar si es el dueño del negocio
    if (!isBusinessOwner()) {
      return;
    }
    setEditingProduct(product);
    setShowEditProductView(true);
  };

  // Ocultar vista de editar producto
  const hideEditProductForm = () => {
    setShowEditProductView(false);
    setEditingProduct(null);
  };

  // Mostrar vista de detalle del producto
  const showProductDetail = (product) => {
    setSelectedProduct(product);
    setShowProductDetailView(true);
  };

  // Ocultar vista de detalle del producto
  const hideProductDetail = () => {
    setShowProductDetailView(false);
    setSelectedProduct(null);
    // Recargar estadísticas por si se realizó un pedido
    loadBusinessStats();
  };

  // Mostrar vista de categoría
  const showCategoryProducts = (categoryTitle, products) => {
    setSelectedCategory({ title: categoryTitle, products });
    setShowCategoryView(true);
  };

  // Ocultar vista de categoría
  const hideCategoryProducts = () => {
    setShowCategoryView(false);
    setSelectedCategory(null);
  };

  // Eliminar producto
  const handleDeleteProduct = async (productId) => {
    // Solo permitir eliminar si es el dueño del negocio
    if (!isBusinessOwner()) {
      return;
    }
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  // Confirmar eliminación del producto
  const confirmDeleteProduct = async () => {
    try {
      setLoading(true);
      setShowDeleteModal(false);

      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productToDelete);

      if (error) {
        console.error('Error al eliminar producto:', error);
        setModalMessage('No se pudo eliminar el producto');
        setShowErrorModal(true);
        return;
      }

      setModalMessage('Producto eliminado correctamente');
      setShowSuccessModal(true);
      setProductToDelete(null);
      loadProducts();
    } catch (error) {
      console.error('Error general:', error);
      setModalMessage('Error inesperado al eliminar producto');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cuando se agrega un producto
  const handleProductAdded = () => {
    loadProducts();
    setModalMessage('Producto agregado correctamente');
    setShowSuccessModal(true);
  };

  // Manejar cuando se edita un producto
  const handleProductEdited = () => {
    loadProducts();
    hideEditProductForm();
    setModalMessage('Producto editado correctamente');
    setShowSuccessModal(true);
  };

  // Iconos
  const PlusIcon = (props) => <Icon {...props} name='plus'/>;
  const EditIcon = (props) => <Icon {...props} name='edit'/>;
  const DeleteIcon = (props) => <Icon {...props} name='trash-2'/>;
  const ImageIcon = (props) => <Icon {...props} name='image'/>;
  const BackIcon = (props) => <Icon {...props} name='arrow-back'/>;
  const PackageIcon = (props) => <Icon {...props} name='cube'/>;
  const DollarIcon = (props) => <Icon {...props} name='credit-card'/>;
  const StockIcon = (props) => <Icon {...props} name='grid'/>;
  const OrdersIcon = (props) => <Icon {...props} name='shopping-cart'/>;
  const ArrowRightIcon = (props) => <Icon {...props} name='arrow-forward'/>;
  const ContactIcon = (props) => <Icon {...props} name='phone'/>;

  // Cargar productos del negocio
  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('negocio_id', businessData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar productos:', error);
        setModalMessage('No se pudieron cargar los productos');
        setShowErrorModal(true);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error general:', error);
      setModalMessage('Error inesperado al cargar productos');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar estadísticas del negocio
  const loadBusinessStats = async () => {
    try {
      // Obtener estadísticas de pedidos
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('total')
        .eq('negocio_id', businessData.id);

      if (pedidosError) {
        console.error('Error al cargar estadísticas de pedidos:', pedidosError);
        return;
      }

      const totalPedidos = pedidosData?.length || 0;
      const ingresosTotales = pedidosData?.reduce((sum, pedido) => sum + (pedido.total || 0), 0) || 0;

      setBusinessStats({
        totalPedidos,
        ingresosTotales
      });
    } catch (error) {
      console.error('Error al cargar estadísticas del negocio:', error);
    }
  };

  // Filtrar productos por tipo_producto específico
  const getProductsByType = (productType) => {
    return products.filter(product => 
      product.tipo_producto === productType
    );
  };

  // Obtener productos promocionales según tipo_producto
  const getPromotionalProducts = () => {
    return products.filter(product => 
      product.tipo_producto === 'Promoción'
    );
  };

  // Obtener productos combo según tipo_producto
  const getComboProducts = () => {
    return products.filter(product => 
      product.tipo_producto === 'Combo'
    );
  };

  // Renderizar tarjeta de producto para carrusel
  const renderCarouselProductCard = ({ item: product }) => (
    <TouchableOpacity 
      style={styles.carouselProductCard}
      onPress={() => showProductDetail(product)}
    >
      <View style={styles.carouselProductImageContainer}>
        {product.imagen_url ? (
          <Image source={{ uri: product.imagen_url }} style={styles.carouselProductImage} />
        ) : (
          <View style={styles.carouselProductImagePlaceholder}>
            <ImageIcon style={styles.carouselProductImageIcon} fill={colors.secondary} />
          </View>
        )}
        
        {/* Badge de tipo de producto */}
        <View style={styles.carouselCategoryBadge}>
          <Text style={styles.carouselCategoryBadgeText}>
            {product.tipo_producto || 'Producto'}
          </Text>
        </View>
        
        {/* Badge de disponibilidad */}
        <View style={[
          styles.carouselAvailabilityBadge,
          product.disponibilidad === 'disponible' ? styles.availableBadge : styles.unavailableBadge
        ]}>
          <Text style={styles.carouselAvailabilityBadgeText}>
            {product.disponibilidad === 'disponible' ? 'Disponible' : 'No Disponible'}
          </Text>
        </View>
      </View>
      
      <View style={styles.carouselProductInfo}>
        <Text style={styles.carouselProductName} numberOfLines={2}>
          {product.nombre}
        </Text>
        
        {product.descripcion && (
          <Text style={styles.carouselProductDescription} numberOfLines={4}>
            {product.descripcion}
          </Text>
        )}
        
        <View style={styles.carouselProductPriceContainer}>
          <DollarIcon style={styles.carouselPriceIcon} fill={colors.secondary} />
          <Text style={styles.carouselProductPrice}>
            ${product.valor || product.precio}
          </Text>
        </View>
        
        {product.stock !== null && product.stock !== undefined && (
          <View style={styles.carouselStockContainer}>
            <StockIcon style={styles.carouselStockIcon} fill={colors.secondary} />
            <Text style={styles.carouselProductStock}>
              {product.stock} disponibles
            </Text>
          </View>
        )}
        
        {/* Botones de Acción - Solo para dueños del negocio */}
        {isBusinessOwner() && (
          <View style={styles.carouselActionButtons}>
            <TouchableOpacity
              style={styles.carouselEditButton}
              onPress={() => showEditProductForm(product)}
            >
              <EditIcon style={styles.carouselActionIcon} fill={colors.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.carouselDeleteButton}
              onPress={() => handleDeleteProduct(product.id)}
            >
              <DeleteIcon style={styles.carouselActionIcon} fill={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Renderizar sección de categoría
  const renderCategorySection = (title, products, onViewAll) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>Ver todo</Text>
          <ArrowRightIcon style={styles.viewAllIcon} fill={colors.secondary} />
        </TouchableOpacity>
      </View>
      
      {products.length === 0 ? (
        <View style={styles.emptyCategoryState}>
          <Text style={styles.emptyCategoryIcon}>📦</Text>
          <Text style={styles.emptyCategoryText}>
            {isBusinessOwner() 
              ? `No hay ${title.toLowerCase()} aún` 
              : `No hay ${title.toLowerCase()} disponibles`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderCarouselProductCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          ItemSeparatorComponent={() => <View style={styles.carouselItemSeparator} />}
        />
      )}
    </View>
  );

  // Si se debe mostrar la vista de categoría
  if (showCategoryView && selectedCategory) {
    return (
      <CategoryProductsView
        categoryTitle={selectedCategory.title}
        products={selectedCategory.products}
        onBack={hideCategoryProducts}
        onProductPress={(product) => {
          hideCategoryProducts();
          showProductDetail(product);
        }}
        onEditProduct={isBusinessOwner() ? (product) => {
          hideCategoryProducts();
          showEditProductForm(product);
        } : undefined}
        onDeleteProduct={isBusinessOwner() ? (productId) => {
          hideCategoryProducts();
          handleDeleteProduct(productId);
        } : undefined}
        isBusinessOwner={isBusinessOwner()}
      />
    );
  }

  // Si se debe mostrar la vista de detalle del producto
  if (showProductDetailView && selectedProduct) {
    // Agregar información del negocio al producto
    const productWithBusinessInfo = {
      ...selectedProduct,
      negocio_whatsapp: businessData.whatsapp,
      negocio_id: businessData.id
    };
    
    return (
      <ProductDetailView
        product={productWithBusinessInfo}
        onBack={hideProductDetail}
        onEdit={(product) => {
          hideProductDetail();
          showEditProductForm(product);
        }}
        onDelete={(productId) => {
          hideProductDetail();
          handleDeleteProduct(productId);
        }}
      />
    );
  }

  // Si se debe mostrar la vista de agregar producto
  if (showAddProductView) {
    return (
      <AddProductView
        businessData={businessData}
        onBack={hideAddProductForm}
        onProductAdded={handleProductAdded}
      />
    );
  }

  // Si se debe mostrar la vista de editar producto
  if (showEditProductView && editingProduct) {
    return (
      <AddProductView
        businessData={businessData}
        onBack={hideEditProductForm}
        onProductAdded={handleProductEdited}
        editingProduct={editingProduct}
        isEditing={true}
      />
    );
  }

  if (loading && products.length === 0) {
    return (
      <Layout style={styles.loadingContainer}>
        <Spinner size="large" />
        <Text style={{ marginTop: 16, color: colors.secondary }}>Cargando productos...</Text>
      </Layout>
    );
  }

  // Obtener productos por categoría según tipo_producto
  const promotionalProducts = getPromotionalProducts();
  const comboProducts = getComboProducts();
  const regularProducts = products.filter(product => 
    product.tipo_producto === 'Producto'
  );

  return (
    <Layout style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Button
              appearance="ghost"
              accessoryLeft={BackIcon}
              onPress={onBack}
              style={styles.backButton}
            />
            <View style={styles.headerInfo}>
              {isBusinessOwner() ? (
                <>
                  <Text style={styles.businessName}>{businessData.nombre}</Text>
                  <Text style={styles.businessCategory}>{businessData.categoria}</Text>
                  {businessData.descripcion && (
                    <Text style={styles.businessDescription}>{businessData.descripcion}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.headerTitle}>Información del Negocio</Text>
              )}

            </View>
          </View>
          {isBusinessOwner() && (
            <Button
              accessoryLeft={PlusIcon}
              onPress={showAddProductForm}
              style={styles.addButton}
              size="medium"
            />
          )}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estadísticas - Solo para dueños del negocio */}
        {isBusinessOwner() && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Resumen del Negocio</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <PackageIcon style={{ width: 32, height: 32, marginBottom: 8 }} fill={colors.secondary} />
                <Text style={styles.statNumber}>{formatLargeNumber(products.length)}</Text>
                <Text style={styles.statLabel}>Productos</Text>
              </View>
              <View style={styles.statItem}>
                <DollarIcon style={{ width: 32, height: 32, marginBottom: 8 }} fill={colors.secondary} />
                <Text style={styles.statNumber}>
                  {formatPrice(businessStats.ingresosTotales)}
                </Text>
                <Text style={styles.statLabel}>Ganancias</Text>
              </View>
              <View style={styles.statItem}>
                <OrdersIcon style={{ width: 32, height: 32, marginBottom: 8 }} fill={colors.secondary} />
                <Text style={styles.statNumber}>
                  {formatLargeNumber(businessStats.totalPedidos)}
                </Text>
                <Text style={styles.statLabel}>Pedidos Hechos</Text>
              </View>
            </View>
          </View>
        )}

        {/* Información del Negocio - Solo para clientes */}
        {!isBusinessOwner() && (
          <View style={styles.businessInfoCard}>
            <View style={styles.businessInfoContent}>
              <View style={styles.businessInfoLeft}>
                <View style={styles.businessInfoImageContainer}>
                  {businessData.logo_url ? (
                    <Image 
                      source={{ uri: businessData.logo_url }} 
                      style={styles.businessInfoImage}
                    />
                  ) : (
                    <View style={styles.businessInfoImagePlaceholder}>
                      <PackageIcon style={styles.businessInfoImageIcon} fill={colors.secondary} />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.businessInfoRight}>
                <Text style={styles.businessInfoName}>{businessData.nombre}</Text>
                <Text style={styles.businessInfoCategory}>{businessData.categoria}</Text>
                {businessData.descripcion && (
                  <Text style={styles.businessInfoDescription}>{businessData.descripcion}</Text>
                )}
                <Button
                  accessoryLeft={ContactIcon}
                  onPress={() => {
                    console.log('Contactar negocio:', businessData.nombre);
                  }}
                  style={styles.businessInfoContactButton}
                  size="small"
                >
                  Contactar
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Sección de Promociones */}
        {renderCategorySection(
          'Promos', 
          promotionalProducts, 
          () => showCategoryProducts('Promos', promotionalProducts)
        )}

        {/* Sección de Combos */}
        {renderCategorySection(
          'Combos', 
          comboProducts, 
          () => showCategoryProducts('Combos', comboProducts)
        )}

        {/* Sección de Productos */}
        {renderCategorySection(
          'Productos', 
          regularProducts, 
          () => showCategoryProducts('Productos', regularProducts)
        )}

        {/* Estado vacío general */}
        {products.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>
              {isBusinessOwner() ? 'No hay productos aún' : 'Este negocio no tiene productos disponibles'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {isBusinessOwner() 
                ? 'Comienza agregando tu primer producto al catálogo'
                : 'Vuelve más tarde para ver los productos de este negocio'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      <Modal
        visible={showDeleteModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowDeleteModal(false)}
      >
        <Card style={styles.deleteModalCard}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIconContainer}>
              <DeleteIcon style={styles.deleteModalIcon} fill={colors.danger} />
            </View>
            <Text style={styles.deleteModalTitle}>Eliminar Producto</Text>
            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro?
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                appearance="outline"
                onPress={() => setShowDeleteModal(false)}
                style={styles.cancelModalButton}
                textStyle={styles.cancelModalButtonText}
              >
                Cancelar
              </Button>
              <Button
                onPress={confirmDeleteProduct}
                style={styles.confirmDeleteModalButton}
                textStyle={styles.confirmDeleteModalButtonText}
              >
                Eliminar
              </Button>
            </View>
          </View>
        </Card>
      </Modal>

      <Modal
        visible={showSuccessModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowSuccessModal(false)}
      >
        <Card style={styles.successModalCard}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalIconContainer}>
              <Icon name='checkmark-circle-2' style={styles.successModalIcon} fill={colors.success} />
            </View>
            <Text style={styles.successModalTitle}>¡Éxito!</Text>
            <Text style={styles.successModalMessage}>{modalMessage}</Text>
            <Button 
              onPress={() => setShowSuccessModal(false)} 
              style={styles.successModalButton}
              textStyle={styles.successModalButtonText}
            >
              Aceptar
            </Button>
          </View>
        </Card>
      </Modal>

      <Modal
        visible={showErrorModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowErrorModal(false)}
      >
        <Card style={styles.errorModalCard}>
          <View style={styles.errorModalContent}>
            <View style={styles.errorModalIconContainer}>
              <Icon name='alert-circle' style={styles.errorModalIcon} fill={colors.danger} />
            </View>
            <Text style={styles.errorModalTitle}>Error</Text>
            <Text style={styles.errorModalMessage}>{modalMessage}</Text>
            <Button 
              onPress={() => setShowErrorModal(false)} 
              style={styles.errorModalButton}
              textStyle={styles.errorModalButtonText}
            >
              Aceptar
            </Button>
          </View>
        </Card>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessCategory: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  businessDescription: {
    color: colors.primary,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Estilos para la card de información del negocio (clientes)
  businessInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  businessInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessInfoLeft: {
    marginRight: 16,
  },
  businessInfoImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
  },
  businessInfoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  businessInfoImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfoImageIcon: {
    width: 40,
    height: 40,
    opacity: 0.6,
  },
  businessInfoRight: {
    flex: 1,
  },
  businessInfoName: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessInfoCategory: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessInfoDescription: {
    color: colors.primary,
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 16,
  },
  businessInfoContactButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  statsTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    maxWidth: '30%',
  },
  statNumber: {
    color: colors.secondary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    minWidth: 50,
    maxWidth: '100%',
  },
  statLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
  },
  productsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  productsCount: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: colors.white,
  },
  productCardContent: {
    padding: 20,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageIcon: {
    width: 48,
    height: 48,
    opacity: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableBadge: {
    backgroundColor: colors.success,
  },
  unavailableBadge: {
    backgroundColor: colors.danger,
  },
  availabilityBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 26,
  },
  productDescription: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 16,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  productPrice: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  productStock: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  lastUpdateLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  lastUpdateDate: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    marginHorizontal: 4,
  },
  deleteActionButton: {
    backgroundColor: colors.lightGray,
  },
  actionIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  actionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteActionText: {
    color: colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.3,
  },
  emptyStateText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtext: {
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para modales
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    margin: 30,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 250,
    maxWidth: '85%',
    justifyContent: 'center',
  },
  // Estilos específicos para el modal de eliminación
  deleteModalCard: {
    margin: 40,
    padding: 0,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  deleteModalContent: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  deleteModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalIcon: {
    width: 28,
    height: 28,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    opacity: 0.8,
    width: '100%',
    paddingHorizontal: 10,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  cancelModalButton: {
    flex: 1,
    borderRadius: 12,
    height: 52,
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: 'transparent',
    minWidth: 120,
  },
  cancelModalButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmDeleteModalButton: {
    flex: 1,
    borderRadius: 12,
    height: 52,
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    minWidth: 120,
  },
  confirmDeleteModalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estilos específicos para el modal de éxito
  successModalCard: {
    margin: 40,
    padding: 0,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  successModalContent: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  successModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalIcon: {
    width: 28,
    height: 28,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  successModalMessage: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    opacity: 0.8,
    width: '100%',
    paddingHorizontal: 10,
  },
  successModalButton: {
    width: '60%',
    borderRadius: 12,
    height: 52,
    backgroundColor: colors.success,
    borderColor: colors.success,
    alignSelf: 'center',
  },
  successModalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estilos específicos para el modal de error
  errorModalCard: {
    margin: 40,
    padding: 0,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  errorModalContent: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  errorModalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorModalIcon: {
    width: 28,
    height: 28,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  errorModalMessage: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    opacity: 0.8,
    width: '100%',
    paddingHorizontal: 10,
  },
  errorModalButton: {
    width: '60%',
    borderRadius: 12,
    height: 52,
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    alignSelf: 'center',
  },
  errorModalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
    width: '100%',
  },
  modalMessage: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
    opacity: 0.8,
    width: '100%',
    paddingHorizontal: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  modalButton: {
    width: '46%',
    borderRadius: 10,
    height: 44,
  },
  singleModalButton: {
    width: '60%',
    alignSelf: 'center',
    marginTop: 10,
  },
  deleteModalButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  // Estilos para carruseles
  carouselContainer: {
    paddingHorizontal: 20,
  },
  carouselItemSeparator: {
    width: 12,
  },
  carouselProductCard: {
    width: 240,
    height: 380,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  carouselProductImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  carouselProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselProductImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselProductImageIcon: {
    width: 48,
    height: 48,
    opacity: 0.5,
  },
  carouselCategoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  carouselCategoryBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  carouselAvailabilityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableBadge: {
    backgroundColor: colors.success,
  },
  unavailableBadge: {
    backgroundColor: colors.danger,
  },
  carouselAvailabilityBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  carouselProductInfo: {
    padding: 12,
    flex: 1,
  },
  carouselProductName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  carouselProductDescription: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
    marginBottom: 12,
    flex: 1,
    minHeight: 72,
  },
  carouselProductPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  carouselPriceIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  carouselProductPrice: {
    color: colors.secondary,
    fontSize: 26,
    fontWeight: 'bold',
  },
  carouselStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carouselStockIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  carouselProductStock: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  // Estilos para botones de acción en carrusel
  carouselActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 16,
  },
  carouselEditButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
  },
  carouselDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginLeft: 8,
  },
  carouselActionIcon: {
    width: 18,
    height: 18,
  },
  // Estilos para secciones de categoría
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  categoryTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  viewAllIcon: {
    width: 16,
    height: 16,
  },
  emptyCategoryState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: colors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCategoryIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.4,
  },
  emptyCategoryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
});
