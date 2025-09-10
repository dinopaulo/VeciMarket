import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { Input, Button, Icon, Modal } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

export default function CommentsModal({ visible, postId, onClose, onCommentAdded }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Iconos
  const CloseIcon = (props) => <Icon {...props} name='close'/>;
  const SendIcon = (props) => <Icon {...props} name='paper-plane'/>;
  const HeartIcon = (props) => <Icon {...props} name='heart'/>;
  const HeartFillIcon = (props) => <Icon {...props} name='heart-fill'/>;
  const PersonIcon = (props) => <Icon {...props} name='person'/>;

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
            email
          )
        `)
        .eq('publicacion_id', postId)
        .eq('estado', 'activo')
        .order('fecha_comentario', { ascending: true });

      if (error) {
        console.error('Error al cargar comentarios:', error);
        return;
      }

      setComentarios(data || []);
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
            email
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

  // Dar/quitar like a comentario
  const toggleCommentLike = async (comentarioId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si ya dio like
      const { data: existingLike } = await supabase
        .from('likes_comentarios')
        .select('*')
        .eq('comentario_id', comentarioId)
        .eq('usuario_id', user.id)
        .single();

      if (existingLike) {
        // Quitar like
        await supabase
          .from('likes_comentarios')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('usuario_id', user.id);
      } else {
        // Dar like
        await supabase
          .from('likes_comentarios')
          .insert({
            comentario_id: comentarioId,
            usuario_id: user.id
          });
      }

      // Recargar comentarios para actualizar contadores
      loadComments();
    } catch (error) {
      console.error('Error al toggle like comentario:', error);
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

  // Renderizar comentario
  const renderComment = (comentario) => (
    <View key={comentario.id} style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.commentAvatar}>
            <PersonIcon style={styles.commentAvatarIcon} fill={colors.primary} />
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
      
      <Text style={styles.commentContent}>{comentario.contenido}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.commentActionButton}
          onPress={() => toggleCommentLike(comentario.id)}
        >
          <HeartIcon style={styles.commentActionIcon} fill={colors.primary} />
          <Text style={styles.commentActionText}>Me gusta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      backdropStyle={styles.modalBackdrop}
      onBackdropPress={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comentarios</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseIcon style={styles.closeIcon} fill={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Lista de comentarios */}
        <ScrollView 
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando comentarios...</Text>
            </View>
          ) : comentarios.length > 0 ? (
            comentarios.map(renderComment)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay comentarios aún</Text>
              <Text style={styles.emptyStateSubtext}>
                Sé el primero en comentar esta publicación
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input para nuevo comentario */}
        <View style={styles.inputContainer}>
          <Input
            placeholder="Escribe un comentario..."
            value={nuevoComentario}
            onChangeText={setNuevoComentario}
            style={styles.commentInput}
            multiline
            textStyle={styles.commentInputText}
          />
          <Button
            size="small"
            appearance="filled"
            status="primary"
            accessoryLeft={SendIcon}
            onPress={sendComment}
            disabled={sending || !nuevoComentario.trim()}
            style={styles.sendButton}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '95%',
    height: '80%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarIcon: {
    width: 20,
    height: 20,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.7,
  },
  commentContent: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commentActionIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  commentActionText: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  commentInput: {
    flex: 1,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  commentInputText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    borderRadius: 20,
  },
});
