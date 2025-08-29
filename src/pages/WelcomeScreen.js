import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { Layout, Card, Text as UIText, Button, Spinner } from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

export default function WelcomeScreen({ userProfile, onLogout, onNavigateToBusiness }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil' o 'negocios'
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Cargar datos del negocio si el usuario es negocio
  useEffect(() => {
    if (userProfile?.rol === 'negocio') {
      loadBusinessData();
    }
  }, [userProfile]);

  const loadBusinessData = async () => {
    try {
      setLoadingBusiness(true);
      console.log('🔍 Cargando datos del negocio para usuario:', userProfile.id);
      
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('usuario_id', userProfile.id)
        .single();

      if (error) {
        console.error('❌ Error al cargar datos del negocio:', error);
        return;
      }

      if (data) {
        console.log('✅ Datos del negocio cargados:', data);
        setBusinessData(data);
      }
    } catch (error) {
      console.error('❌ Error en loadBusinessData:', error);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 WelcomeScreen: handleLogout iniciado');
      setIsLoggingOut(true);
      
      // Llamar directamente al callback del componente padre
      console.log('🔄 WelcomeScreen: Llamando onLogout() del componente padre');
      onLogout?.();
    } catch (error) {
      console.error('❌ WelcomeScreen: Error en handleLogout:', error);
      setIsLoggingOut(false);
    }
  };

  const handleNavigateToBusiness = () => {
    if (onNavigateToBusiness && businessData) {
      onNavigateToBusiness(businessData);
    }
  };

  const renderBusinessCard = () => {
    if (userProfile?.rol !== 'negocio') return null;

    return (
      <Card style={styles.businessCard}>
        <Text style={styles.cardTitle}>Datos del Negocio</Text>
        
        {loadingBusiness ? (
          <View style={styles.loadingContainer}>
            <Spinner size="small" />
            <Text style={styles.loadingText}>Cargando datos del negocio...</Text>
          </View>
        ) : businessData ? (
          <View style={styles.businessInfo}>
            {/* Logo del negocio */}
            {businessData.logo_url && (
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: businessData.logo_url }} 
                  style={styles.businessLogo}
                  resizeMode="cover"
                />
                <Text style={styles.logoLabel}>Logo del Negocio</Text>
              </View>
            )}
            
            {/* Información del negocio */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre del Negocio:</Text>
              <Text style={styles.value}>{businessData.nombre || 'No disponible'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Categoría:</Text>
              <Text style={[styles.value, styles.categoryText]}>
                {businessData.categoria || 'No disponible'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Descripción:</Text>
              <Text style={styles.value}>{businessData.descripcion || 'No disponible'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>WhatsApp:</Text>
              <Text style={[styles.value, styles.whatsappText]}>
                {businessData.whatsapp ? businessData.whatsapp.replace('https://wa.me/', '') : 'No disponible'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dirección del Negocio:</Text>
              <Text style={styles.value}>{businessData.direccion || 'No disponible'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Destacado:</Text>
              <Text style={[styles.value, businessData.destacado ? styles.highlightedText : styles.normalText]}>
                {businessData.destacado ? 'Sí' : 'No'}
              </Text>
            </View>
            
            {/* Botón para recargar datos */}
            <View style={styles.reloadButtonContainer}>
              <Button
                size="small"
                appearance="outline"
                status="info"
                onPress={loadBusinessData}
                style={styles.reloadButton}
              >
                🔄 Actualizar Datos
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.noBusinessData}>
            <Text style={styles.noBusinessText}>
              No se encontraron datos del negocio
            </Text>
            <Button
              size="small"
              appearance="outline"
              status="warning"
              onPress={loadBusinessData}
              style={styles.reloadButton}
            >
              🔍 Buscar Datos
            </Button>
          </View>
        )}
      </Card>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Layout style={styles.layout}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.welcomeTitle}>Bienvenido a VeciMarket</Text>
            <Text style={styles.subtitle}>Tu directorio comunitario</Text>
            
            {/* Indicador de carga para negocios */}
            {userProfile?.rol === 'negocio' && loadingBusiness && (
              <View style={styles.headerLoadingContainer}>
                <Spinner size="small" />
                <Text style={styles.headerLoadingText}>Cargando datos del negocio...</Text>
              </View>
            )}
          </View>

          {/* Botones de Navegación */}
          <View style={styles.navigationTabs}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'perfil' && styles.activeTabButton]}
              onPress={() => setActiveTab('perfil')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'perfil' && styles.activeTabButtonText]}>
                👤 Perfil
              </Text>
            </TouchableOpacity>
            
            {userProfile?.rol === 'negocio' && (
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'negocios' && styles.activeTabButton]}
                onPress={() => setActiveTab('negocios')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'negocios' && styles.activeTabButtonText]}>
                  🏪 Negocios
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contenido de Perfil */}
          {activeTab === 'perfil' && (
            <>
              <Card style={styles.profileCard}>
                <Text style={styles.cardTitle}>Tu Perfil</Text>
                
                <View style={styles.profileInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Nombre:</Text>
                    <Text style={styles.value}>{userProfile?.nombre || 'No disponible'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Correo:</Text>
                    <Text style={styles.value}>{userProfile?.correo || 'No disponible'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Rol:</Text>
                    <View style={styles.roleContainer}>
                      <Text style={[styles.value, styles.roleText]}>
                        {userProfile?.rol ? userProfile.rol.charAt(0).toUpperCase() + userProfile.rol.slice(1) : 'No disponible'}
                      </Text>
                      {userProfile?.rol === 'negocio' && (
                        <View style={styles.businessBadge}>
                          <Text style={styles.businessBadgeText}>🏪</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Teléfono:</Text>
                    <Text style={styles.value}>{userProfile?.telefono || 'No disponible'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Dirección:</Text>
                    <Text style={styles.value}>{userProfile?.direccion || 'No disponible'}</Text>
                  </View>
                </View>
              </Card>

              {renderBusinessCard()}
            </>
          )}

          {/* Contenido de Negocios */}
          {activeTab === 'negocios' && userProfile?.rol === 'negocio' && (
            <Card style={styles.businessManagementCard}>
              <Text style={styles.cardTitle}>Gestión del Negocio</Text>
              
              {businessData ? (
                <View style={styles.businessManagementInfo}>
                  <View style={styles.businessSummary}>
                    <Text style={styles.businessSummaryTitle}>
                      {businessData.nombre}
                    </Text>
                    <Text style={styles.businessSummaryCategory}>
                      {businessData.categoria}
                    </Text>
                  </View>
                  
                  <View style={styles.managementActions}>
                    <Button
                      size="large"
                      appearance="filled"
                      status="primary"
                      onPress={handleNavigateToBusiness}
                      style={styles.manageCatalogButton}
                    >
                      📦 Gestionar Catálogo
                    </Button>
                    
                    <Text style={styles.managementDescription}>
                      Administra tus productos, precios y stock desde aquí
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noBusinessData}>
                  <Text style={styles.noBusinessText}>
                    No se encontraron datos del negocio
                  </Text>
                  <Button
                    size="small"
                    appearance="outline"
                    status="warning"
                    onPress={loadBusinessData}
                    style={styles.reloadButton}
                  >
                    🔍 Buscar Datos
                  </Button>
                </View>
              )}
            </Card>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Gracias por unirte a nuestra comunidad
            </Text>
            
            <Button
              onPress={handleLogout}
              style={styles.logoutButton}
              status="danger"
              size="medium"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </Button>
          </View>
        </ScrollView>
      </Layout>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tertiary,
  },
  layout: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  navigationTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: colors.secondary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  activeTabButtonText: {
    color: colors.white,
  },
  profileCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  profileInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: colors.primary,
    flex: 2,
    textAlign: 'right',
  },
  roleText: {
    color: colors.secondary,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 20,
  },
  businessCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessManagementCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessManagementInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  businessSummary: {
    alignItems: 'center',
    marginBottom: 24,
  },
  businessSummaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  businessSummaryCategory: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  managementActions: {
    alignItems: 'center',
    width: '100%',
  },
  manageCatalogButton: {
    marginBottom: 16,
    width: '100%',
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  managementDescription: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.secondary,
  },
  businessInfo: {
    gap: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  businessLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  logoLabel: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  categoryText: {
    color: colors.secondary,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  whatsappText: {
    color: colors.success,
    fontWeight: 'bold',
  },
  highlightedText: {
    color: colors.success,
    fontWeight: 'bold',
  },
  normalText: {
    color: colors.primary,
    fontWeight: 'normal',
  },
  noBusinessData: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noBusinessText: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessBadge: {
    marginLeft: 8,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  businessBadgeText: {
    fontSize: 14,
    color: colors.white,
  },
  reloadButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  reloadButton: {
    width: '100%',
  },
  headerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLoadingText: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.secondary,
  },
});
