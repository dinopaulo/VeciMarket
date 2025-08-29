import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Animated } from 'react-native';
import { Layout, Toggle } from '@ui-kitten/components';
import AuthForm from '../components/AuthForm';
import MainFeedView from '../components/MainFeedView';
import SplashScreen from '../components/SplashScreen';
import LogoutSplashScreen from '../components/LogoutSplashScreen';
import BusinessRegistrationView from '../components/BusinessRegistrationView';
import BusinessCatalogView from '../components/BusinessCatalogView';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showLogoutSplash, setShowLogoutSplash] = useState(false);
  const [splashMessage, setSplashMessage] = useState('');
  const [showBusinessRegistration, setShowBusinessRegistration] = useState(false);
  const [showBusinessCatalog, setShowBusinessCatalog] = useState(false);
  const [businessUserData, setBusinessUserData] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Debug: Log del estado de showLogoutSplash
  useEffect(() => {
    console.log('📊 AuthScreen: showLogoutSplash cambió a:', showLogoutSplash);
  }, [showLogoutSplash]);

  // Debug: Log del estado de showSplash
  useEffect(() => {
    console.log('📊 AuthScreen: showSplash cambió a:', showSplash);
  }, [showSplash]);

  // Debug: Log del estado inicial
  useEffect(() => {
    console.log('🚀 AuthScreen: Estado inicial - showLogoutSplash:', showLogoutSplash, 'showSplash:', showSplash, 'isAuthenticated:', isAuthenticated);
  }, []);

  const handleAuthSuccess = (result) => {
    console.log('🔄 AuthScreen: handleAuthSuccess llamado con:', result);
    
    if (result?.type === 'register_success') {
      // Cambiar automáticamente al formulario de login después del registro exitoso
      setIsRegister(false);
    } else if (result?.type === 'business_registration_required') {
      // Mostrar la vista de registro de negocio
      setBusinessUserData(result.user);
      setShowBusinessRegistration(true);
    } else if (result?.type === 'login_success') {
      // Mostrar splash screen antes de navegar
      setSplashMessage('Iniciando sesión...');
      setShowSplash(true);
      // Guardar los datos del perfil para usar después del splash
      setUserProfile(result.profile);
    }
  };

  const handleSplashComplete = () => {
    console.log('🔄 AuthScreen: handleSplashComplete llamado');
    // Navegar inmediatamente a la vista principal del feed
    setIsAuthenticated(true);
    setShowSplash(false);
    console.log('✅ AuthScreen: Usuario autenticado, mostrando MainFeedView');
  };

  const handleLogout = () => {
    console.log('🔄 AuthScreen: handleLogout llamado');
    
    // Mostrar splash screen de logout
    setShowLogoutSplash(true);
    console.log('✅ AuthScreen: showLogoutSplash establecido en true');
  };

  const handleLogoutComplete = async () => {
    console.log('🔄 AuthScreen: handleLogoutComplete llamado');
    
    try {
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ AuthScreen: Error al cerrar sesión en Supabase:', error);
      } else {
        console.log('✅ AuthScreen: Sesión cerrada exitosamente en Supabase');
      }
    } catch (error) {
      console.error('❌ AuthScreen: Error general al cerrar sesión:', error);
    }
    
    console.log('📊 AuthScreen: Ocultando splash screen y reseteando estados');
    
    // Resetear TODOS los estados relacionados con splash screens
    setShowLogoutSplash(false);
    setShowSplash(false);
    setSplashMessage('');
    
    // Resetear estados de autenticación
    setIsAuthenticated(false);
    setUserProfile(null);
    
    // Resetear estados de negocio
    setShowBusinessRegistration(false);
    setShowBusinessCatalog(false);
    setBusinessUserData(null);
    setBusinessData(null);
    
    console.log('✅ AuthScreen: Estados reseteados - showLogoutSplash: false, showSplash: false, isAuthenticated: false');
    console.log('✅ AuthScreen: Volviendo al AuthForm');
  };

  const handleBusinessRegistrationComplete = () => {
    // Ocultar la vista de negocio y volver al formulario de login
    setShowBusinessRegistration(false);
    setBusinessUserData(null);
    setIsRegister(false);
  };

  const handleNavigateToBusiness = (business) => {
    console.log('🔄 AuthScreen: Navegando al catálogo del negocio:', business);
    setBusinessData(business);
    setShowBusinessCatalog(true);
  };

  const handleBackFromBusiness = () => {
    console.log('🔄 AuthScreen: Volviendo desde el catálogo del negocio');
    setShowBusinessCatalog(false);
    setBusinessData(null);
  };

  // Renderizar la vista apropiada basada en el estado
  const renderCurrentView = () => {
    // Si se debe mostrar el catálogo del negocio
    if (showBusinessCatalog && businessData) {
      return (
        <BusinessCatalogView 
          businessData={businessData} 
          onBack={handleBackFromBusiness} 
          userProfile={userProfile}
        />
      );
    }

    // Si se debe mostrar el registro de negocio
    if (showBusinessRegistration && businessUserData) {
      return (
        <BusinessRegistrationView 
          userData={businessUserData} 
          onComplete={handleBusinessRegistrationComplete} 
          onBack={() => setShowBusinessRegistration(false)} 
        />
      );
    }

    // Si se debe mostrar el splash screen
    if (showSplash) {
      return (
        <SplashScreen 
          message={splashMessage} 
          onComplete={handleSplashComplete} 
        />
      );
    }

    // Si el usuario está autenticado, mostrar la vista principal del feed
    if (isAuthenticated && userProfile) {
      return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {showLogoutSplash && (
            <LogoutSplashScreen
              onComplete={handleLogoutComplete}
              userName={userProfile?.nombre || 'Usuario'}
            />
          )}
          <MainFeedView 
            userProfile={userProfile} 
            onLogout={handleLogout}
            onNavigateToBusiness={handleNavigateToBusiness}
          />
        </Animated.View>
      );
    }

    // Por defecto, mostrar el formulario de autenticación
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Layout style={styles.container}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/iconn.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <AuthForm 
                mode={isRegister ? 'register' : 'login'} 
                onAuthSuccess={handleAuthSuccess} 
              />

              <View style={styles.toggleContainer}>
                <View style={styles.toggleWrapper}>
                  <Text style={[styles.toggleLabel, !isRegister && styles.toggleLabelActive]}>
                    Ingreso
                  </Text>
                  <Toggle
                    checked={isRegister}
                    onChange={setIsRegister}
                    style={styles.customToggle}
                    status="primary"
                  />
                  <Text style={[styles.toggleLabel, isRegister && styles.toggleLabelActive]}>
                    Registro
                  </Text>
                </View>
              </View>
            </Layout>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  };

  return renderCurrentView();
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  toggleContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toggleLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  customToggle: {
    marginHorizontal: 10,
  },
});


