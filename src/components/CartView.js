import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Layout, Text, Card, Button, Icon, Input, Divider } from '@ui-kitten/components';
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

const LocationIcon = (props) => (
  <Icon {...props} name='pin-outline'/>
);

export default function CartView() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      businessName: 'Restaurante El Sabor',
      businessImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
      items: [
        {
          id: 1,
          name: 'Pollo a la Plancha',
          description: 'Con arroz y ensalada',
          price: 8.50,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=100'
        },
        {
          id: 2,
          name: 'Sopa de Mariscos',
          description: 'Sopa casera con mariscos frescos',
          price: 6.00,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100'
        }
      ]
    },
    {
      id: 2,
      businessName: 'Barbería Clásica',
      businessImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100',
      items: [
        {
          id: 3,
          name: 'Corte Clásico',
          description: 'Corte de cabello tradicional',
          price: 12.00,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100'
        }
      ]
    }
  ]);

  const [deliveryAddress, setDeliveryAddress] = useState('Av. Principal 123, Quito');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const updateQuantity = (businessId, itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(businessId, itemId);
      return;
    }

    setCartItems(prev => prev.map(business => {
      if (business.id === businessId) {
        return {
          ...business,
          items: business.items.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        };
      }
      return business;
    }));
  };

  const removeItem = (businessId, itemId) => {
    setCartItems(prev => prev.map(business => {
      if (business.id === businessId) {
        const filteredItems = business.items.filter(item => item.id !== itemId);
        if (filteredItems.length === 0) {
          return null; // Remove business if no items left
        }
        return { ...business, items: filteredItems };
      }
      return business;
    }).filter(Boolean)); // Remove null businesses
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, business) => {
      return total + business.items.reduce((businessTotal, item) => {
        return businessTotal + (item.price * item.quantity);
      }, 0);
    }, 0);
  };

  const getDeliveryFee = () => {
    return 2.50;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const handleCheckout = () => {
    Alert.alert(
      'Confirmar Pedido',
      `Total: $${getTotal().toFixed(2)}\n¿Deseas proceder con el pedido?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            Alert.alert('Éxito', 'Tu pedido ha sido confirmado');
            setCartItems([]);
          },
        },
      ]
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyCart}>
      <ShoppingBagIcon style={styles.emptyIcon} fill={colors.lightGray} />
      <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
      <Text style={styles.emptySubtitle}>
        Agrega productos de los negocios para comenzar
      </Text>
      <Button style={styles.browseButton}>
        Explorar Negocios
      </Button>
    </View>
  );

  const renderCartItem = (business, item) => (
    <View key={item.id} style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(business.id, item.id, item.quantity - 1)}
        >
          <MinusIcon style={styles.quantityIcon} fill={colors.secondary} />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(business.id, item.id, item.quantity + 1)}
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

  const renderBusinessSection = (business) => (
    <Card key={business.id} style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <Image source={{ uri: business.businessImage }} style={styles.businessImage} />
        <Text style={styles.businessName}>{business.businessName}</Text>
      </View>
      
      <Divider style={styles.divider} />
      
      {business.items.map(item => renderCartItem(business, item))}
      
      <View style={styles.businessTotal}>
        <Text style={styles.businessTotalText}>
          Subtotal: ${business.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
        </Text>
      </View>
    </Card>
  );

  const renderOrderSummary = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Resumen del Pedido</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>${getSubtotal().toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Envío</Text>
        <Text style={styles.summaryValue}>${getDeliveryFee().toFixed(2)}</Text>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryTotalLabel}>Total</Text>
        <Text style={styles.summaryTotalValue}>${getTotal().toFixed(2)}</Text>
      </View>
    </Card>
  );

  const renderDeliveryInfo = () => (
    <Card style={styles.deliveryCard}>
      <Text style={styles.deliveryTitle}>Información de Entrega</Text>
      
      <View style={styles.deliverySection}>
        <View style={styles.deliveryHeader}>
          <LocationIcon style={styles.deliveryIcon} fill={colors.secondary} />
          <Text style={styles.deliveryLabel}>Dirección de Entrega</Text>
        </View>
        <Input
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          style={styles.deliveryInput}
          size="medium"
        />
      </View>
      
      <View style={styles.deliverySection}>
        <Text style={styles.deliveryLabel}>Instrucciones Adicionales</Text>
        <Input
          value={deliveryInstructions}
          onChangeText={setDeliveryInstructions}
          placeholder="Ej: Llamar antes de llegar"
          style={styles.deliveryInput}
          size="medium"
          multiline
          numberOfLines={2}
        />
      </View>
    </Card>
  );

  if (cartItems.length === 0) {
    return (
      <Layout style={styles.container}>
        {renderEmptyCart()}
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.pageTitle}>Mi Carrito</Text>
        
        {cartItems.map(renderBusinessSection)}
        
        {renderDeliveryInfo()}
        {renderOrderSummary()}
        
        <Button
          style={styles.checkoutButton}
          size="large"
          onPress={handleCheckout}
          accessoryLeft={CreditCardIcon}
        >
          Proceder al Pago - ${getTotal().toFixed(2)}
        </Button>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
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
  },
  businessCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  divider: {
    marginVertical: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityIcon: {
    width: 16,
    height: 16,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeIcon: {
    width: 16,
    height: 16,
  },
  businessTotal: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  businessTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  deliveryCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  deliverySection: {
    marginBottom: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  deliveryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  deliveryInput: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  summaryCard: {
    marginBottom: 24,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.primary,
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
    color: colors.secondary,
  },
  checkoutButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 16,
    height: 56,
  },
});
