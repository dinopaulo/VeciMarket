import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Platform } from 'react-native';
import { Layout, Text, Input, Card, Button, Icon } from '@ui-kitten/components';
import colors from '../lib/colors';

// Iconos
const SearchIcon = (props) => (
  <Icon {...props} name='search-outline'/>
);

export default function BusinessHomeView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  


  const categories = [
    { id: 'todos', name: 'Todos', color: colors.primary },
    { id: 'comida', name: 'Comida', color: colors.secondary },
    { id: 'ropa', name: 'Ropa', color: '#FF6B6B' },
    { id: 'ferreteria', name: 'Ferretería', color: '#4ECDC4' },
    { id: 'belleza', name: 'Belleza', color: '#FFE66D' },
    { id: 'servicios', name: 'Servicios', color: '#A8E6CF' },
  ];

  const recentPosts = [
    {
      id: 1,
      businessName: 'Barbería Clásica',
      businessAvatar: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100',
      businessCategory: 'Belleza',
      postTime: 'Hace 2 horas',
      postContent: '¡Nuevo estilo de barba disponible! Este fin de semana tenemos 20% de descuento en todos los servicios de barba. ¡Reserva tu cita!',
      postImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
      isSaved: false
    },
    {
      id: 2,
      businessName: 'Restaurante El Sabor',
      businessAvatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
      businessCategory: 'Comida',
      postTime: 'Hace 4 horas',
      postContent: '¡Plato del día! Pollo a la plancha con arroz y ensalada fresca. Solo $8.50. ¡Ven a probarlo!',
      postImage: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400',
      likes: 45,
      comments: 12,
      shares: 5,
      isLiked: true,
      isSaved: false
    },
    {
      id: 3,
      businessName: 'Ferretería Central',
      businessAvatar: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100',
      businessCategory: 'Ferretería',
      postTime: 'Hace 6 horas',
      postContent: 'Llegó nueva mercancía: taladros, sierras y herramientas eléctricas de las mejores marcas. ¡Pregunta por nuestros precios especiales!',
      postImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
      likes: 18,
      comments: 6,
      shares: 2,
      isLiked: false,
      isSaved: true
    },
    {
      id: 4,
      businessName: 'Tienda de Ropa Moda',
      businessAvatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100',
      businessCategory: 'Ropa',
      postTime: 'Hace 1 día',
      postContent: 'Nueva colección de verano disponible. Vestidos, blusas y shorts con los mejores diseños. ¡Visítanos!',
      postImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      likes: 32,
      comments: 15,
      shares: 8,
      isLiked: false,
      isSaved: false
    }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.name);
  };



  const handleLikePost = (postId) => {
    // Aquí iría la lógica para dar like a la publicación
    console.log('Like en publicación:', postId);
  };

  const handleCommentPost = (postId) => {
    // Aquí iría la lógica para comentar en la publicación
    console.log('Comentar en publicación:', postId);
  };

  const handleSharePost = (postId) => {
    // Aquí iría la lógica para compartir la publicación
    console.log('Compartir publicación:', postId);
  };

  const handleSavePost = (postId) => {
    // Aquí iría la lógica para guardar la publicación
    console.log('Guardar publicación:', postId);
  };

  const handleContactBusiness = (businessName) => {
    // Aquí iría la lógica para contactar al negocio
    console.log('Contactar negocio:', businessName);
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Input
        placeholder="Buscar negocios o productos"
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessoryLeft={SearchIcon}
        style={styles.searchInput}
        size="large"
      />
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && styles.categoryChipActive
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.name && styles.categoryChipTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPost = (post) => (
    <Card key={post.id} style={styles.postCard}>
      {/* Header de la publicación */}
      <View style={styles.postHeader}>
        <View style={styles.businessInfo}>
          <Image source={{ uri: post.businessAvatar }} style={styles.businessAvatar} />
          <View style={styles.businessDetails}>
            <Text style={styles.businessName}>{post.businessName}</Text>
            <Text style={styles.businessCategory}>{post.businessCategory}</Text>
            <Text style={styles.postTime}>{post.postTime}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => handleContactBusiness(post.businessName)}
          activeOpacity={0.7}
        >
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de la publicación */}
      <Text style={styles.postContent}>{post.postContent}</Text>

      {/* Imagen de la publicación */}
      {post.postImage && (
        <View style={styles.postImageContainer}>
          <Image 
            source={{ uri: post.postImage }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Estadísticas de la publicación */}
      <View style={styles.postStats}>
        <Text style={styles.postStatsText}>
          {post.likes} me gusta • {post.comments} comentarios • {post.shares} compartidos
        </Text>
      </View>

      {/* Acciones de la publicación */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, post.isLiked && styles.actionButtonActive]}
          onPress={() => handleLikePost(post.id)}
          activeOpacity={0.6}
        >
          <Icon 
            name={post.isLiked ? 'heart' : 'heart-outline'} 
            style={styles.actionIcon} 
            fill={post.isLiked ? colors.danger : colors.primary}
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            Me gusta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleCommentPost(post.id)}
          activeOpacity={0.7}
        >
          <Icon name='message-circle-outline' style={styles.actionIcon} fill={colors.primary} />
          <Text style={styles.actionText}>Comentar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSharePost(post.id)}
          activeOpacity={0.7}
        >
          <Icon name='share-outline' style={styles.actionIcon} fill={colors.primary} />
          <Text style={styles.actionText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSavePost(post.id)}
          activeOpacity={0.7}
        >
          <Icon 
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'} 
            style={styles.actionIcon} 
            fill={post.isSaved ? colors.secondary : colors.primary}
          />
          <Text style={[styles.actionText, post.isSaved && styles.savedText]}>
            Guardar
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <Layout style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.contentWrapper}>
        <View style={styles.topSpacer} />
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {renderSearchBar()}
          {renderCategories()}
          
          {/* Sección de Gestión de Pedidos */}
          <View style={styles.ordersSection}>
            <View style={styles.ordersHeader}>
              <Text style={styles.ordersTitle}>📋 Gestión de Pedidos</Text>
              <Text style={styles.ordersSubtitle}>Gestiona los pedidos de tus clientes</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.ordersButton}
              activeOpacity={0.7}
              onPress={() => {
                // Aquí navegaremos a la vista de gestión de pedidos
                console.log('Navegar a gestión de pedidos');
              }}
            >
              <View style={styles.ordersButtonContent}>
                <View style={styles.ordersButtonLeft}>
                  <Text style={styles.ordersButtonTitle}>Ver Pedidos</Text>
                  <Text style={styles.ordersButtonSubtitle}>
                    Confirma, rechaza o completa pedidos
                  </Text>
                </View>
                <Icon 
                  name='arrow-forward-outline' 
                  style={styles.ordersButtonIcon} 
                  fill={colors.white}
                />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Publicaciones Recientes</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.postsContainer}>
            {recentPosts.map(renderPost)}
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const isLargeDevice = screenWidth > 414;

