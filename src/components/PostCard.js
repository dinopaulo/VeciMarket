import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, Alert, Dimensions } from 'react-native';
import { Button, Icon, Modal, Card, Divider } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import CommentsModal from './CommentsModal';

export default function PostCard({ post, userProfile, onPostUpdated, onNavigateToProduct }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { width: screenWidth } = Dimensions.get('window');

  // Iconos
  const HeartIcon = (props) => <Icon {...props} name='heart'/>;
  const HeartFillIcon = (props) => <Icon {...props} name='heart'/>;
  const HeartOutlineIcon = (props) => <Icon {...props} name='heart-outline'/>;
  const MessageIcon = (props) => <Icon {...props} name='message-circle'/>;
  const ShareIcon = (props) => <Icon {...props} name='share'/>;
  const PackageIcon = (props) => <Icon {...props} name='cube'/>;
  const ChevronLeftIcon = (props) => <Icon {...props} name='chevron-left'/>;
  const ChevronRightIcon = (props) => <Icon {...props} name='chevron-right'/>;
  const CodeIcon = (props) => <Icon {...props} name='code'/>;
  const ClockIcon = (props) => <Icon {...props} name='clock'/>;
  const CheckmarkIcon = (props) => <Icon {...props} name='checkmark'/>;
  const CloseIcon = (props) => <Icon {...props} name='close'/>;

  useEffect(() => {
    console.log('=== POSTCARD DEBUG ===');
    console.log('Post ID:', post.id);
    console.log('Post completo:', JSON.stringify(post, null, 2));
    console.log('Fotos:', post.fotos);
    console.log('Producto:', {
      nombre: post.nombre_producto,
      precio: post.precio_producto,
      descripcion: post.descripcion_producto
    });
    console.log('====================');
    
    loadPostData();
  }, [post.id]);

  // Cargar datos del post
  const loadPostData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar contadores
      const [likesResult, commentsResult, sharesResult, userLikeResult, userFavoriteResult] = await Promise.all([
        supabase.from('likes_publicaciones').select('*', { count: 'exact' }).eq('publicacion_id', post.id),
        supabase.from('comentarios_publicaciones').select('*', { count: 'exact' }).eq('publicacion_id', post.id).eq('estado', 'activo'),
        supabase.from('compartir_publicaciones').select('*', { count: 'exact' }).eq('publicacion_id', post.id),
        supabase.from('likes_publicaciones').select('*').eq('publicacion_id', post.id).eq('usuario_id', user.id).single(),
        supabase.from('publicaciones_favoritas').select('*').eq('publicacion_id', post.id).eq('usuario_id', user.id).single()
      ]);

      // Verificar errores
      if (likesResult.error) console.error('Error al cargar likes:', likesResult.error);
      if (commentsResult.error) console.error('Error al cargar comentarios:', commentsResult.error);
      if (sharesResult.error) console.error('Error al cargar shares:', sharesResult.error);
      if (userLikeResult.error && userLikeResult.error.code !== 'PGRST116') console.error('Error al cargar like del usuario:', userLikeResult.error);
      if (userFavoriteResult.error && userFavoriteResult.error.code !== 'PGRST116') console.error('Error al cargar favorito del usuario:', userFavoriteResult.error);

      setLikesCount(likesResult.count || 0);
      setCommentsCount(commentsResult.count || 0);
      setSharesCount(sharesResult.count || 0);
      setIsLiked(!!userLikeResult.data);
      setIsFavorited(!!userFavoriteResult.data);
    } catch (error) {
      console.error('Error al cargar datos del post:', error);
    }
  };

  // Dar/quitar like
  const toggleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para dar me gusta');
        return;
      }

      if (isLiked) {
        // Quitar like
        const { error } = await supabase
          .from('likes_publicaciones')
          .delete()
          .eq('publicacion_id', post.id)
          .eq('usuario_id', user.id);

        if (error) {
          console.error('Error al quitar like:', error);
          Alert.alert('Error', 'No se pudo quitar el me gusta');
          return;
        }

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Dar like
        const { error } = await supabase
          .from('likes_publicaciones')
          .insert({
            publicacion_id: post.id,
            usuario_id: user.id
          });

        if (error) {
          console.error('Error al dar like:', error);
          Alert.alert('Error', 'No se pudo dar me gusta');
          return;
        }

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error al toggle like:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Agregar/quitar de favoritos
  const toggleFavorite = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorited) {
        // Quitar de favoritos
        const { error } = await supabase
          .from('publicaciones_favoritas')
          .delete()
          .eq('publicacion_id', post.id)
          .eq('usuario_id', user.id);

        if (!error) {
          setIsFavorited(false);
        }
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('publicaciones_favoritas')
          .insert({
            publicacion_id: post.id,
            usuario_id: user.id
          });

        if (!error) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error('Error al toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar modal de funcionalidad en desarrollo
  const sharePost = () => {
    setShowDevelopmentModal(true);
  };

  // Navegar al detalle del producto
  const handleProductPress = () => {
    if (!onNavigateToProduct || !post.nombre_producto) return;
    
    // Crear objeto producto con la estructura esperada por ProductDetailView
    const productData = {
      id: post.producto_id || post.id, // Usar producto_id si existe, sino el post.id
      nombre: post.nombre_producto,
      descripcion: post.descripcion_producto,
      valor: post.precio_producto,
      precio: post.precio_producto,
      tipo_producto: post.tipo_producto || 'Producto',
      categoria: post.categoria_producto,
      stock: post.stock_producto,
      disponibilidad: post.disponibilidad_producto || 'disponible',
      imagen_url: post.imagen_producto,
      negocio_id: post.negocio_id,
      negocio_whatsapp: post.whatsapp_negocio,
      created_at: post.fecha_publicacion,
      updated_at: post.fecha_publicacion,
      descuento: post.descuento_producto || 0,
      precio_especial: post.precio_especial_producto,
      es_promocion: post.es_promocion_producto || false
    };
    
    onNavigateToProduct(productData);
  };

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

  // Renderizar fotos
  const renderPhotos = () => {
    if (!post.fotos || post.fotos.length === 0) return null;

    return (
      <View style={styles.photosContainer}>
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: post.fotos[currentPhotoIndex]?.url_imagen || post.fotos[currentPhotoIndex]?.url }} 
            style={styles.photo}
            resizeMode="cover"
          />
          
          {post.fotos.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.photoNavButton, styles.photoNavLeft]}
                onPress={() => setCurrentPhotoIndex(prev => 
                  prev > 0 ? prev - 1 : post.fotos.length - 1
                )}
              >
                <ChevronLeftIcon style={styles.photoNavIcon} fill={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.photoNavButton, styles.photoNavRight]}
                onPress={() => setCurrentPhotoIndex(prev => 
                  prev < post.fotos.length - 1 ? prev + 1 : 0
                )}
              >
                <ChevronRightIcon style={styles.photoNavIcon} fill={colors.white} />
              </TouchableOpacity>
              
              <View style={styles.photoIndicators}>
                {post.fotos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoIndicator,
                      index === currentPhotoIndex && styles.photoIndicatorActive
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  // Renderizar información del producto
  const renderProductInfo = () => {
    if (!post.nombre_producto) return null;

    return (
      <TouchableOpacity 
        style={styles.productInfo}
        onPress={handleProductPress}
        activeOpacity={0.8}
      >
        <View style={styles.productIconContainer}>
          <PackageIcon style={styles.productIcon} fill={colors.white} />
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productLabel}>Producto relacionado:</Text>
          <Text style={styles.productName}>{post.nombre_producto}</Text>
          {post.precio_producto && (
            <Text style={styles.productPrice}>${post.precio_producto}</Text>
          )}
          {post.descripcion_producto && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {post.descripcion_producto}
            </Text>
          )}
        </View>
        <View style={styles.productArrow}>
          <Icon name="arrow-forward" style={styles.arrowIcon} fill={colors.secondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header del post */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <View style={styles.businessLogoContainer}>
            {post.logo_negocio ? (
              <Image 
                source={{ uri: post.logo_negocio }} 
                style={styles.businessLogo}
              />
            ) : (
              <View style={styles.businessLogoPlaceholder}>
                <Icon name="briefcase" style={styles.businessLogoIcon} fill={colors.secondary} />
              </View>
            )}
          </View>
          
          <View style={styles.businessDetails}>
            <Text style={styles.businessName}>{post.nombre_negocio}</Text>
            <Text style={styles.businessCategory}>{post.categoria_negocio}</Text>
            <Text style={styles.postTime}>{getTimeAgo(post.fecha_publicacion)}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          {isFavorited ? (
            <HeartFillIcon style={styles.favoriteIcon} fill={colors.danger} />
          ) : (
            <HeartOutlineIcon style={styles.favoriteIcon} fill={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Contenido del post */}
      <Text style={styles.content}>{post.contenido}</Text>

      {/* Información del producto */}
      {renderProductInfo()}

      {/* Fotos */}
      {renderPhotos()}
      
      {/* Indicador de fotos si hay múltiples */}
      {post.fotos && post.fotos.length > 1 && (
        <View style={styles.photoCountIndicator}>
          <Icon name="images" style={styles.photoCountIcon} fill={colors.secondary} />
          <Text style={styles.photoCountText}>
            {post.fotos.length} foto{post.fotos.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Acciones del post */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={toggleLike}
          disabled={loading}
        >
          {isLiked ? (
            <HeartFillIcon style={styles.actionIcon} fill={colors.danger} />
          ) : (
            <HeartIcon style={styles.actionIcon} fill={colors.primary} />
          )}
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(true)}
        >
          <MessageIcon style={styles.actionIcon} fill={colors.primary} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={sharePost}
        >
          <ShareIcon style={styles.actionIcon} fill={colors.primary} />
          <Text style={styles.actionText}>{sharesCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de comentarios */}
      <CommentsModal
        visible={showComments}
        postId={post.id}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => {
          setCommentsCount(prev => prev + 1);
          onPostUpdated && onPostUpdated();
        }}
      />

      {/* Modal de funcionalidad en desarrollo */}
      <Modal
        visible={showDevelopmentModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowDevelopmentModal(false)}
      >
        <Card style={styles.developmentModal}>
          <View style={styles.developmentHeader}>
            <View style={styles.developmentIconContainer}>
              <CodeIcon style={styles.developmentIcon} fill={colors.secondary} />
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDevelopmentModal(false)}
            >
              <CloseIcon style={styles.closeIcon} fill={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.developmentContent}>
            <Text style={styles.developmentTitle}>Funcionalidad en Desarrollo</Text>
            <Text style={styles.developmentSubtitle}>
              Estamos trabajando en esta característica
            </Text>
            
            <View style={styles.developmentFeatures}>
              <View style={styles.featureItem}>
                <CheckmarkIcon style={styles.featureIcon} fill={colors.success} />
                <Text style={styles.featureText}>Compartir en redes sociales</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckmarkIcon style={styles.featureIcon} fill={colors.success} />
                <Text style={styles.featureText}>Enviar por mensaje</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckmarkIcon style={styles.featureIcon} fill={colors.success} />
                <Text style={styles.featureText}>Copiar enlace</Text>
              </View>
              <View style={styles.featureItem}>
                <ClockIcon style={styles.featureIcon} fill={colors.warning} />
                <Text style={styles.featureText}>Compartir con contactos</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.developmentFooter}>
              <ClockIcon style={styles.clockIcon} fill={colors.primary} />
              <Text style={styles.developmentFooterText}>
                Próximamente disponible
              </Text>
            </View>
          </View>
          
          <Button
            style={styles.developmentButton}
            status="primary"
            onPress={() => setShowDevelopmentModal(false)}
          >
            Entendido
          </Button>
        </Card>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
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
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.7,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
  },
  content: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  productIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIcon: {
    width: 20,
    height: 20,
  },
  productDetails: {
    flex: 1,
  },
  productLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 2,
    fontWeight: '500',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 18,
  },
  productArrow: {
    marginLeft: 8,
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  photosContainer: {
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  photo: {
    width: '100%',
    height: 280,
  },
  photoNavButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -20 }],
  },
  photoNavLeft: {
    left: 10,
  },
  photoNavRight: {
    right: 10,
  },
  photoNavIcon: {
    width: 20,
    height: 20,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  photoIndicatorActive: {
    backgroundColor: colors.white,
  },
  photoCountIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'center',
  },
  photoCountIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  photoCountText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  actionTextActive: {
    color: colors.danger,
  },
  // Estilos del modal de desarrollo
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  developmentModal: {
    margin: 20,
    borderRadius: 16,
    padding: 0,
    maxWidth: 400,
    alignSelf: 'center',
  },
  developmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  developmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  developmentIcon: {
    width: 24,
    height: 24,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  developmentContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  developmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  developmentSubtitle: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  developmentFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 16,
    height: 16,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.primary,
    flex: 1,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: colors.lightGray,
  },
  developmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clockIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  developmentFooterText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  developmentButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
  },
});
