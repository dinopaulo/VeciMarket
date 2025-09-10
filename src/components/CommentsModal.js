import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Input, Button, Icon, Modal } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CommentsModal({ visible, postId, onClose, onCommentAdded }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Hook para manejar cambios de orientación
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Hook para manejar el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Iconos - Solo usando iconos que existen en UI Kitten
  const CloseIcon = (props) => <Icon {...props} name='close'/>;
  const SendIcon = (props) => <Icon {...props} name='paper-plane'/>;
  const HeartIcon = (props) => <Icon {...props} name='heart'/>;
  const HeartFillIcon = (props) => <Icon {...props} name='heart'/>;
  const PersonIcon = (props) => <Icon {...props} name='person'/>;
  const BackIcon = (props) => <Icon {...props} name='arrow-left'/>;
  const CameraIcon = (props) => <Icon {...props} name='image'/>;
  const SmileIcon = (props) => <Icon {...props} name='star'/>;
  const MessageIcon = (props) => <Icon {...props} name='message-circle'/>;

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  // Cargar comentarios
  const loadComments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comentarios_publicaciones')
        .select(`
          *,
          usuarios (
            id,
            nombre,
            correo
          ),
          likes_comentarios (
            id,
            usuario_id
          )
        `)
        .eq('publicacion_id', postId)
        .eq('estado', 'activo')
        .order('fecha_comentario', { ascending: true });

      if (error) {
        console.error('Error al cargar comentarios:', error);
        return;
      }

      // Separar comentarios principales y respuestas
      const comentariosPrincipales = (data || []).filter(c => !c.comentario_padre_id);
      const respuestas = (data || []).filter(c => c.comentario_padre_id);

      // Procesar comentarios principales
      const comentariosConLikes = comentariosPrincipales.map(comentario => ({
        ...comentario,
        likes_count: comentario.likes_comentarios?.length || 0,
        user_liked: false,
        respuestas: respuestas
          .filter(r => r.comentario_padre_id === comentario.id)
          .map(respuesta => ({
            ...respuesta,
            likes_count: respuesta.likes_comentarios?.length || 0,
            user_liked: false
          }))
      }));

      // Verificar likes del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const comentariosActualizados = await Promise.all(
          comentariosConLikes.map(async (comentario) => {
            // Like del comentario principal
            const { data: userLike } = await supabase
              .from('likes_comentarios')
              .select('*')
              .eq('comentario_id', comentario.id)
              .eq('usuario_id', user.id)
              .single();

            // Likes de las respuestas
            const respuestasConLikes = await Promise.all(
              comentario.respuestas.map(async (respuesta) => {
                const { data: userLikeRespuesta } = await supabase
                  .from('likes_comentarios')
                  .select('*')
                  .eq('comentario_id', respuesta.id)
                  .eq('usuario_id', user.id)
                  .single();
                
                return {
                  ...respuesta,
                  user_liked: !!userLikeRespuesta
                };
              })
            );
            
            return {
              ...comentario,
              user_liked: !!userLike,
              respuestas: respuestasConLikes
            };
          })
        );
        setComentarios(comentariosActualizados);
      } else {
        setComentarios(comentariosConLikes);
      }
    } catch (error) {
      console.error('Error general:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar comentario
  const sendComment = async () => {
    if (!nuevoComentario.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

       const { data, error } = await supabase
         .from('comentarios_publicaciones')
         .insert({
           publicacion_id: postId,
           usuario_id: user.id,
           contenido: nuevoComentario.trim(),
           estado: 'activo'
         })
         .select(`
           *,
           usuarios (
             id,
             nombre,
             correo
           )
         `)
         .single();

      if (error) {
        console.error('Error al enviar comentario:', error);
        Alert.alert('Error', 'No se pudo enviar el comentario');
        return;
      }

      setComentarios(prev => [...prev, data]);
      setNuevoComentario('');
      onCommentAdded && onCommentAdded();
    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  // Iniciar respuesta a un comentario o respuesta
  const startReply = (comentario, esRespuesta = false) => {
    setReplyingTo({ ...comentario, esRespuesta });
    setReplyText('');
  };

  // Cancelar respuesta
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  // Enviar respuesta
  const sendReply = async () => {
    if (!replyText.trim() || !replyingTo) {
      Alert.alert('Error', 'La respuesta no puede estar vacía');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      // Determinar el comentario padre correcto
      let comentarioPadreId = replyingTo.id;
      
      // Si estamos respondiendo a una respuesta, usar el comentario principal
      if (replyingTo.esRespuesta) {
        // Buscar el comentario principal que contiene esta respuesta
        const comentarioPrincipal = comentarios.find(c => 
          c.respuestas.some(r => r.id === replyingTo.id)
        );
        if (comentarioPrincipal) {
          comentarioPadreId = comentarioPrincipal.id;
        }
      }

      const { data, error } = await supabase
        .from('comentarios_publicaciones')
        .insert({
          publicacion_id: postId,
          usuario_id: user.id,
          contenido: replyText.trim(),
          estado: 'activo',
          comentario_padre_id: comentarioPadreId
        })
        .select(`
          *,
          usuarios (
            id,
            nombre,
            correo
          )
        `)
        .single();

      if (error) {
        console.error('Error al enviar respuesta:', error);
        Alert.alert('Error', 'No se pudo enviar la respuesta');
        return;
      }

      // Actualizar estado local
      const updatedComentarios = comentarios.map(comentario => {
        if (comentario.id === comentarioPadreId) {
          return {
            ...comentario,
            respuestas: [...comentario.respuestas, { ...data, likes_count: 0, user_liked: false }]
          };
        }
        return comentario;
      });

      setComentarios(updatedComentarios);
      setReplyText('');
      setReplyingTo(null);
      onCommentAdded && onCommentAdded();
    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar la respuesta');
    } finally {
      setSending(false);
    }
  };

  // Dar/quitar like a comentario principal
  const toggleCommentLike = async (comentarioId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Encontrar el comentario en el estado local
      const comentarioIndex = comentarios.findIndex(c => c.id === comentarioId);
      if (comentarioIndex === -1) return;

      const comentario = comentarios[comentarioIndex];
      const isLiked = comentario.user_liked;

      // Actualización optimista del estado local
      const updatedComentarios = [...comentarios];
      updatedComentarios[comentarioIndex] = {
        ...comentario,
        user_liked: !isLiked,
        likes_count: isLiked ? comentario.likes_count - 1 : comentario.likes_count + 1
      };
      setComentarios(updatedComentarios);

      // Verificar si ya dio like
      const { data: existingLike } = await supabase
        .from('likes_comentarios')
        .select('*')
        .eq('comentario_id', comentarioId)
        .eq('usuario_id', user.id)
        .single();

      if (existingLike) {
        // Quitar like
        const { error } = await supabase
          .from('likes_comentarios')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('usuario_id', user.id);
        
        if (error) {
          console.error('Error al quitar like:', error);
          // Revertir cambio optimista en caso de error
          setComentarios(comentarios);
          return;
        }
      } else {
        // Dar like
        const { error } = await supabase
          .from('likes_comentarios')
          .insert({
            comentario_id: comentarioId,
            usuario_id: user.id
          });
        
        if (error) {
          console.error('Error al dar like:', error);
          // Revertir cambio optimista en caso de error
          setComentarios(comentarios);
          return;
        }
      }
    } catch (error) {
      console.error('Error al toggle like comentario:', error);
      // Revertir cambio optimista en caso de error
      setComentarios(comentarios);
    }
  };

  // Dar/quitar like a respuesta
  const toggleReplyLike = async (respuestaId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Encontrar la respuesta en el estado local
      let respuestaEncontrada = null;
      let comentarioPadreIndex = -1;
      let respuestaIndex = -1;

      for (let i = 0; i < comentarios.length; i++) {
        const comentario = comentarios[i];
        const respuestaIndex = comentario.respuestas.findIndex(r => r.id === respuestaId);
        if (respuestaIndex !== -1) {
          respuestaEncontrada = comentario.respuestas[respuestaIndex];
          comentarioPadreIndex = i;
          break;
        }
      }

      if (!respuestaEncontrada || comentarioPadreIndex === -1) return;

      const isLiked = respuestaEncontrada.user_liked;

      // Actualización optimista del estado local
      const updatedComentarios = [...comentarios];
      updatedComentarios[comentarioPadreIndex] = {
        ...updatedComentarios[comentarioPadreIndex],
        respuestas: updatedComentarios[comentarioPadreIndex].respuestas.map(r => 
          r.id === respuestaId 
            ? {
                ...r,
                user_liked: !isLiked,
                likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1
              }
            : r
        )
      };
      setComentarios(updatedComentarios);

      // Verificar si ya dio like
      const { data: existingLike } = await supabase
        .from('likes_comentarios')
        .select('*')
        .eq('comentario_id', respuestaId)
        .eq('usuario_id', user.id)
        .single();

      if (existingLike) {
        // Quitar like
        const { error } = await supabase
          .from('likes_comentarios')
          .delete()
          .eq('comentario_id', respuestaId)
          .eq('usuario_id', user.id);
        
        if (error) {
          console.error('Error al quitar like de respuesta:', error);
          // Revertir cambio optimista en caso de error
          setComentarios(comentarios);
          return;
        }
      } else {
        // Dar like
        const { error } = await supabase
          .from('likes_comentarios')
          .insert({
            comentario_id: respuestaId,
            usuario_id: user.id
          });
        
        if (error) {
          console.error('Error al dar like a respuesta:', error);
          // Revertir cambio optimista en caso de error
          setComentarios(comentarios);
          return;
        }
      }
    } catch (error) {
      console.error('Error al toggle like respuesta:', error);
      // Revertir cambio optimista en caso de error
      setComentarios(comentarios);
    }
  };

  // Obtener tiempo transcurrido
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'ahora';
    
    const now = new Date();
    const created = new Date(timestamp);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes === 1) return 'hace 1 minuto';
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return 'hace 1 hora';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'hace 1 día';
    return `hace ${diffInDays} días`;
  };

  // Renderizar respuesta
  const renderReply = (respuesta) => (
    <View key={respuesta.id} style={styles.replyItem}>
      <View style={styles.replyHeader}>
        <View style={styles.replyUserInfo}>
          <View style={styles.replyAvatar}>
            <Text style={styles.replyAvatarText}>
              {(respuesta.usuarios?.nombre || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.replyUserDetails}>
            <Text style={styles.replyUserName}>
              {respuesta.usuarios?.nombre || 'Usuario'}
            </Text>
            <Text style={styles.replyTime}>
              {getTimeAgo(respuesta.fecha_comentario)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.replyContentContainer}>
        <Text style={styles.replyContent}>{respuesta.contenido}</Text>
      </View>
      
      <View style={styles.replyActions}>
        <TouchableOpacity 
          style={styles.replyActionButton}
          onPress={() => toggleReplyLike(respuesta.id)}
        >
          {respuesta.user_liked ? (
            <HeartFillIcon style={[styles.replyActionIcon, { fill: colors.danger }]} />
          ) : (
            <HeartIcon style={styles.replyActionIcon} fill={colors.primary} />
          )}
          <Text style={[
            styles.replyActionText,
            respuesta.user_liked && styles.replyActionTextActive
          ]}>
            {respuesta.likes_count > 0 ? `${respuesta.likes_count}` : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.replyToReplyButton}
          onPress={() => startReply(respuesta, true)}
        >
          <Text style={styles.replyToReplyText}>Responder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar comentario
  const renderComment = (comentario) => (
    <View key={comentario.id} style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {(comentario.usuarios?.nombre || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentUserDetails}>
            <Text style={styles.commentUserName}>
              {comentario.usuarios?.nombre || 'Usuario'}
            </Text>
            <Text style={styles.commentTime}>
              {getTimeAgo(comentario.fecha_comentario)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.commentContentContainer}>
        <Text style={styles.commentContent}>{comentario.contenido}</Text>
      </View>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.commentActionButton}
          onPress={() => toggleCommentLike(comentario.id)}
        >
          {comentario.user_liked ? (
            <HeartFillIcon style={[styles.commentActionIcon, { fill: colors.danger }]} />
          ) : (
            <HeartIcon style={styles.commentActionIcon} fill={colors.primary} />
          )}
          <Text style={[
            styles.commentActionText,
            comentario.user_liked && styles.commentActionTextActive
          ]}>
            {comentario.likes_count > 0 ? `${comentario.likes_count}` : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => startReply(comentario)}
        >
          <Text style={styles.replyButtonText}>Responder</Text>
        </TouchableOpacity>
      </View>

      {/* Respuestas */}
      {comentario.respuestas && comentario.respuestas.length > 0 && (
        <View style={styles.repliesContainer}>
          {comentario.respuestas.map(renderReply)}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      backdropStyle={styles.modalBackdrop}
      onBackdropPress={onClose}
      animationType="slide"
    >
      <KeyboardAvoidingView 
        style={[styles.fullScreenContainer, { marginBottom: isKeyboardVisible ? keyboardHeight : 0 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header estilo Facebook */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <BackIcon style={styles.backIcon} fill={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Comentarios</Text>
          </View>
        </View>

        {/* Lista de comentarios */}
        <ScrollView 
          style={[styles.commentsList, { maxHeight: isKeyboardVisible ? screenHeight - keyboardHeight - 200 : screenHeight - 200 }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsContent}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando comentarios...</Text>
            </View>
          ) : comentarios.length > 0 ? (
            comentarios.map(renderComment)
          ) : (
            <View style={styles.emptyState}>
            <View style={styles.emptyStateIcons}>
              <MessageIcon style={styles.emptyIcon1} fill={colors.lightGray} />
              <MessageIcon style={styles.emptyIcon2} fill={colors.lightGray} />
            </View>
              <Text style={styles.emptyStateText}>Aún no hay comentarios</Text>
              <Text style={styles.emptyStateSubtext}>
                Sé la primera persona en comentar
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input para nuevo comentario o respuesta */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                {replyingTo.esRespuesta ? 'Respondiendo a respuesta de' : 'Respondiendo a'} {replyingTo.usuarios?.nombre || 'Usuario'}
              </Text>
              <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                <Text style={styles.cancelReplyText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <Input
              placeholder={replyingTo ? "Escribe una respuesta..." : "Comentar..."}
              value={replyingTo ? replyText : nuevoComentario}
              onChangeText={replyingTo ? setReplyText : setNuevoComentario}
              style={styles.commentInput}
              textStyle={styles.commentInputText}
              multiline={false}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                ((replyingTo ? !replyText.trim() : !nuevoComentario.trim()) || sending) && styles.sendButtonDisabled
              ]}
              onPress={replyingTo ? sendReply : sendComment}
              disabled={sending || (replyingTo ? !replyText.trim() : !nuevoComentario.trim())}
            >
              <SendIcon style={styles.sendIcon} fill={(replyingTo ? replyText.trim() : nuevoComentario.trim()) ? colors.white : colors.lightGray} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  commentsList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  commentsContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.primary,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcons: {
    position: 'relative',
    marginBottom: 20,
  },
  emptyIcon1: {
    width: 60,
    height: 60,
    opacity: 0.3,
  },
  emptyIcon2: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 10,
    left: 20,
    opacity: 0.2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.7,
    textAlign: 'center',
  },
  commentItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGray,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.6,
  },
  commentContentContainer: {
    marginLeft: 52,
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 15,
    color: colors.primary,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 52,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 16,
  },
  commentActionIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  commentActionText: {
    fontSize: 13,
    color: colors.primary,
    opacity: 0.7,
    fontWeight: '500',
  },
  commentActionTextActive: {
    color: colors.danger,
    opacity: 1,
    fontWeight: '600',
  },
  replyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyButtonText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
  },
  repliesContainer: {
    marginLeft: 52,
    marginTop: 8,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: colors.lightGray,
  },
  replyItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGray,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  replyAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  replyUserDetails: {
    flex: 1,
  },
  replyUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 1,
  },
  replyTime: {
    fontSize: 11,
    color: colors.primary,
    opacity: 0.6,
  },
  replyContentContainer: {
    marginLeft: 42,
    marginBottom: 6,
  },
  replyContent: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 18,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 42,
  },
  replyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginRight: 12,
  },
  replyActionIcon: {
    width: 14,
    height: 14,
    marginRight: 3,
  },
  replyActionText: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.7,
    fontWeight: '500',
  },
  replyActionTextActive: {
    color: colors.danger,
    opacity: 1,
    fontWeight: '600',
  },
  replyToReplyButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  replyToReplyText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  replyingToText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  cancelReplyButton: {
    padding: 4,
  },
  cancelReplyText: {
    fontSize: 16,
    color: colors.primary,
    opacity: 0.7,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginRight: 12,
  },
  commentInputText: {
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  sendIcon: {
    width: 18,
    height: 18,
  },
});
