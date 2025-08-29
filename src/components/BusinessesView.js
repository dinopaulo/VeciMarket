import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Layout, Text, Card, Button, Icon, Input, Select, SelectItem } from '@ui-kitten/components';
import colors from '../lib/colors';

// Iconos
const SearchIcon = (props) => (
  <Icon {...props} name='search-outline'/>
);

const FilterIcon = (props) => (
  <Icon {...props} name='options-outline'/>
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

export default function BusinessesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedSort, setSelectedSort] = useState('Relevancia');

  const categories = [
    'Todas', 'Comida', 'Ropa', 'Ferretería', 'Belleza', 'Servicios', 'Salud', 'Educación'
  ];

  const sortOptions = [
    'Relevancia', 'Más Cercanos', 'Mejor Calificados', 'Más Populares'
  ];

  const businesses = [
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
      tags: ['Restaurante', 'Local', 'Familiar']
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
      tags: ['Barbería', 'Cortes', 'Estilos']
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
      tags: ['Herramientas', 'Materiales', 'Construcción']
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
      tags: ['Ropa', 'Moda', 'Tendencias']
    },
    {
      id: 5,
      name: 'Farmacia Salud',
      category: 'Salud',
      rating: 4.5,
      reviews: 98,
      distance: '0.3 km',
      address: 'Esquina Principal 654',
      phone: '+593 9 5555 6666',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
      isOpen: true,
      tags: ['Farmacia', 'Medicamentos', 'Salud']
    }
  ];

  const renderSearchAndFilters = () => (
    <View style={styles.searchFiltersContainer}>
      <Input
        placeholder="Buscar negocios..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessoryLeft={SearchIcon}
        style={styles.searchInput}
        size="medium"
      />
      
      <View style={styles.filtersRow}>
        <Select
          selectedIndex={categories.indexOf(selectedCategory)}
          onSelect={(index) => setSelectedCategory(categories[index.row])}
          value={selectedCategory}
          style={styles.filterSelect}
          size="small"
          placeholder="Categoría"
        >
          {categories.map((category) => (
            <SelectItem key={category} title={category} />
          ))}
        </Select>
        
        <Select
          selectedIndex={sortOptions.indexOf(selectedSort)}
          onSelect={(index) => setSelectedSort(sortOptions[index.row])}
          value={selectedSort}
          style={styles.filterSelect}
          size="small"
          placeholder="Ordenar por"
        >
          {sortOptions.map((option) => (
            <SelectItem key={option} title={option} />
          ))}
        </Select>
      </View>
    </View>
  );

  const renderBusinessCard = (business) => (
    <Card key={business.id} style={styles.businessCard}>
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
          >
            Ver Detalles
          </Button>
          
          <Button
            style={styles.contactButton}
            size="small"
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
        {renderSearchAndFilters()}
        
        <View style={styles.businessesContainer}>
          {businesses.map(renderBusinessCard)}
        </View>
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
  searchFiltersContainer: {
    marginBottom: 24,
  },
  searchInput: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterSelect: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  businessesContainer: {
    gap: 20,
  },
  businessCard: {
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
