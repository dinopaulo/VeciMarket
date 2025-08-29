import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Alert } from 'react-native';
import { 
  Button, 
  Text, 
  Layout, 
  Icon, 
  Card, 
  Spinner
} from '@ui-kitten/components';
import colors from '../lib/colors';
import { supabase } from '../lib/supabase';

export default function ProductDetailView({ product, onBack, onEdit, onDelete }) {
  const { width } = Dimensions.get('window');
  const [quantity, setQuantity] = useState(1);

  // Iconos
  const BackIcon = (props) => <Icon {...props} name='arrow-back'/>;
  const EditIcon = (props) => <Icon {...props} name='edit'/>;
  const DeleteIcon = (props) => <Icon {...props} name='trash-2'/>;
  const ImageIcon = (props) => <Icon {...props} name='image'/>;
  const DollarIcon = (props) => <Icon {...props} name='credit-card'/>;
  const StockIcon = (props) => <Icon {...props} name='grid'/>;
  const CalendarIcon = (props) => <Icon {...props} name='calendar'/>;
  const TagIcon = (props) => <Icon {...props} name='pricetags'/>;
  const InfoIcon = (props) => <Icon {...props} name='info'/>;

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear precio
  const formatPrice = (price) => {
    if (!price) return 'No disponible';
    return `$${price.toFixed(2)}`;
  };

  // Función para abrir WhatsApp con mensaje predefinido
  const openWhatsAppOrder = async () => {
    try {
      // Obtener el precio del producto
      const productPrice = product.valor || product.precio || 0;
      const subtotal = productPrice * quantity;
      
      // Crear el mensaje del pedido
      const orderMessage = `🚀 *¡NUEVO PEDIDO A TRAVÉS DE VECIMARKET!* 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛍️ *INFORMACIÓN DEL PRODUCTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 *Producto:* ${product.nombre}
🏷️ *Tipo:* ${product.tipo_producto}
💰 *Precio unitario:* $${productPrice.toFixed(2)}
🔢 *Cantidad solicitada:* ${quantity}

${product.descripcion ? `📝 *Descripción:* ${product.descripcion}\n` : ''}
${product.stock !== null && product.stock !== undefined ? `📊 *Stock disponible:* ${product.stock} unidades\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💳 *RESUMEN DEL PEDIDO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *Subtotal:* $${subtotal.toFixed(2)}
🎯 *Total a pagar:* $${subtotal.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ *Este pedido fue generado automáticamente a través de VeciMarket*
📱 *Plataforma digital que conecta vecinos y negocios locales*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🙏 *¡Gracias por tu preferencia!* 🙏`;

      // Registrar el pedido en la base de datos
      const { error: orderError } = await supabase
        .from('pedidos')
        .insert({
          producto_id: product.id,
          negocio_id: product.negocio_id,
          cantidad: quantity,
          precio_unitario: productPrice,
          subtotal: subtotal,
          total: subtotal,
          estado_pedido: 'pendiente',
          canal_pedido: 'whatsapp',
          mensaje_whatsapp: orderMessage,
          notas: 'Pedido generado automáticamente desde VeciMarket'
        });

      if (orderError) {
        console.error('Error al registrar pedido:', orderError);
        // Continuar con WhatsApp aunque falle el registro
      } else {
        console.log('Pedido registrado exitosamente');
      }

      // Codificar el mensaje para la URL
      const encodedMessage = encodeURIComponent(orderMessage);
      
      // Construir la URL de WhatsApp
      const whatsappUrl = `${product.negocio_whatsapp}?text=${encodedMessage}`;
      
      // Verificar si se puede abrir la URL
      Linking.canOpenURL(whatsappUrl).then(supported => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Alert.alert(
            'Error',
            'No se puede abrir WhatsApp. Asegúrate de tener la aplicación instalada.',
            [{ text: 'OK' }]
          );
        }
      });
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar el pedido. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

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
            <Text style={styles.headerTitle}>Detalle del Producto</Text>
            <Text style={styles.headerSubtitle}>{product.tipo_producto}</Text>
          </View>
                     {/* Los botones de editar y eliminar se han movido a las tarjetas del carrusel */}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagen del Producto */}
        <View style={styles.imageSection}>
          {product.imagen_url ? (
            <Image 
              source={{ uri: product.imagen_url }} 
              style={[styles.productImage, { width: width - 40 }]} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImagePlaceholder, { width: width - 40, height: 250 }]}>
              <ImageIcon style={styles.productImageIcon} fill={colors.secondary} />
              <Text style={styles.noImageText}>Sin imagen</Text>
            </View>
          )}
          
          {/* Badges superpuestos */}
          <View style={styles.badgesContainer}>
            <View style={styles.typeBadge}>
              <TagIcon style={styles.badgeIcon} fill={colors.white} />
              <Text style={styles.badgeText}>{product.tipo_producto}</Text>
            </View>
            
            <View style={[
              styles.availabilityBadge,
              product.disponibilidad === 'disponible' ? styles.availableBadge : styles.unavailableBadge
            ]}>
              <Text style={styles.availabilityBadgeText}>
                {product.disponibilidad === 'disponible' ? 'Disponible' : 'No Disponible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Información Principal */}
        <Card style={styles.mainInfoCard}>
          <View style={styles.mainInfoContent}>
            <Text style={styles.productName}>{product.nombre}</Text>
            
            {product.descripcion && (
              <Text style={styles.productDescription}>{product.descripcion}</Text>
            )}
            
            <View style={styles.priceSection}>
              <DollarIcon style={styles.priceIcon} fill={colors.secondary} />
              <Text style={styles.productPrice}>
                {formatPrice(product.valor || product.precio)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Selector de Cantidad */}
        <Card style={styles.quantityCard}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Cantidad:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.quantityTotal}>
              Total: ${((product.valor || product.precio || 0) * quantity).toFixed(2)}
            </Text>
          </View>
        </Card>

        {/* Botones de Acción */}
        <Card style={styles.actionButtonsCard}>
          <View style={styles.actionButtonsContainer}>
            <Button
              style={styles.addToCartButton}
              textStyle={styles.addToCartButtonText}
              onPress={() => console.log('Agregar al carrito:', product.id)}
            >
              Agregar al Carrito
            </Button>
            
            <Button
              style={styles.orderNowButton}
              textStyle={styles.orderNowButtonText}
              accessoryLeft={(props) => <Icon {...props} name='message-circle' style={styles.whatsappIcon} />}
              onPress={openWhatsAppOrder}
            >
              Pedir Ahora
            </Button>
          </View>
        </Card>

        {/* Detalles del Producto */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Detalles del Producto</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <TagIcon style={styles.detailIcon} fill={colors.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Tipo</Text>
                <Text style={styles.detailValue}>{product.tipo_producto}</Text>
              </View>
            </View>

            {product.categoria && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <InfoIcon style={styles.detailIcon} fill={colors.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Categoría</Text>
                  <Text style={styles.detailValue}>{product.categoria}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <StockIcon style={styles.detailIcon} fill={colors.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Stock</Text>
                <Text style={styles.detailValue}>
                  {product.stock !== null && product.stock !== undefined 
                    ? `${product.stock} unidades` 
                    : 'No especificado'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <CalendarIcon style={styles.detailIcon} fill={colors.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Última Actualización</Text>
                <Text style={styles.detailValue}>
                  {formatDate(product.updated_at)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Información Adicional */}
        {(product.descuento > 0 || product.precio_especial || product.es_promocion) && (
          <Card style={styles.promotionCard}>
            <Text style={styles.sectionTitle}>Información de Promoción</Text>
            
            <View style={styles.promotionContent}>
              {product.descuento > 0 && (
                <View style={styles.promotionItem}>
                  <Text style={styles.promotionLabel}>Descuento:</Text>
                  <Text style={styles.promotionValue}>{product.descuento}%</Text>
                </View>
              )}
              
              {product.precio_especial && (
                <View style={styles.promotionItem}>
                  <Text style={styles.promotionLabel}>Precio Especial:</Text>
                  <Text style={styles.promotionValue}>
                    {formatPrice(product.precio_especial)}
                  </Text>
                </View>
              )}
              
              {product.es_promocion && (
                <View style={styles.promotionItem}>
                  <Text style={styles.promotionLabel}>Estado:</Text>
                  <Text style={styles.promotionValue}>Producto Promocional</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Fecha de Creación */}
        <Card style={styles.creationCard}>
          <View style={styles.creationContent}>
            <CalendarIcon style={styles.creationIcon} fill={colors.secondary} />
            <View style={styles.creationText}>
              <Text style={styles.creationLabel}>Producto creado el:</Text>
              <Text style={styles.creationDate}>
                {formatDate(product.created_at)}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Los botones de editar y eliminar se han movido a las tarjetas del carrusel
  content: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
  },
  productImage: {
    height: 250,
    borderRadius: 20,
  },
  productImagePlaceholder: {
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageIcon: {
    width: 64,
    height: 64,
    opacity: 0.5,
    marginBottom: 16,
  },
  noImageText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  badgesContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  availabilityBadge: {
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
  mainInfoCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  mainInfoContent: {
    padding: 20,
  },
  productName: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 30,
  },
  // Estilos para selector de cantidad
  quantityCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  quantityContainer: {
    padding: 20,
    alignItems: 'center',
  },
  quantityLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  quantityButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  quantityTotal: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Estilos para botones de acción
  actionButtonsCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonsContainer: {
    padding: 20,
    gap: 16,
  },
  addToCartButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 16,
    height: 56,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderNowButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    borderRadius: 16,
    height: 56,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderNowButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  whatsappIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  productDescription: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  productPrice: {
    color: colors.secondary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailsCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailIcon: {
    width: 20,
    height: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  detailValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  promotionCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  promotionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  promotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  promotionLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  promotionValue: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  creationCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  creationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  creationIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  creationText: {
    flex: 1,
  },
  creationLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  creationDate: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
