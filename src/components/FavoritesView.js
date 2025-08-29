import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Layout, Text, Card, Button, Icon, Input } from '@ui-kitten/components';
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
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: 'Restaurante El Sabor',
      category: 'Comida',
      rating: 4.8,
      reviews: 127,
      distance: '0.5 km',
      address: 'Av. Principal 123',
      phone: '+593 9 1234 5678',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300',
      isOpen: true,
      tags: ['Restaurante', 'Local', 'Familiar'],
      isFavorite: true
    },
    {
      id: 2,
      name: 'Barbería Clásica',
      category: 'Belleza',
      rating: 4.9,
      reviews: 89,
      distance: '1.2 km',
      address: 'Calle Comercial 456',
      phone: '+593 9 8765 4321',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300',
      isOpen: true,
      tags: ['Barbería', 'Cortes', 'Estilos'],
      isFavorite: true
    },
    {
      id: 3,
      name: 'Ferretería Central',
      category: 'Ferretería',
      rating: 4.6,
      reviews: 203,
      distance: '0.8 km',
      address: 'Plaza Central 789',
      phone: '+593 9 1111 2222',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300',
      isOpen: false,
      tags: ['Herramientas', 'Materiales', 'Construcción'],
      isFavorite: true
    },
    {
      id: 4,
      name: 'Tienda de Ropa Moda',
      category: 'Ropa',
      rating: 4.7,
      reviews: 156,
      distance: '1.5 km',
      address: 'Centro Comercial 321',
      phone: '+593 9 3333 4444',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
      isOpen: true,
      tags: ['Ropa', 'Moda', 'Tendencias'],
      isFavorite: true
    }
  ]);

  const filteredFavorites = favorites.filter(business =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (businessId) => {
    Alert.alert(
      'Eliminar de Favoritos',
      '¿Estás seguro de que quieres eliminar este negocio de tus favoritos?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setFavorites(prev => prev.filter(business => business.id !== businessId));
          },
        },
      ]
    );
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
      <Text style={styles.emptyTitle}>No tienes favoritos</Text>
      <Text style={styles.emptySubtitle}>
        Agrega negocios a tus favoritos para verlos aquí
      </Text>
    </View>
  );

  const renderFavoriteCard = (business) => (
    <Card key={business.id} style={styles.favoriteCard}>
      <View style={styles.businessImageContainer}>
        <Image source={{ uri: business.image }} style={styles.businessImage} />
        <View style={styles.businessStatus}>
          <View style={[
            styles.statusIndicator,
            business.isOpen ? styles.statusOpen : styles.statusClosed
          ]}>
            <Text style={styles.statusText}>
              {business.isOpen ? 'Abierto' : 'Cerrado'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(business.id)}
        >
          <HeartIcon style={styles.favoriteIcon} fill={colors.danger} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.businessInfo}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>{business.name}</Text>
          <View style={styles.ratingContainer}>
            <StarIcon style={styles.starIcon} fill={colors.secondary} />
            <Text style={styles.ratingText}>{business.rating}</Text>
            <Text style={styles.reviewsText}>({business.reviews})</Text>
          </View>
        </View>
        
        <Text style={styles.businessCategory}>{business.category}</Text>
        
        <View style={styles.businessTags}>
          {business.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.businessDetails}>
          <View style={styles.detailItem}>
            <LocationIcon style={styles.detailIcon} fill={colors.secondary} />
            <Text style={styles.detailText}>{business.address}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <PhoneIcon style={styles.detailIcon} fill={colors.secondary} />
            <Text style={styles.detailText}>{business.phone}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.distanceText}>{business.distance}</Text>
          </View>
        </View>
        
        <View style={styles.businessActions}>
          <Button
            style={styles.viewButton}
            size="small"
            appearance="outline"
            onPress={() => handleViewDetails(business)}
          >
            Ver Detalles
          </Button>
          
          <Button
            style={styles.contactButton}
            size="small"
            onPress={() => handleContact(business)}
          >
            Contactar
          </Button>
        </View>
      </View>
    </Card>
  );

  return (
    <Layout style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderSearchBar()}
        
        {filteredFavorites.length === 0 ? (
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
    paddingVertical: 60,
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
  },
  favoritesContainer: {
    gap: 20,
  },
  favoriteCard: {
    borderRadius: 16,
    marginBottom: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  businessImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  businessImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  businessStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusOpen: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusClosed: {
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteIcon: {
    width: 20,
    height: 20,
  },
  businessInfo: {
    padding: 4,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.secondary,
  },
  businessCategory: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  businessTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  businessDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.primary,
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  businessActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 12,
  },
});
