import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Text as RNText, RefreshControl, Linking } from 'react-native';
import { Layout, Card, Button, Icon, Spinner, Modal } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';



// Iconos
const TrashIcon = (props) => (
  <Icon {...props} name='trash-2-outline'/>
);

const PlusIcon = (props) => (
  <Icon {...props} name='plus-outline'/>
);

const MinusIcon = (props) => (
  <Icon {...props} name='minus-outline'/>
);

const ShoppingBagIcon = (props) => (
  <Icon {...props} name='shopping-bag-outline'/>
);

const CreditCardIcon = (props) => (
  <Icon {...props} name='credit-card-outline'/>
);

const WhatsAppIcon = (props) => (
  <Icon {...props} name='message-circle-outline'/>
);

const ChevronDownIcon = (props) => (
  <Icon {...props} name='chevron-down-outline'/>
);

const ChevronUpIcon = (props) => (
  <Icon {...props} name='chevron-up-outline'/>
);

export default function CartView({ onNavigateToTab }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  


  // Cargar datos del carrito desde Supabase
  const loadCartData = async () => {
    try {
      setLoading(true);
      console.log('🛒 CartView: Iniciando carga de datos del carrito...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('❌ Error al obtener usuario:', userError);
        Alert.alert('Error', 'No se pudo obtener información del usuario');
        return;
      }

      if (!user) {
        console.log('⚠️ No hay usuario autenticado');
        setCartItems([]);
        return;
      }

      console.log('👤 Usuario autenticado:', user.id);

      const { data: carts, error: cartsError } = await supabase
        .from('carrito')
        .select(`
          id,
          negocio_id,
          created_at,
          negocio:negocio_id (
            id,
            nombre,
            direccion,
            logo_url,
            whatsapp
          )
        `)
        .eq('usuario_id', user.id);

      if (cartsError) {
        console.error('❌ Error al cargar carritos:', cartsError);
        Alert.alert('Error', 'No se pudieron cargar los carritos');
        return;
      }

      console.log('🛒 Carritos encontrados:', carts?.length || 0);

      if (!carts || carts.length === 0) {
        console.log('📭 No hay carritos para este usuario');
        setCartItems([]);
        return;
      }

      console.log('🔍 Obteniendo items para cada carrito...');
      const cartItemsPromises = carts.map(async (cart) => {
        const { data: items, error: itemsError } = await supabase
          .from('carrito_items')
          .select(`
            id,
            cantidad,
            producto_id
          `)
          .eq('carrito_id', cart.id);

        if (itemsError) {
          console.error(`❌ Error al cargar items del carrito ${cart.id}:`, itemsError);
          return null;
        }

        // Obtener información de productos por separado
        if (items && items.length > 0) {
          const productoIds = items.map(item => item.producto_id);
          const { data: productos, error: productosError } = await supabase
            .from('productos')
            .select('id, nombre, descripcion, valor, imagen_url')
            .in('id', productoIds);

          if (productosError) {
            console.error(`❌ Error al cargar productos:`, productosError);
            return null;
          }

          // Combinar items con información de productos
          const itemsWithProducts = items.map(item => {
            const producto = productos.find(p => p.id === item.producto_id);
            // Solo incluir items con productos que tengan nombre (datos válidos)
            if (producto && producto.nombre) {
              return {
                ...item,
                productos: producto
              };
            }
            return null;
          }).filter(item => item !== null); // Solo incluir items válidos

          return {
            ...cart,
            items: itemsWithProducts
          };
        }

        return {
          ...cart,
          items: [],
          isExpanded: false
        };
      });

      const cartItems = await Promise.all(cartItemsPromises);
      const validCarts = cartItems.filter(cart => cart !== null && cart.items.length > 0);
      
      console.log('✅ Carritos válidos (con items):', validCarts.length);
      console.log('📊 Detalle de carritos válidos:', validCarts.map(cart => ({
        id: cart.id,
        negocio: cart.negocio?.nombre,
        itemsCount: cart.items.length,
        items: cart.items.map(item => ({
          id: item.id,
          producto: item.productos?.nombre,
          cantidad: item.cantidad,
          valor: item.productos?.valor
        }))
      })));
      
      // Verificar que no haya items con datos corruptos
      const invalidItems = validCarts.flatMap(cart => 
        cart.items.filter(item => !item.productos || !item.productos.nombre)
      );
      
      if (invalidItems.length > 0) {
        console.warn('⚠️ Items con datos corruptos encontrados:', invalidItems.length);
        console.warn('Detalle de items corruptos:', invalidItems);
      }
      
      setCartItems(validCarts);
    } catch (error) {
      console.error('❌ Error general al cargar datos del carrito:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del carrito');
    } finally {
      setLoading(false);
      console.log('🏁 Carga de datos del carrito completada');
    }
  };

  useEffect(() => {
    loadCartData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartData();
    setRefreshing(false);
  };

  // Función para navegar a la pestaña de negocios
  const handleExploreBusinesses = () => {
    setShowNavigationModal(true);
  };

  // Función para confirmar la navegación
  const confirmNavigation = () => {
    setShowNavigationModal(false);
    if (onNavigateToTab) {
      onNavigateToTab(1); // Índice 1 = pestaña de Negocios
    }
  };

  // Función para crear el mensaje del pedido
  const createOrderMessage = (business, businessName) => {
    let message = `🚀 *¡NUEVO PEDIDO A TRAVÉS DE VECIMARKET!* 🚀\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🏪 *NEGOCIO:* ${businessName}\n\n`;
    message += `🛍️ *PRODUCTOS SOLICITADOS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    let total = 0;
    let itemCounter = 1;
    
    business.items.forEach((item, itemIndex) => {
      const valor = item.productos?.valor || 0;
      const cantidad = item.cantidad || 0;
      const subtotal = valor * cantidad;
      total += subtotal;

      message += `📦 *${itemCounter}. ${item.productos?.nombre || 'Producto sin nombre'}*\n`;
      message += `   🏷️ Tipo: ${item.productos?.tipo_producto || 'N/A'}\n`;
      message += `   💰 Precio unitario: $${valor.toFixed(2)}\n`;
      message += `   🔢 Cantidad: ${cantidad}\n`;
      message += `   📊 Subtotal: $${subtotal.toFixed(2)}\n\n`;
      
      itemCounter++;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💳 *RESUMEN DEL PEDIDO*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 Total de productos: ${getTotalItems()}\n`;
    message += `🎯 *Total a pagar: $${total.toFixed(2)}*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✨ *Este pedido fue generado automáticamente a través de VeciMarket*\n`;
    message += `📱 *Plataforma digital que conecta vecinos y negocios locales*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🙏 *¡Gracias por tu preferencia!* 🙏`;

    return message;
  };

  // Función para eliminar el carrito después del pedido
  const deleteCartAfterOrder = async (userId, businessId) => {
    try {
      const { error: deleteCartError } = await supabase
        .from('carrito')
        .delete()
        .eq('usuario_id', userId)
        .eq('id', businessId);

      if (deleteCartError) {
        console.error('Error al eliminar carrito:', deleteCartError);
      } else {
        console.log('Carrito del negocio eliminado después del pedido');
        await loadCartData();
      }
    } catch (error) {
      console.error('Error al eliminar carrito:', error);
    }
  };

  // Función para abrir WhatsApp y eliminar el carrito
  const openWhatsAppAndDeleteCart = (whatsappUrl, userId, businessId, orderId) => {
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
        // Eliminar solo el carrito específico del negocio
        deleteCartAfterOrder(userId, businessId);
        
        // Mostrar confirmación del pedido registrado
        Alert.alert(
          'Pedido Enviado',
          `Tu pedido #${orderId} ha sido registrado y enviado por WhatsApp.\n\nEl negocio podrá confirmar tu pedido desde su panel de administración.`,
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert(
          'Error',
          'No se puede abrir WhatsApp. Asegúrate de tener la aplicación instalada.',
          [{ text: 'OK' }]
        );
      }
    });
  };





  // Actualizar cantidad de un item
  const updateQuantity = async (cartId, itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(cartId, itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('carrito_items')
        .update({ cantidad: newQuantity })
        .eq('id', itemId);

      if (error) {
        console.error('Error al actualizar cantidad:', error);
        Alert.alert('Error', 'No se pudo actualizar la cantidad');
        return;
      }

      await loadCartData();
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  // Remover item del carrito
  const removeItem = async (cartId, itemId) => {
    try {
      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error al remover item:', error);
        Alert.alert('Error', 'No se pudo remover el item');
        return;
      }

      // Verificar si el carrito quedó vacío
      const { data: remainingItems } = await supabase
        .from('carrito_items')
        .select('id')
        .eq('carrito_id', cartId);

      if (remainingItems.length === 0) {
        // Eliminar el carrito vacío
        await supabase
          .from('carrito')
          .delete()
          .eq('id', cartId);
      }

      await loadCartData();
    } catch (error) {
      console.error('Error al remover item:', error);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, business) => {
      return total + business.items.reduce((businessTotal, item) => {
        return businessTotal + (item.productos.valor * item.cantidad);
      }, 0);
    }, 0);
  };

  const getDeliveryFee = () => {
    return 2.50;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const getTotalBusinesses = () => {
    return cartItems.length;
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, business) => {
      return total + business.items.reduce((businessTotal, item) => {
        return businessTotal + item.cantidad;
      }, 0);
    }, 0);
  };

  const handleCheckout = (businessId) => {
    // Encontrar el negocio específico
    const business = cartItems.find(b => b.id === businessId);
    if (!business) {
      Alert.alert('Error', 'No se encontró información del negocio');
      return;
    }



    Alert.alert(
      'Confirmar Pedido',
      `¿Deseas enviar el pedido a ${business.negocio?.nombre || 'este negocio'}?\n\nTotal: $${business.items?.reduce((total, item) => {
        const valor = item.productos?.valor || 0;
        const cantidad = item.cantidad || 0;
        return total + (valor * cantidad);
      }, 0).toFixed(2) || '0.00'}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Obtener el WhatsApp del negocio específico
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'No se pudo obtener información del usuario');
                return;
              }

              // Verificar que el negocio tenga WhatsApp configurado
              if (!business.negocio?.whatsapp) {
                Alert.alert('Error', 'Este negocio no tiene WhatsApp configurado');
                return;
              }

              // Crear el mensaje del pedido para este negocio específico
              const orderMessage = createOrderMessage(business, business.negocio.nombre);
              
              // Calcular el total del pedido
              const total = business.items?.reduce((total, item) => {
                const valor = item.productos?.valor || 0;
                const cantidad = item.cantidad || 0;
                return total + (valor * cantidad);
              }, 0) || 0;

              // Registrar el pedido en la base de datos ANTES de enviar WhatsApp
              const { data: orderData, error: orderError } = await supabase
                .from('pedidos')
                .insert({
                  usuario_id: user.id,
                  negocio_id: business.negocio_id,
                  estado: 'pendiente',
                  total: total,
                  canal_pedido: 'whatsapp',
                  mensaje_whatsapp: orderMessage,
                  fecha_pedido: new Date().toISOString()
                })
                .select()
                .single();

              if (orderError) {
                console.error('Error al registrar pedido:', orderError);
                Alert.alert('Error', 'No se pudo registrar el pedido. Inténtalo de nuevo.');
                return;
              }

              console.log('✅ Pedido registrado exitosamente:', orderData.id);

              // Ahora insertar los items del pedido en la tabla pedido_items
              const orderItems = business.items.map(item => ({
                pedido_id: orderData.id,
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.productos?.valor || 0,
                subtotal: (item.productos?.valor || 0) * item.cantidad
              }));

              const { error: itemsError } = await supabase
                .from('pedido_items')
                .insert(orderItems);

              if (itemsError) {
                console.error('Error al registrar items del pedido:', itemsError);
                // Aunque falle la inserción de items, continuamos con el pedido
                console.warn('⚠️ Pedido registrado pero items no se pudieron guardar');
              } else {
                console.log('✅ Items del pedido registrados exitosamente');
              }
              
              // Codificar el mensaje para la URL
              const encodedMessage = encodeURIComponent(orderMessage);
              
              // Construir la URL de WhatsApp
              const whatsappUrl = `${business.negocio.whatsapp}?text=${encodedMessage}`;
              
              // Abrir WhatsApp y eliminar solo este carrito
              openWhatsAppAndDeleteCart(whatsappUrl, user.id, businessId, orderData.id);
            } catch (error) {
              console.error('Error al procesar pedido:', error);
              Alert.alert('Error', 'No se pudo procesar el pedido. Inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyCart}>
      <ShoppingBagIcon style={styles.emptyIcon} fill={colors.lightGray} />
      <RNText style={styles.emptyTitle}>Tu carrito está vacío</RNText>
      <RNText style={styles.emptySubtitle}>
        Agrega productos de los negocios para comenzar
      </RNText>
      <Button style={styles.browseButton} onPress={handleExploreBusinesses}>
        Explorar Negocios
      </Button>
    </View>
  );

  const renderCartItem = (business, item) => {
    // Validar que el item tenga datos válidos
    if (!item || !item.productos) {
      return null;
    }

    return (
      <View key={item.id} style={styles.cartItem}>
        <Image 
          source={{ uri: item.productos?.imagen_url || 'https://via.placeholder.com/70x70' }} 
          style={styles.itemImage} 
          defaultSource={{ uri: 'https://via.placeholder.com/70x70' }}
        />
        
        <View style={styles.itemInfo}>
          <RNText style={styles.itemName}>
            {item.productos?.nombre || 'Producto sin nombre'}
          </RNText>
          <RNText style={styles.itemDescription}>
            {item.productos?.descripcion || 'Sin descripción'}
          </RNText>
          <RNText style={styles.itemPrice}>
            ${item.productos?.valor ? item.productos.valor.toFixed(2) : '0.00'}
          </RNText>
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(business.id, item.id, item.cantidad - 1)}
          >
            <MinusIcon style={styles.quantityIcon} fill={colors.secondary} />
          </TouchableOpacity>
          
          <RNText style={styles.quantityText}>{item.cantidad || 0}</RNText>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(business.id, item.id, item.cantidad + 1)}
          >
            <PlusIcon style={styles.quantityIcon} fill={colors.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(business.id, item.id)}
          >
            <TrashIcon style={styles.removeIcon} fill={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBusinessSection = (business) => (
    <Card key={business.id} style={styles.businessCard}>
      {/* Header del negocio */}
      <View style={styles.businessHeader}>
        <View style={styles.businessHeaderLeft}>
          <Image 
            source={{ uri: business.negocio?.logo_url || 'https://via.placeholder.com/50x50' }} 
            style={styles.businessImage} 
            defaultSource={{ uri: 'https://via.placeholder.com/50x50' }}
          />
          <View style={styles.businessInfo}>
            <RNText style={styles.businessName}>
              {business.negocio?.nombre || 'Negocio sin nombre'}
            </RNText>
            <RNText style={styles.businessItemsCount}>
              {business.items?.length || 0} {business.items?.length === 1 ? 'producto' : 'productos'}
            </RNText>
          </View>
        </View>
        
        <View style={styles.businessHeaderRight}>
          <RNText style={styles.businessTotal}>
            ${business.items?.reduce((total, item) => {
              const valor = item.productos?.valor || 0;
              const cantidad = item.cantidad || 0;
              return total + (valor * cantidad);
            }, 0).toFixed(2) || '0.00'}
          </RNText>
        </View>
      </View>
      
      {/* Lista de productos del negocio */}
      <View style={styles.productsList}>
        {business.items && business.items.length > 0 && (
          business.items
            .filter(item => item && item.productos && item.productos.nombre)
            .map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.productItem}>
                <Image 
                  source={{ uri: item.productos.imagen_url || 'https://via.placeholder.com/70x70' }} 
                  style={styles.productImage} 
                  defaultSource={{ uri: 'https://via.placeholder.com/70x70' }}
                />
                
                <View style={styles.productInfo}>
                  <RNText style={styles.productName} numberOfLines={2}>
                    {item.productos.nombre}
                  </RNText>
                  <RNText style={styles.productDescription} numberOfLines={1}>
                    {item.productos.descripcion || 'Sin descripción'}
                  </RNText>
                  <RNText style={styles.productPrice}>
                    ${item.productos.valor ? item.productos.valor.toFixed(2) : '0.00'}
                  </RNText>
                </View>
                
                <View style={styles.productActions}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(business.id, item.id, item.cantidad - 1)}
                    >
                      <MinusIcon style={styles.quantityIcon} fill={colors.secondary} />
                    </TouchableOpacity>
                    
                    <RNText style={styles.quantityText}>{item.cantidad || 0}</RNText>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(business.id, item.id, item.cantidad + 1)}
                    >
                      <PlusIcon style={styles.quantityIcon} fill={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(business.id, item.id)}
                  >
                    <TrashIcon style={styles.removeIcon} fill={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}
      </View>
      
      {/* Botón de pedido para este negocio */}
      <View style={styles.businessActions}>
        <Button 
          style={styles.orderNowButton}
          size="small"
          onPress={() => handleCheckout(business.id)}
        >
          Pedir por WhatsApp - ${business.items?.reduce((total, item) => {
            const valor = item.productos?.valor || 0;
            const cantidad = item.cantidad || 0;
            return total + (valor * cantidad);
          }, 0).toFixed(2) || '0.00'}
        </Button>
      </View>
    </Card>
  );

  const renderGeneralSummary = () => (
    <Card style={[styles.summaryCard, styles.globalNoVerticalLines]}>
      <RNText style={styles.summaryTitle}>Resumen General</RNText>
      
      <View style={[styles.summaryRow, styles.globalNoVerticalLines]}>
        <RNText style={styles.summaryLabel}>Total de Negocios</RNText>
        <RNText style={styles.summaryValue}>{getTotalBusinesses()}</RNText>
      </View>
      
      <View style={[styles.summaryRow, styles.globalNoVerticalLines]}>
        <RNText style={styles.summaryLabel}>Total de Artículos</RNText>
        <RNText style={styles.summaryValue}>{getTotalItems()}</RNText>
      </View>
      
      <View style={styles.divider} />
      
      <View style={[styles.summaryRow, styles.globalNoVerticalLines]}>
        <RNText style={styles.summaryTotalLabel}>Valor Total</RNText>
        <RNText style={styles.summaryTotalValue}>${getTotal().toFixed(2)}</RNText>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <Layout style={styles.container}>
        <View style={styles.loadingContainer}>
          <Spinner size="large" />
          <RNText style={styles.loadingText}>Cargando carrito...</RNText>
        </View>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout style={[styles.container, styles.globalNoVerticalLines]}>
        <View style={[styles.enhancedHeader, styles.globalNoVerticalLines]}>
          <View style={[styles.headerBackground, styles.globalNoVerticalLines]}>
            <View style={[styles.headerGradient, styles.globalNoVerticalLines]} />
          </View>
          
          <View style={[styles.headerContent, styles.globalNoVerticalLines]}>
            <View style={[styles.headerLeft, styles.globalNoVerticalLines]}>
              <View style={[styles.appLogoContainer, styles.globalNoVerticalLines]}>
                <ShoppingBagIcon style={styles.appLogoIcon} fill={colors.secondary} />
              </View>
              <View style={[styles.appTitleContainer, styles.globalNoVerticalLines]}>
                <RNText style={styles.appTitle}>Mi Carrito</RNText>
                <RNText style={styles.appSubtitle}>Tus compras pendientes</RNText>
              </View>
            </View>
          </View>
        </View>
        
        <ScrollView 
          style={[styles.content, styles.globalNoVerticalLines]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contentContainer, styles.globalNoVerticalLines]}
        >
          {renderEmptyCart()}
        </ScrollView>

        {/* Modal de confirmación de navegación */}
        <Modal
          visible={showNavigationModal}
          backdropStyle={styles.modalBackdrop}
          onBackdropPress={() => setShowNavigationModal(false)}
        >
          <Card disabled style={styles.modalCard}>
            <View style={styles.modalContent}>
              <ShoppingBagIcon style={styles.modalIcon} fill={colors.secondary} />
              <RNText style={styles.modalTitle}>Explorar Negocios</RNText>
              <RNText style={styles.modalMessage}>
                ¿Te gustaría navegar a la sección de Negocios para agregar productos a tu carrito?
              </RNText>
              
              <View style={styles.modalActions}>
                <Button
                  appearance="outline"
                  status="basic"
                  style={styles.modalCancelButton}
                  onPress={() => setShowNavigationModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  style={styles.modalConfirmButton}
                  onPress={confirmNavigation}
                >
                  Continuar
                </Button>
              </View>
            </View>
          </Card>
        </Modal>
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, styles.globalNoVerticalLines]}>
      <View style={[styles.enhancedHeader, styles.globalNoVerticalLines]}>
        <View style={[styles.headerBackground, styles.globalNoVerticalLines]}>
          <View style={[styles.headerGradient, styles.globalNoVerticalLines]} />
        </View>
        
        <View style={[styles.headerContent, styles.globalNoVerticalLines]}>
          <View style={[styles.headerLeft, styles.globalNoVerticalLines]}>
            <View style={[styles.appLogoContainer, styles.globalNoVerticalLines]}>
              <ShoppingBagIcon style={styles.appLogoIcon} fill={colors.secondary} />
            </View>
            <View style={[styles.appTitleContainer, styles.globalNoVerticalLines]}>
              <RNText style={styles.appTitle}>Mi Carrito</RNText>
              <RNText style={styles.appSubtitle}>Tus compras pendientes</RNText>
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={[styles.content, styles.globalNoVerticalLines]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, styles.globalNoVerticalLines]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {cartItems.map(renderBusinessSection)}
        
        {renderGeneralSummary()}
        
        <View style={styles.generalCheckoutInfo}>
          <RNText style={styles.generalCheckoutText}>
            💡 Cada negocio tiene su propio botón "Pedir por WhatsApp" arriba
          </RNText>
          <RNText style={styles.generalCheckoutSubtext}>
            Total general: ${getTotal().toFixed(2)}
          </RNText>
        </View>
      </ScrollView>

      {/* Modal de confirmación de navegación */}
      <Modal
        visible={showNavigationModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowNavigationModal(false)}
      >
        <Card disabled style={styles.modalCard}>
          <View style={styles.modalContent}>
            <ShoppingBagIcon style={styles.modalIcon} fill={colors.secondary} />
            <RNText style={styles.modalTitle}>Explorar Negocios</RNText>
            <RNText style={styles.modalMessage}>
              ¿Te gustaría navegar a la sección de Negocios para agregar productos a tu carrito?
            </RNText>
            
            <View style={styles.modalActions}>
              <Button
                appearance="outline"
                status="basic"
                style={styles.modalCancelButton}
                onPress={() => setShowNavigationModal(false)}
              >
                Cancelar
              </Button>
              <Button
                style={styles.modalConfirmButton}
                onPress={confirmNavigation}
              >
                Continuar
              </Button>
            </View>
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
    borderWidth: 0,
    // Eliminar cualquier línea vertical
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
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
  content: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 100,
    backgroundColor: colors.lightGray,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    minHeight: 400,
    backgroundColor: colors.white,
    borderRadius: 20,
    margin: 20,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 32,
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  businessCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 0,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.lightGray + '20',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray + '40',
  },
  businessHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  businessItemsCount: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '500',
  },
  businessHeaderRight: {
    alignItems: 'flex-end',
  },
  businessTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  // Lista de productos
  productsList: {
    padding: 0,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    padding: 12,
    backgroundColor: colors.lightGray + '20',
    borderRadius: 12,
    borderWidth: 0,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    marginLeft: -10,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  productDescription: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 5,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 90,
    marginLeft: 8,
  },
  quantityControls: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    justifyContent: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0,
  },
  quantityIcon: {
    width: 10,
    height: 10,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginVertical: 1,
    minWidth: 16,
    textAlign: 'center',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  removeIcon: {
    width: 10,
    height: 10,
  },
  
  businessActions: {
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray + '40',
  },
  
  orderNowButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 180,
  },


  summaryCard: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0,
    // Eliminar cualquier línea vertical
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderWidth: 0,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  checkoutButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 20,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0,
    // Eliminar cualquier línea vertical
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  
  // Estilos globales para eliminar líneas verticales
  globalNoVerticalLines: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // Estilos del modal
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    margin: 20,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderColor: colors.lightGray,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },

  // Estilos para información general de checkout
  generalCheckoutInfo: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  generalCheckoutText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  generalCheckoutSubtext: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
  },
});
