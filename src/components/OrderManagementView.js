import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Text as RNText, RefreshControl, Dimensions } from 'react-native';
import { Layout, Card, Button, Icon, Spinner, Modal, Input } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

const { width } = Dimensions.get('window');

// Iconos
const CheckIcon = (props) => (
  <Icon {...props} name='checkmark-circle-outline'/>
);

const CloseIcon = (props) => (
  <Icon {...props} name='close-circle-outline'/>
);

const ClockIcon = (props) => (
  <Icon {...props} name='clock-outline'/>
);

const DoneIcon = (props) => (
  <Icon {...props} name='checkmark-done-outline'/>
);

const EyeIcon = (props) => (
  <Icon {...props} name='eye-outline'/>
);

const MessageIcon = (props) => (
  <Icon {...props} name='message-circle-outline'/>
);

const TrendingIcon = (props) => (
  <Icon {...props} name='trending-up-outline'/>
);

export default function OrderManagementView({ businessId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Estados de pedido
  const ORDER_STATUSES = {
    pendiente: { 
      label: 'Pendiente', 
      color: '#FF9500', 
      bgColor: '#FFF4E6',
      icon: ClockIcon 
    },
    confirmado: { 
      label: 'Confirmado', 
      color: '#007AFF', 
      bgColor: '#E6F3FF',
      icon: CheckIcon 
    },
    rechazado: { 
      label: 'Rechazado', 
      color: '#FF3B30', 
      bgColor: '#FFE6E6',
      icon: CloseIcon 
    },
    completado: { 
      label: 'Completado', 
      color: '#34C759', 
      bgColor: '#E6F7E6',
      icon: DoneIcon 
    },
    cancelado: { 
      label: 'Cancelado', 
      color: '#8E8E93', 
      bgColor: '#F2F2F7',
      icon: CloseIcon 
    }
  };

  // Cargar pedidos del negocio
  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primero obtener los pedidos
      const { data: ordersData, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('negocio_id', businessId)
        .order('fecha_pedido', { ascending: false });

      if (ordersError) {
        console.error('Error al cargar pedidos:', ordersError);
        Alert.alert('Error', 'No se pudieron cargar los pedidos');
        return;
      }

      // Luego obtener los items de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Obtener items del pedido
          const { data: itemsData } = await supabase
            .from('pedido_items')
            .select(`
              *,
              producto:producto_id (
                id,
                nombre,
                imagen_url
              )
            `)
            .eq('pedido_id', order.id);

          // Obtener información del usuario
          const { data: userData } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('id', order.usuario_id)
            .single();

          return {
            ...order,
            items: itemsData || [],
            usuario: userData || { id: order.usuario_id, nombre: 'Usuario no encontrado' }
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadOrders();
    }
  }, [businessId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Cambiar estado del pedido
  const changeOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      const updateData = {
        estado: newStatus,
        updated_at: new Date().toISOString()
      };

      // Agregar fecha de confirmación si se confirma
      if (newStatus === 'confirmado') {
        updateData.fecha_confirmacion = new Date().toISOString();
      }

      // Agregar fecha de completado si se completa
      if (newStatus === 'completado') {
        updateData.fecha_completado = new Date().toISOString();
      }

      // Agregar notas si las hay
      if (notes.trim()) {
        updateData.notas_negocio = notes;
      }

      const { error: updateError } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        console.error('Error al actualizar pedido:', updateError);
        Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
        return;
      }

      Alert.alert('Éxito', `Pedido ${ORDER_STATUSES[newStatus].label.toLowerCase()}`);
      setShowStatusModal(false);
      setNewStatus('');
      setNotes('');
      await loadOrders();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del pedido');
    }
  };

  // Mostrar modal de cambio de estado
  const showStatusChangeModal = (order, status) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setShowStatusModal(true);
  };

  // Renderizar item del pedido
  const renderOrderItem = (item) => (
    <View key={item.id} style={styles.orderItem}>
      <View style={styles.orderItemLeft}>
        <View style={styles.orderItemImagePlaceholder}>
          <RNText style={styles.orderItemImageText}>
            {item.producto?.nombre?.charAt(0) || 'P'}
          </RNText>
        </View>
        <View style={styles.orderItemInfo}>
          <RNText style={styles.orderItemName}>
            {item.producto?.nombre || 'Producto sin nombre'}
          </RNText>
          <RNText style={styles.orderItemDetails}>
            Cantidad: {item.cantidad} × ${item.precio_unitario.toFixed(2)}
          </RNText>
        </View>
      </View>
      <View style={styles.orderItemRight}>
        <RNText style={styles.orderItemSubtotal}>
          ${item.subtotal.toFixed(2)}
        </RNText>
      </View>
    </View>
  );

  // Renderizar pedido
  const renderOrder = (order) => {
    const statusInfo = ORDER_STATUSES[order.estado] || ORDER_STATUSES.pendiente;
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <StatusIcon style={[styles.statusIcon, { fill: statusInfo.color }]} />
              <RNText style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </RNText>
            </View>
            <View style={styles.orderInfo}>
              <RNText style={styles.orderId}>Pedido #{order.id.slice(0, 8)}</RNText>
              <RNText style={styles.orderDate}>
                {new Date(order.fecha_pedido).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </RNText>
            </View>
          </View>
          <View style={styles.orderTotalContainer}>
            <RNText style={styles.orderTotalLabel}>Total</RNText>
            <RNText style={styles.orderTotal}>
              ${order.total.toFixed(2)}
            </RNText>
          </View>
        </View>

        <View style={styles.orderItems}>
          {order.items?.map(renderOrderItem)}
        </View>

        <View style={styles.orderFooter}>
          <RNText style={styles.orderCustomer}>
            Cliente: {order.usuario?.nombre || 'No identificado'}
          </RNText>
        </View>

        <View style={styles.orderActions}>
          <Button
            size="small"
            appearance="outline"
            style={styles.actionButton}
            onPress={() => {
              setSelectedOrder(order);
              setShowOrderDetail(true);
            }}
          >
            Ver Detalle
          </Button>

          {order.estado === 'pendiente' && (
            <>
              <Button
                size="small"
                status="success"
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => showStatusChangeModal(order, 'confirmado')}
              >
                Confirmar
              </Button>
              <Button
                size="small"
                status="danger"
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => showStatusChangeModal(order, 'rechazado')}
              >
                Rechazar
              </Button>
            </>
          )}

          {order.estado === 'confirmado' && (
            <Button
              size="small"
              status="success"
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => showStatusChangeModal(order, 'completado')}
            >
              Completar
            </Button>
          )}
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <TrendingIcon style={styles.loadingIcon} fill={colors.primary} />
          </View>
          <RNText style={styles.loadingText}>Cargando pedidos...</RNText>
          <RNText style={styles.loadingSubtext}>Preparando tu panel de gestión</RNText>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <RNText style={styles.headerTitle}>📋 Gestión de Pedidos</RNText>
          <RNText style={styles.headerSubtitle}>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
          </RNText>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <RNText style={styles.statNumber}>
                {orders.filter(o => o.estado === 'pendiente').length}
              </RNText>
              <RNText style={styles.statLabel}>Pendientes</RNText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <RNText style={styles.statNumber}>
                {orders.filter(o => o.estado === 'confirmado').length}
              </RNText>
              <RNText style={styles.statLabel}>Confirmados</RNText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <RNText style={styles.statNumber}>
                {orders.filter(o => o.estado === 'completado').length}
              </RNText>
              <RNText style={styles.statLabel}>Completados</RNText>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageIcon style={styles.emptyIcon} fill={colors.lightGray} />
            </View>
            <RNText style={styles.emptyTitle}>No hay pedidos pendientes</RNText>
            <RNText style={styles.emptySubtitle}>
              Los pedidos que reciban tus clientes aparecerán aquí
            </RNText>
            <View style={styles.emptyDecoration} />
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map(renderOrder)}
          </View>
        )}
      </ScrollView>

      {/* Modal de detalle del pedido */}
      <Modal
        visible={showOrderDetail}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowOrderDetail(false)}
      >
        <Card disabled style={styles.modalCard}>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <RNText style={styles.modalTitle}>📋 Detalle del Pedido</RNText>
                <View style={styles.modalDivider} />
              </View>
              
              {selectedOrder && (
                <>
                  <View style={styles.orderDetailSection}>
                    <RNText style={styles.orderDetailLabel}>👤 Cliente:</RNText>
                    <RNText style={styles.orderDetailValue}>
                      {selectedOrder.usuario?.nombre || 'Cliente no identificado'}
                    </RNText>
                  </View>

                  <View style={styles.orderDetailSection}>
                    <RNText style={styles.orderDetailLabel}>📅 Fecha:</RNText>
                    <RNText style={styles.orderDetailValue}>
                      {new Date(selectedOrder.fecha_pedido).toLocaleString('es-ES')}
                    </RNText>
                  </View>

                  <View style={styles.orderDetailSection}>
                    <RNText style={styles.orderDetailLabel}>🏷️ Estado:</RNText>
                    <View style={styles.orderDetailStatus}>
                      <RNText style={styles.orderDetailValue}>
                        {ORDER_STATUSES[selectedOrder.estado]?.label || 'Desconocido'}
                      </RNText>
                    </View>
                  </View>

                  <View style={styles.orderDetailSection}>
                    <RNText style={styles.orderDetailLabel}>💰 Total:</RNText>
                    <RNText style={styles.orderDetailTotal}>
                      ${selectedOrder.total.toFixed(2)}
                    </RNText>
                  </View>

                  {selectedOrder.mensaje_whatsapp && (
                    <View style={styles.orderDetailSection}>
                      <RNText style={styles.orderDetailLabel}>💬 Mensaje WhatsApp:</RNText>
                      <RNText style={styles.orderDetailMessage}>
                        {selectedOrder.mensaje_whatsapp}
                      </RNText>
                    </View>
                  )}

                  {selectedOrder.notas_negocio && (
                    <View style={styles.orderDetailSection}>
                      <RNText style={styles.orderDetailLabel}>📝 Notas del negocio:</RNText>
                      <RNText style={styles.orderDetailValue}>
                        {selectedOrder.notas_negocio}
                      </RNText>
                    </View>
                  )}

                  <Button
                    style={styles.modalCloseButton}
                    onPress={() => setShowOrderDetail(false)}
                  >
                    Cerrar
                  </Button>
                </>
              )}
            </View>
          </ScrollView>
        </Card>
      </Modal>

      {/* Modal de cambio de estado */}
      <Modal
        visible={showStatusModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowStatusModal(false)}
      >
        <Card disabled style={styles.modalCard}>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <RNText style={styles.modalTitle}>
                  🔄 Cambiar Estado a: {ORDER_STATUSES[newStatus]?.label}
                </RNText>
                <View style={styles.modalDivider} />
              </View>
              
              <Input
                label="📝 Notas (opcional)"
                placeholder="Agregar notas sobre el cambio de estado..."
                value={notes}
                onChangeText={setNotes}
                multiline
                textStyle={styles.notesInput}
                style={styles.notesInputContainer}
              />

              <View style={styles.modalActions}>
                <Button
                  appearance="outline"
                  status="basic"
                  style={styles.modalActionButton}
                  onPress={() => setShowStatusModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  style={styles.modalActionButton}
                  onPress={() => changeOrderStatus(selectedOrder.id, newStatus, notes)}
                >
                  Confirmar
                </Button>
              </View>
            </View>
          </ScrollView>
        </Card>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.95,
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  ordersContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingIcon: {
    width: 40,
    height: 40,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.lightGray + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    width: 50,
    height: 50,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  emptyDecoration: {
    width: 60,
    height: 4,
    backgroundColor: colors.primary + '30',
    borderRadius: 2,
    marginTop: 30,
  },
  orderCard: {
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 0,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderInfo: {
    marginTop: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: colors.gray,
    opacity: 0.8,
  },
  orderTotalContainer: {
    alignItems: 'flex-end',
  },
  orderTotalLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.secondary,
  },
  orderItems: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray + '20',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderItemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderItemImageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  orderItemDetails: {
    fontSize: 14,
    color: colors.gray,
    opacity: 0.8,
  },
  orderItemRight: {
    alignItems: 'flex-end',
  },
  orderItemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  orderFooter: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray + '20',
    paddingTop: 16,
  },
  orderCustomer: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    height: 44,
  },
  confirmButton: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    margin: 20,
    borderRadius: 24,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    maxHeight: '80%',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDivider: {
    width: 60,
    height: 4,
    backgroundColor: colors.primary + '30',
    borderRadius: 2,
  },
  orderDetailSection: {
    marginBottom: 20,
  },
  orderDetailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderDetailValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  orderDetailStatus: {
    backgroundColor: colors.lightGray + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  orderDetailTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.secondary,
  },
  orderDetailMessage: {
    fontSize: 14,
    color: colors.primary,
    backgroundColor: colors.lightGray + '20',
    padding: 16,
    borderRadius: 12,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  notesInputContainer: {
    marginBottom: 24,
  },
  notesInput: {
    minHeight: 100,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 12,
    height: 48,
  },
  modalCloseButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    marginTop: 8,
    borderRadius: 12,
    height: 48,
  },
});
