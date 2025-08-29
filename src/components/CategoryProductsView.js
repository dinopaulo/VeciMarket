import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { 
  Button, 
  Text, 
  Layout, 
  Icon, 
  Card, 
  Input
} from '@ui-kitten/components';
import colors from '../lib/colors';

export default function CategoryProductsView({ 
  categoryTitle, 
  products, 
  onBack, 
  onProductPress,
  onEditProduct,
  onDeleteProduct,
  isBusinessOwner = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = Dimensions.get('window');

  // Iconos
  const BackIcon = (props) => <Icon {...props} name='arrow-back'/>;
  const SearchIcon = (props) => <Icon {...props} name='search'/>;
  const FilterIcon = (props) => <Icon {...props} name='options-2'/>;
  const EditIcon = (props) => <Icon {...props} name='edit'/>;
  const DeleteIcon = (props) => <Icon {...props} name='trash-2'/>;
  const ImageIcon = (props) => <Icon {...props} name='image'/>;
  const DollarIcon = (props) => <Icon {...props} name='credit-card'/>;
  const StockIcon = (props) => <Icon {...props} name='grid'/>;
  const TagIcon = (props) => <Icon {...props} name='pricetags'/>;

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(product =>
    product.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Función para formatear precio
  const formatPrice = (price) => {
    if (!price) return 'No disponible';
    return `$${price.toFixed(2)}`;
  };

  // Renderizar tarjeta de producto en lista
  const renderProductCard = ({ item: product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => onProductPress(product)}
    >
      <View style={styles.productCardContent}>
        {/* Imagen del Producto */}
        <View style={styles.productImageContainer}>
          {product.imagen_url ? (
            <Image source={{ uri: product.imagen_url }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <ImageIcon style={styles.productImageIcon} fill={colors.secondary} />
            </View>
          )}
          
          {/* Badge de tipo */}
          <View style={styles.typeBadge}>
            <TagIcon style={styles.badgeIcon} fill={colors.white} />
            <Text style={styles.badgeText}>{product.tipo_producto}</Text>
          </View>
          
          {/* Badge de disponibilidad */}
          <View style={[
            styles.availabilityBadge,
            product.disponibilidad === 'disponible' ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Text style={styles.availabilityBadgeText}>
              {product.disponibilidad === 'disponible' ? 'Disponible' : 'No Disponible'}
            </Text>
          </View>
        </View>
        
        {/* Información del Producto */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.nombre}
          </Text>
          
          {product.descripcion && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {product.descripcion}
            </Text>
          )}
          
          <View style={styles.productMeta}>
            <View style={styles.priceContainer}>
              <DollarIcon style={styles.priceIcon} fill={colors.secondary} />
              <Text style={styles.productPrice}>
                {formatPrice(product.valor || product.precio)}
              </Text>
            </View>
            
            {product.stock !== null && product.stock !== undefined && (
              <View style={styles.stockContainer}>
                <StockIcon style={styles.stockIcon} fill={colors.secondary} />
                <Text style={styles.productStock}>
                  {product.stock} disponibles
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Botones de Acción - Solo para dueños del negocio */}
        {isBusinessOwner && onEditProduct && onDeleteProduct && (
          <View style={styles.productActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEditProduct(product)}
            >
              <EditIcon style={styles.actionIcon} fill={colors.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDeleteProduct(product.id)}
            >
              <DeleteIcon style={styles.actionIcon} fill={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Layout style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Button
            appearance="ghost"
            accessoryLeft={BackIcon}
            onPress={onBack}
            style={styles.backButton}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{categoryTitle}</Text>
            <Text style={styles.headerSubtitle}>{products.length} productos</Text>
          </View>
        </View>
      </View>

      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={SearchIcon}
          style={styles.searchInput}
          size="medium"
        />
        <Button
          appearance="ghost"
          accessoryLeft={FilterIcon}
          style={styles.filterButton}
          size="medium"
        />
      </View>

      {/* Lista de Productos */}
      <View style={styles.productsContainer}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateText}>No se encontraron productos</Text>
                <Text style={styles.emptyStateSubtext}>
                  No hay productos que coincidan con "{searchQuery}"
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyStateIcon}>📦</Text>
                <Text style={styles.emptyStateText}>No hay productos en {categoryTitle}</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isBusinessOwner 
                    ? 'Comienza agregando productos a esta categoría'
                    : 'Esta categoría no tiene productos disponibles por el momento'
                  }
                </Text>
              </>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        )}
      </View>
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
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
  },
  filterButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    width: 48,
    height: 48,
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productsList: {
    paddingBottom: 20,
  },
  itemSeparator: {
    height: 16,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  productCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
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
    width: 32,
    height: 32,
    opacity: 0.5,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeIcon: {
    width: 12,
    height: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: colors.success,
  },
  unavailableBadge: {
    backgroundColor: colors.danger,
  },
  availabilityBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  productDescription: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: 12,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  productPrice: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  productStock: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  productActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
  },
  actionIcon: {
    width: 16,
    height: 16,
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
});
