import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, RefreshControl, Dimensions } from 'react-native';
import { Layout, Card, Button, Icon, Spinner, Modal, Input } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;

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
  <Icon {...props} name='checkmark-outline'/>
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

const FilterIcon = (props) => (
  <Icon {...props} name='funnel-outline'/>
);

const CalendarIcon = (props) => (
  <Icon {...props} name='calendar-outline'/>
);

const SunIcon = (props) => (
  <Icon {...props} name='sun-outline'/>
);

const MoonIcon = (props) => (
  <Icon {...props} name='moon-outline'/>
);

const ChevronDownIcon = (props) => (
  <Icon {...props} name='chevron-down-outline'/>
);

const ChevronUpIcon = (props) => (
  <Icon {...props} name='chevron-up-outline'/>
);

const ModalCheckIcon = (props) => (
  <Icon {...props} name='checkmark-circle'/>
);

const ModalAlertIcon = (props) => (
  <Icon {...props} name='alert-circle'/>
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
  const [selectedDateFilter, setSelectedDateFilter] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  // Opciones de filtro por fecha
  const DATE_FILTERS = [
    { key: 'todos', label: 'Todos', icon: 'calendar-outline' },
    { key: 'hoy', label: 'Hoy', icon: 'sun-outline' },
    { key: 'ayer', label: 'Ayer', icon: 'moon-outline' },
    { key: 'semana', label: 'Esta semana', icon: 'calendar-outline' },
    { key: 'mes', label: 'Este mes', icon: 'calendar-outline' }
  ];

  // Opciones de filtro por estado
  const STATUS_FILTERS = [
    { key: 'todos', label: 'Todos', color: '#6C757D' },
    { key: 'pendiente', label: 'Pendientes', color: '#FF9500' },
    { key: 'confirmado', label: 'Confirmados', color: '#007AFF' },
    { key: 'completado', label: 'Completados', color: '#34C759' },
    { key: 'rechazado', label: 'Rechazados', color: '#FF3B30' }
  ];

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
      console.log('🔄 OrderManagementView: Iniciando carga de pedidos para negocio:', businessId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No hay usuario autenticado');
        return;
      }

      console.log('👤 Usuario autenticado:', user.id);

      // Primero obtener los pedidos
      const { data: ordersData, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('negocio_id', businessId)
        .order('fecha_pedido', { ascending: false });

      if (ordersError) {
        console.error('❌ Error al cargar pedidos:', ordersError);
        setModalTitle('Error');
        setModalMessage('No se pudieron cargar los pedidos');
        setShowErrorModal(true);
        return;
      }

      console.log('📦 Pedidos encontrados:', ordersData?.length || 0);

      // Luego obtener los items de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          console.log('🔍 Procesando pedido:', order.id);
          
          // Obtener items del pedido
          const { data: itemsData, error: itemsError } = await supabase
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

          if (itemsError) {
            console.error('❌ Error al cargar items del pedido:', order.id, itemsError);
          } else {
            console.log('📋 Items del pedido', order.id, ':', itemsData?.length || 0);
          }

          // Obtener información del usuario
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('id', order.usuario_id)
            .single();

          if (userError) {
            console.error('❌ Error al cargar usuario del pedido:', order.id, userError);
          } else {
            console.log('👤 Usuario del pedido', order.id, ':', userData?.nombre || 'No encontrado');
          }

          return {
            ...order,
            items: itemsData || [],
            usuario: userData || { id: order.usuario_id, nombre: 'Usuario no encontrado' }
          };
        })
      );

      console.log('✅ Pedidos procesados:', ordersWithItems.length);
      setOrders(ordersWithItems);
      filterOrders(ordersWithItems, selectedDateFilter, selectedStatusFilter);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar pedidos por fecha y estado
  const filterOrders = (ordersList, dateFilter, statusFilter) => {
    let filtered = ordersList;

    // Filtrar por fecha
    if (dateFilter !== 'todos') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.fecha_pedido);
        
        switch (dateFilter) {
          case 'hoy':
            return orderDate >= today;
          case 'ayer':
            return orderDate >= yesterday && orderDate < today;
          case 'semana':
            return orderDate >= weekAgo;
          case 'mes':
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filtrar por estado
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(order => order.estado === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    if (businessId) {
      loadOrders();
    }
  }, [businessId]);

  useEffect(() => {
    filterOrders(orders, selectedDateFilter, selectedStatusFilter);
  }, [selectedDateFilter, selectedStatusFilter, orders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSelectedDateFilter('todos');
    setSelectedStatusFilter('todos');
  };

  // Función para obtener el icono del filtro de fecha
  const getDateFilterIcon = (filterKey) => {
    const filter = DATE_FILTERS.find(f => f.key === filterKey);
    switch (filter?.icon) {
      case 'sun-outline':
        return SunIcon;
      case 'moon-outline':
        return MoonIcon;
      default:
        return CalendarIcon;
    }
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
        setModalTitle('Error');
        setModalMessage('No se pudo actualizar el estado del pedido');
        setShowErrorModal(true);
        return;
      }

      setModalTitle('Éxito');
      setModalMessage(`Pedido ${ORDER_STATUSES[newStatus].label.toLowerCase()}`);
      setShowSuccessModal(true);
      setShowStatusModal(false);
      setNewStatus('');
      setNotes('');
      
      // Recargar pedidos después de un pequeño delay para evitar conflictos
      setTimeout(async () => {
        await loadOrders();
      }, 100);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setModalTitle('Error');
      setModalMessage('No se pudo cambiar el estado del pedido');
      setShowErrorModal(true);
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
            appearance="filled"
            status="primary"
            style={styles.actionButton}
            onPress={() => {
              console.log('🔍 Botón "Ver Detalle" presionado para pedido:', order.id);
              console.log('📋 Datos del pedido:', order);
              setSelectedOrder(order);
              setShowOrderDetail(true);
              console.log('✅ Modal de detalle activado');
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

  // Log del estado del modal
  console.log('🔍 Estado del modal de detalle:', showOrderDetail);
  console.log('📋 Pedido seleccionado:', selectedOrder?.id);

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
                {filteredOrders.filter(o => o.estado === 'pendiente').length}
              </RNText>
              <RNText style={styles.statLabel}>Pendientes</RNText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <RNText style={styles.statNumber}>
                {filteredOrders.filter(o => o.estado === 'confirmado').length}
              </RNText>
              <RNText style={styles.statLabel}>Confirmados</RNText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <RNText style={styles.statNumber}>
                {filteredOrders.filter(o => o.estado === 'completado').length}
              </RNText>
              <RNText style={styles.statLabel}>Completados</RNText>
            </View>
          </View>

          {/* Panel de filtros mejorado */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity 
              style={styles.filtersToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <View style={styles.filtersHeader}>
                <FilterIcon style={styles.filterIcon} fill={colors.white} />
                <RNText style={styles.filtersTitle}>
                  Filtros {filteredOrders.length !== orders.length && `(${filteredOrders.length}/${orders.length})`}
                </RNText>
                {showFilters ? 
                  <ChevronUpIcon style={styles.chevronIcon} fill={colors.white} /> :
                  <ChevronDownIcon style={styles.chevronIcon} fill={colors.white} />
                }
              </View>
            </TouchableOpacity>

            {showFilters && (
              <View style={styles.filtersPanel}>
                {/* Filtros por fecha */}
                <View style={styles.filterSection}>
                  <RNText style={styles.filterSectionTitle}>📅 Por fecha</RNText>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.filtersContent}
                  >
                    {DATE_FILTERS.map((filter) => {
                      const IconComponent = getDateFilterIcon(filter.key);
                      return (
                        <TouchableOpacity
                          key={filter.key}
                          style={[
                            styles.filterButton,
                            selectedDateFilter === filter.key && styles.filterButtonActive
                          ]}
                          onPress={() => setSelectedDateFilter(filter.key)}
                        >
                          <IconComponent style={styles.filterButtonIcon} fill={selectedDateFilter === filter.key ? colors.primary : colors.white} />
                          <RNText style={[
                            styles.filterButtonText,
                            selectedDateFilter === filter.key && styles.filterButtonTextActive
                          ]}>
                            {filter.label}
                          </RNText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Filtros por estado */}
                <View style={styles.filterSection}>
                  <RNText style={styles.filterSectionTitle}>🏷️ Por estado</RNText>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.filtersContent}
                  >
                    {STATUS_FILTERS.map((filter) => (
                      <TouchableOpacity
                        key={filter.key}
                        style={[
                          styles.statusFilterButton,
                          { borderColor: filter.color },
                          selectedStatusFilter === filter.key && { backgroundColor: filter.color }
                        ]}
                        onPress={() => setSelectedStatusFilter(filter.key)}
                      >
                        <View style={[styles.statusIndicator, { backgroundColor: filter.color }]} />
                        <RNText style={[
                          styles.statusFilterText,
                          selectedStatusFilter === filter.key && styles.statusFilterTextActive
                        ]}>
                          {filter.label}
                        </RNText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Botón limpiar filtros */}
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <RNText style={styles.clearFiltersText}>🗑️ Limpiar filtros</RNText>
                </TouchableOpacity>
              </View>
            )}
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
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageIcon style={styles.emptyIcon} fill={colors.lightGray} />
            </View>
            <RNText style={styles.emptyTitle}>
              {selectedDateFilter === 'todos' ? 'No hay pedidos pendientes' : 'No hay pedidos en este período'}
            </RNText>
            <RNText style={styles.emptySubtitle}>
              {selectedDateFilter === 'todos' 
                ? 'Los pedidos que reciban tus clientes aparecerán aquí'
                : 'Intenta cambiar el filtro de fecha para ver más pedidos'
              }
            </RNText>
            <View style={styles.emptyDecoration} />
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {filteredOrders.map(renderOrder)}
          </View>
        )}
      </ScrollView>

      {/* Modal de detalle del pedido */}
      <Modal
        visible={showOrderDetail}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => {
          console.log('🔄 Modal cerrado por backdrop');
          setShowOrderDetail(false);
        }}
      >
        <Card disabled style={styles.modalCard}>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <RNText style={styles.modalTitle}>📋 Detalle del Pedido</RNText>
                <View style={styles.modalDivider} />
              </View>
              
              {selectedOrder ? (
                <>
                  {console.log('📋 Renderizando detalle del pedido:', selectedOrder.id)}
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


                </>
              ) : (
                <View style={styles.orderDetailSection}>
                  <RNText style={styles.orderDetailLabel}>⚠️ Error:</RNText>
                  <RNText style={styles.orderDetailValue}>
                    No se pudo cargar la información del pedido
                  </RNText>
                </View>
              )}
            </View>
          </ScrollView>
          
          <Button
            style={styles.modalCloseButton}
            onPress={() => {
              console.log('🔄 Modal cerrado por botón');
              setShowOrderDetail(false);
            }}
          >
            Cerrar
          </Button>
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

      {/* Modal de Éxito */}
      <Modal
        visible={showSuccessModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowSuccessModal(false)}
      >
        <Card disabled style={styles.successModalCard}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalIconContainer}>
              <View style={styles.successModalIconBackground}>
                <ModalCheckIcon style={styles.successModalIcon} fill={colors.white} />
              </View>
            </View>
            <RNText style={styles.successModalTitle}>¡{modalTitle}!</RNText>
            <RNText style={styles.successModalMessage}>{modalMessage}</RNText>
            <View style={styles.successModalDecoration} />
            <Button
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <RNText style={styles.successModalButtonText}>Entendido</RNText>
            </Button>
          </View>
        </Card>
      </Modal>

      {/* Modal de Error */}
      <Modal
        visible={showErrorModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowErrorModal(false)}
      >
        <Card disabled style={styles.modalCard}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <ModalAlertIcon style={styles.modalIcon} fill={colors.danger} />
            </View>
            <RNText style={styles.modalTitle}>{modalTitle}</RNText>
            <RNText style={styles.modalMessage}>{modalMessage}</RNText>
            <Button
              style={[styles.modalButton, styles.errorButton]}
              onPress={() => setShowErrorModal(false)}
            >
              Entendido
            </Button>
          </View>
        </Card>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
     header: {
     position: 'relative',
     paddingTop: isSmallScreen ? 8 : 10,
     paddingBottom: isSmallScreen ? 20 : 24,
     overflow: 'hidden',
     backgroundColor: colors.primary,
     marginBottom: isSmallScreen ? -8 : -12,
   },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
     headerContent: {
     paddingHorizontal: isSmallScreen ? 16 : 20,
     paddingTop: isSmallScreen ? 3 : 5,
     paddingBottom: isSmallScreen ? 8 : 12,
     alignItems: 'center',
     zIndex: 1,
   },
     headerTitle: {
     fontSize: isSmallScreen ? 16 : 18,
     fontWeight: '800',
     color: colors.white,
     marginBottom: 2,
     textAlign: 'center',
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
     headerSubtitle: {
     fontSize: isSmallScreen ? 10 : 11,
     color: colors.white,
     opacity: 0.9,
     marginBottom: isSmallScreen ? 6 : 8,
     textAlign: 'center',
     fontWeight: '500',
   },
     headerStats: {
     flexDirection: 'row',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: isSmallScreen ? 8 : 10,
     padding: isSmallScreen ? 4 : 6,
     width: '100%',
     justifyContent: 'space-around',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 2,
   },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
     statNumber: {
     fontSize: isSmallScreen ? 12 : 14,
     fontWeight: '800',
     color: colors.white,
     marginBottom: 1,
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 1,
   },
     statLabel: {
     fontSize: isSmallScreen ? 7 : 8,
     color: colors.white,
     opacity: 0.9,
     textTransform: 'uppercase',
     letterSpacing: 0.2,
     fontWeight: '600',
   },
     statDivider: {
     width: 1,
     backgroundColor: 'rgba(255, 255, 255, 0.4)',
     height: 20,
     alignSelf: 'center',
   },
     filtersContainer: {
     marginTop: isSmallScreen ? 6 : 8,
     marginBottom: isSmallScreen ? 8 : 12,
     width: '100%',
   },
     filtersToggle: {
     backgroundColor: 'rgba(255, 255, 255, 0.15)',
     borderRadius: isSmallScreen ? 6 : 8,
     padding: isSmallScreen ? 4 : 6,
   },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
     filterIcon: {
     width: 14,
     height: 14,
     marginRight: 4,
   },
     filtersTitle: {
     fontSize: isSmallScreen ? 10 : 11,
     color: colors.white,
     fontWeight: '600',
     flex: 1,
     textAlign: 'center',
   },
     chevronIcon: {
     width: 12,
     height: 12,
   },
     filtersPanel: {
     marginTop: 6,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 10,
     padding: 10,
   },
     filterSection: {
     marginBottom: 10,
   },
     filterSectionTitle: {
     fontSize: 12,
     color: colors.white,
     fontWeight: '700',
     marginBottom: 6,
     textAlign: 'center',
   },
     filtersScroll: {
     maxHeight: 40,
   },
  filtersContent: {
    paddingHorizontal: 4,
  },
     filterButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 10,
     paddingVertical: 6,
     borderRadius: 16,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     marginHorizontal: 3,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
  filterButtonActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
     filterButtonIcon: {
     width: 12,
     height: 12,
     marginRight: 4,
   },
     filterButtonText: {
     fontSize: 10,
     color: colors.white,
     fontWeight: '600',
   },
  filterButtonTextActive: {
    color: colors.primary,
  },
     statusFilterButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 10,
     paddingVertical: 6,
     borderRadius: 16,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     marginHorizontal: 3,
     borderWidth: 2,
   },
     statusIndicator: {
     width: 6,
     height: 6,
     borderRadius: 3,
     marginRight: 4,
   },
     statusFilterText: {
     fontSize: 10,
     color: colors.white,
     fontWeight: '600',
   },
  statusFilterTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
     clearFiltersButton: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 10,
     paddingVertical: 8,
     paddingHorizontal: 12,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
     clearFiltersText: {
     fontSize: 11,
     color: colors.white,
     fontWeight: '600',
   },
  content: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? 12 : 20,
    paddingTop: isSmallScreen ? 12 : 16,
    backgroundColor: '#F5F6FA',
  },
  ordersContainer: {
    paddingBottom: isSmallScreen ? 80 : 100,
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
    marginBottom: isSmallScreen ? 12 : 16,
    marginHorizontal: isSmallScreen ? 4 : 0,
    borderRadius: isSmallScreen ? 16 : 20,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isSmallScreen ? 2 : 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: isSmallScreen ? 8 : 16,
    elevation: isSmallScreen ? 4 : 8,
    borderWidth: 0,
    overflow: 'hidden',
    minHeight: isSmallScreen ? 200 : 220,
  },
  orderHeader: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'stretch' : 'flex-start',
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: isSmallScreen ? 12 : 16,
    backgroundColor: '#FAFBFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F2',
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: isSmallScreen ? 0 : 20,
    marginBottom: isSmallScreen ? 12 : 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 10 : 14,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: isSmallScreen ? 20 : 25,
    alignSelf: 'flex-start',
    marginBottom: isSmallScreen ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    width: isSmallScreen ? 16 : 20,
    height: isSmallScreen ? 16 : 20,
    marginRight: isSmallScreen ? 6 : 10,
  },
  statusText: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: isSmallScreen ? 0.5 : 0.8,
  },
  orderInfo: {
    marginTop: 6,
  },
  orderId: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  orderTotalContainer: {
    alignItems: isSmallScreen ? 'center' : 'flex-end',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderRadius: isSmallScreen ? 12 : 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignSelf: isSmallScreen ? 'stretch' : 'auto',
  },
  orderTotalLabel: {
    fontSize: isSmallScreen ? 10 : 11,
    color: '#6C757D',
    marginBottom: isSmallScreen ? 4 : 6,
    textTransform: 'uppercase',
    letterSpacing: isSmallScreen ? 0.5 : 0.8,
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '900',
    color: colors.secondary,
  },
  orderItems: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
    paddingBottom: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F2',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderItemImagePlaceholder: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: isSmallScreen ? 20 : 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isSmallScreen ? 12 : 16,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  orderItemImageText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '900',
    color: colors.primary,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: isSmallScreen ? 15 : 17,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: isSmallScreen ? 4 : 6,
    lineHeight: isSmallScreen ? 20 : 22,
  },
  orderItemDetails: {
    fontSize: isSmallScreen ? 13 : 15,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  orderItemRight: {
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: isSmallScreen ? 10 : 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  orderItemSubtotal: {
    fontSize: isSmallScreen ? 15 : 17,
    fontWeight: '800',
    color: colors.secondary,
  },
  orderFooter: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F2',
    backgroundColor: '#FAFBFC',
  },
  orderCustomer: {
    fontSize: isSmallScreen ? 13 : 15,
    color: '#2C3E50',
    fontWeight: '600',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  orderActions: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    gap: isSmallScreen ? 8 : 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: isSmallScreen ? 12 : 16,
    height: isSmallScreen ? 40 : 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButton: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    margin: isSmallScreen ? 12 : 20,
    borderRadius: isSmallScreen ? 20 : 24,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    maxHeight: '90%',
    minHeight: isSmallScreen ? 300 : 400,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalContent: {
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: isSmallScreen ? 20 : 30,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: isSmallScreen ? 12 : 16,
    textAlign: 'center',
  },
  modalDivider: {
    width: 60,
    height: 4,
    backgroundColor: colors.primary + '30',
    borderRadius: 2,
  },
  orderDetailSection: {
    marginBottom: isSmallScreen ? 16 : 20,
  },
  orderDetailLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '700',
    color: colors.gray,
    marginBottom: isSmallScreen ? 6 : 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderDetailValue: {
    fontSize: isSmallScreen ? 14 : 16,
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
    fontSize: isSmallScreen ? 18 : 20,
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
    margin: isSmallScreen ? 16 : 20,
    marginTop: 0,
    borderRadius: isSmallScreen ? 10 : 12,
    height: isSmallScreen ? 40 : 48,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    margin: isSmallScreen ? 12 : 20,
    borderRadius: isSmallScreen ? 16 : 20,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalContent: {
    padding: isSmallScreen ? 20 : 30,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: isSmallScreen ? 60 : 80,
    height: isSmallScreen ? 60 : 80,
    borderRadius: isSmallScreen ? 30 : 40,
    backgroundColor: colors.lightGray + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
  },
  modalIcon: {
    width: isSmallScreen ? 30 : 40,
    height: isSmallScreen ? 30 : 40,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 18 : 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: isSmallScreen ? 8 : 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: isSmallScreen ? 14 : 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
    marginBottom: isSmallScreen ? 20 : 24,
  },
  modalButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    borderRadius: isSmallScreen ? 10 : 12,
    height: isSmallScreen ? 40 : 48,
    minWidth: isSmallScreen ? 100 : 120,
  },
  errorButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  // Estilos específicos para el modal de éxito
  successModalCard: {
    margin: isSmallScreen ? 20 : 30,
    borderRadius: isSmallScreen ? 24 : 28,
    backgroundColor: colors.white,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 2,
    borderColor: colors.success + '20',
  },
  successModalContent: {
    padding: isSmallScreen ? 24 : 32,
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)',
  },
  successModalIconContainer: {
    marginBottom: isSmallScreen ? 20 : 24,
  },
  successModalIconBackground: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: isSmallScreen ? 40 : 50,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.white,
  },
  successModalIcon: {
    width: isSmallScreen ? 40 : 50,
    height: isSmallScreen ? 40 : 50,
  },
  successModalTitle: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '900',
    color: colors.success,
    marginBottom: isSmallScreen ? 12 : 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  successModalMessage: {
    fontSize: isSmallScreen ? 16 : 18,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : 26,
    marginBottom: isSmallScreen ? 20 : 24,
    fontWeight: '500',
  },
  successModalDecoration: {
    width: isSmallScreen ? 60 : 80,
    height: isSmallScreen ? 4 : 6,
    backgroundColor: colors.success + '30',
    borderRadius: isSmallScreen ? 2 : 3,
    marginBottom: isSmallScreen ? 20 : 24,
  },
  successModalButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    borderRadius: isSmallScreen ? 16 : 20,
    height: isSmallScreen ? 48 : 56,
    minWidth: isSmallScreen ? 140 : 160,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
  },
  successModalButtonText: {
    color: colors.white,
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