// Detectar si el dispositivo tiene notch (iPhone X y superiores)
const hasNotch = Platform.OS === 'ios' && (screenHeight >= 812 || screenWidth >= 812);

// Detectar dispositivos Android con características especiales (como Honor 200 Lite)
const isSpecialAndroidDevice = Platform.OS === 'android' && (screenHeight >= 800 || screenWidth >= 400);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 0,
  },
  topSpacer: {
    height: 10,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingTop: 0,
    paddingBottom: 30,
  },
  searchContainer: {
    marginTop: 4,
    marginBottom: isSmallDevice ? 20 : 24,
  },
  searchInput: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    minHeight: 56,
  },
  categoriesContainer: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  categoriesScroll: {
    paddingHorizontal: 4,
  },
  categoryChip: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: 25,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: isSmallDevice ? 80 : 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : 20,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  viewAllText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  // Estilos para la sección de pedidos
  ordersSection: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  ordersHeader: {
    marginBottom: 16,
  },
  ordersTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  ordersSubtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: colors.gray,
    lineHeight: 20,
  },
  ordersButton: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  ordersButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ordersButtonLeft: {
    flex: 1,
  },
  ordersButtonTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  ordersButtonSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.white + 'CC',
    lineHeight: 18,
  },
  ordersButtonIcon: {
    width: 24,
    height: 24,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  categoryChipText: {
    color: colors.primary,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  postsContainer: {
    gap: isSmallDevice ? 16 : 20,
  },
  postCard: {
    borderRadius: 16,
    marginBottom: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.white,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallDevice ? 14 : 16,
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingTop: isSmallDevice ? 16 : 20,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  businessAvatar: {
    width: isSmallDevice ? 44 : 48,
    height: isSmallDevice ? 44 : 48,
    borderRadius: isSmallDevice ? 22 : 24,
    marginRight: isSmallDevice ? 10 : 12,
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.secondary,
    marginBottom: 2,
  },
  postTime: {
    fontSize: isSmallDevice ? 11 : 12,
    color: colors.lightGray,
  },
  contactButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: isSmallDevice ? 14 : 16,
    paddingVertical: isSmallDevice ? 8 : 10,
    borderRadius: 20,
    minWidth: isSmallDevice ? 80 : 90,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  postContent: {
    fontSize: isSmallDevice ? 15 : 16,
    color: colors.primary,
    lineHeight: isSmallDevice ? 20 : 22,
    marginBottom: isSmallDevice ? 14 : 16,
    paddingHorizontal: isSmallDevice ? 16 : 20,
  },
  postImageContainer: {
    marginBottom: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: isSmallDevice ? 16 : 20,
  },
  postImage: {
    width: '100%',
    height: isSmallDevice ? 180 : 200,
  },
  postStats: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: isSmallDevice ? 10 : 12,
    marginBottom: isSmallDevice ? 14 : 16,
    marginHorizontal: isSmallDevice ? 16 : 20,
  },
  postStatsText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: colors.secondary,
    textAlign: 'center',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: isSmallDevice ? 10 : 12,
    paddingBottom: isSmallDevice ? 12 : 16,
    paddingHorizontal: isSmallDevice ? 8 : 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: isSmallDevice ? 8 : 12,
    minWidth: isSmallDevice ? 70 : 80,
    borderRadius: 8,
  },
  actionIcon: {
    width: isSmallDevice ? 18 : 20,
    height: isSmallDevice ? 18 : 20,
    marginRight: isSmallDevice ? 4 : 6,
  },
  actionText: {
    fontSize: isSmallDevice ? 12 : 14,
    color: colors.primary,
    fontWeight: '500',
  },
  likedText: {
    color: colors.danger,
    fontWeight: '600',
  },
  savedText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  actionButtonActive: {
    backgroundColor: colors.lightGray + '30',
  },
});
