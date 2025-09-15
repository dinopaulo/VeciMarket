import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { Input, Button, Select, SelectItem, Text, Layout, Icon, Modal, Card } from '@ui-kitten/components';
import { IndexPath } from '@ui-kitten/components/ui';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';

const ROLES = ['cliente', 'negocio', 'administrador'];

// Iconos para mostrar/ocultar contraseña
const EyeIcon = (props) => (
  <Icon {...props} name='eye' pack='eva'/>
);

const EyeOffIcon = (props) => (
  <Icon {...props} name='eye-off' pack='eva'/>
);

export default function AuthForm({ mode = 'login', onAuthSuccess }) {
  const isRegister = mode === 'register';

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(new IndexPath(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', type: '' });
  


  // Función para limpiar campos cuando cambie el modo
  const clearFormFields = useCallback(() => {
    console.log('🔄 AuthForm: Limpiando campos para modo:', mode);
    
    // Limpiar todos los campos
    setNombre('');
    setCorreo('');
    setPassword('');
    setTelefono('');
    setDireccion('');
    setSelectedIndex(new IndexPath(0));
    setError('');
    setPasswordVisible(false);
    
    console.log('✅ AuthForm: Campos limpiados para modo:', mode);
  }, [mode]);

  // Limpiar campos cuando cambie el modo usando useEffect más seguro
  useEffect(() => {
    // Solo limpiar si realmente cambió el modo y no estamos en medio de una operación
    if (!loading) {
      const timer = setTimeout(() => {
        clearFormFields();
      }, 100); // Pequeño delay para evitar conflictos
      
      return () => clearTimeout(timer);
    }
  }, [mode, clearFormFields, loading]);

  const displayValue = ROLES[selectedIndex.row];
  const rol = displayValue;

  // Validar que el rol sea válido y que selectedIndex sea correcto
  const isValidRol = rol && ROLES.includes(rol);
  const safeRol = isValidRol ? rol : 'cliente';
  
  // Asegurar que selectedIndex sea válido
  const safeSelectedIndex = selectedIndex && typeof selectedIndex.row === 'number' && 
    selectedIndex.row >= 0 && selectedIndex.row < ROLES.length ? 
    selectedIndex : new IndexPath(0);

  // Determinar si se ha seleccionado explícitamente un rol (no por defecto)
  const hasExplicitlySelectedRole = selectedIndex && selectedIndex.row >= 0 && selectedIndex.row < ROLES.length;

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const showModal = (title, message, type, result = null) => {
    setModalData({ title, message, type, result });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const handleModalAction = () => {
    hideModal();
    if (modalData.type === 'login_success') {
      onAuthSuccess(modalData.result);
    } else if (modalData.type === 'register_success') {
      // Limpiar formulario y cambiar a modo login
      setNombre('');
      setCorreo('');
      setPassword('');
      setTelefono('');
      setDireccion('');
      setSelectedIndex(new IndexPath(0));
      setError('');
      
      // Notificar al componente padre para cambiar a login
      if (onAuthSuccess) {
        onAuthSuccess({ type: 'register_success', user: modalData.result?.user });
      }
    }
  };

  const renderPasswordIcon = (props) => (
    <Button
      appearance='ghost'
      status='basic'
      size='small'
      onPress={togglePasswordVisibility}
      accessoryLeft={(iconProps) => passwordVisible ? <EyeOffIcon {...iconProps} /> : <EyeIcon {...iconProps} />}
      style={styles.passwordIcon}
    />
  );

  async function handleLogin() {
    setError('');
    // Cerrar el teclado inmediatamente
    Keyboard.dismiss();
    
    if (!correo || !password) {
      setError('Correo y contraseña son obligatorios.');
      return;
    }
    try {
      setLoading(true);
      
      console.log('Iniciando login con:', { correo, passwordLength: password.length });
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email: correo, 
        password: password 
      });
      
      console.log('Respuesta de login:', { data, signInError });
      
      if (signInError) {
        console.error('Error en login:', signInError);
        setError(signInError.message);
        return;
      }
      
      console.log('✅ LOGIN EXITOSO - Contraseña verificada correctamente');
      console.log('Usuario autenticado:', data.user.email);
      
      const userId = data?.user?.id;
      let profile = null;
      if (userId) {
        console.log('Obteniendo perfil del usuario:', userId);
        const { data: profileData, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error al obtener perfil:', profileError);
        } else {
          profile = profileData;
          console.log('Perfil obtenido:', profile);
        }
      }

      // Pasar directamente los datos sin mostrar modal
      onAuthSuccess({
        type: 'login_success',
        user: data.user,
        profile: profile
      });
    } catch (e) {
      console.error('Error en login:', e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError('');
    // Cerrar el teclado inmediatamente
    Keyboard.dismiss();
    
    if (!nombre || !correo || !password) {
      setError('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Iniciando registro con:', { correo, passwordLength: password.length });
      
      // 1. Registrar usuario en Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email: correo, 
        password: password 
      });
      
      console.log('Respuesta de Supabase Auth:', { signUpData, signUpError });
      
      if (signUpError) {
        console.error('Error en Supabase Auth:', signUpError);
        setError(signUpError.message);
        return;
      }
      
      const userId = signUpData?.user?.id;
      
      if (!userId) {
        console.log('No se obtuvo userId, posiblemente requiere confirmación de email');
        showModal(
          'Verifica tu correo',
          'Te enviamos un correo de confirmación. Después de confirmar, inicia sesión para completar tu registro.',
          'email_verification'
        );
        return;
      }
      
      console.log('Usuario creado con ID:', userId);
      
      // 2. Insertar datos del usuario en la tabla public.usuarios
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          id: userId,
          nombre: nombre,
          correo: correo,
          rol: safeRol,
          telefono: telefono || null,
          direccion: direccion || null,
          // NO incluir contraseña aquí - Supabase Auth la maneja internamente
        });

      if (insertError) {
        console.error('Error al insertar perfil:', insertError);
        setError('Error al crear perfil de usuario: ' + insertError.message);
        return;
      }
      
      console.log('Perfil de usuario creado exitosamente');
      
      // Si el rol es negocio, mostrar vista adicional
      if (safeRol === 'negocio') {
        console.log('Usuario es negocio, redirigiendo a vista de negocio');
        // En lugar de mostrar la vista aquí, notificar al componente padre
        // para que redirija a una nueva pantalla
        if (onAuthSuccess) {
          onAuthSuccess({
            type: 'business_registration_required',
            user: {
              id: userId,
              nombre: nombre,
              correo: correo,
              rol: safeRol,
              telefono: telefono || null,
              direccion: direccion || null
            }
          });
        }
        return;
      }
      
      // 3. Mostrar mensaje de éxito para clientes
      showModal(
        '¡Registro exitoso!',
        'Tu cuenta de cliente ha sido creada correctamente. Ahora puedes iniciar sesión.',
        'register_success',
        {
          user: signUpData?.user
        }
      );
      
    } catch (e) {
      console.error('Error en registro:', e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout style={[styles.container, { backgroundColor: colors.white }]}>
      {!!error && (
        <Text status="danger" category="s2" style={styles.errorText}>
          {error}
        </Text>
      )}
      
      {/* Mostrar indicador de progreso si es registro de negocio */}
      {isRegister && safeRol === 'negocio' && (
        <View style={styles.progressIndicator}>
          <Text category="c1" style={styles.progressText}>
            Paso 1 de 2
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>
      )}
      
      {isRegister && (
        <>
          <Select
            selectedIndex={safeSelectedIndex}
            onSelect={(index) => {
              try {
                // Validar que el índice sea válido antes de actualizar
                if (index && typeof index.row === 'number' && index.row >= 0 && index.row < ROLES.length) {
                  console.log('Seleccionando rol:', ROLES[index.row]);
                  setSelectedIndex(index);
                } else {
                  console.log('Índice inválido:', index);
                  // Resetear a un valor válido
                  setSelectedIndex(new IndexPath(0));
                }
              } catch (error) {
                console.error('Error al seleccionar rol:', error);
                // Resetear a un valor válido en caso de error
                setSelectedIndex(new IndexPath(0));
              }
            }}
            value={hasExplicitlySelectedRole ? `Rol: ${safeRol}` : 'Selecciona el tipo de cuenta'}
            style={styles.select}
            size="large"
          >
            {ROLES.map((r, index) => (
              <SelectItem key={r} title={r} />
            ))}
          </Select>
          
          <Input
            placeholder="Nombre"
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
            autoCapitalize="words"
            size="large"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </>
      )}
      <Input
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        size="large"
        returnKeyType="next"
        blurOnSubmit={false}
      />
      <Input
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!passwordVisible}
        style={styles.input}
        size="large"
        returnKeyType="done"
        blurOnSubmit={true}
        onSubmitEditing={() => Keyboard.dismiss()}
        accessoryRight={renderPasswordIcon}
      />
      {isRegister && (
        <>
          <Input
            placeholder="Teléfono (opcional)"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            style={styles.input}
            size="large"
            returnKeyType="next"
            blurOnSubmit={false}
          />
          <Input
            placeholder="Dirección (opcional)"
            value={direccion}
            onChangeText={setDireccion}
            style={styles.input}
            autoCapitalize="sentences"
            size="large"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </>
      )}
      <Button 
        onPress={isRegister ? handleRegister : handleLogin} 
        disabled={loading}
        style={styles.button}
        size="large"
      >
        {loading ? (isRegister ? 'Creando cuenta...' : 'Ingresando...') : isRegister ? 'Crear cuenta' : 'Ingresar'}
      </Button>
      
      {!isRegister && (
        <Text 
          category="s1" 
          style={styles.forgotPassword}
          onPress={() => {
            // TODO: Implementar recuperación de contraseña
            showModal('Recuperar contraseña', 'Función en desarrollo', 'forgot_password');
          }}
        >
          ¿Olvidaste tu contraseña?
        </Text>
      )}

      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={hideModal}
      >
        <Card disabled style={styles.modalCard}>
          <Text category="h6" style={styles.modalTitle}>
            {modalData.title}
          </Text>
          <Text category="s1" style={styles.modalMessage}>
            {modalData.message}
          </Text>
          <View style={styles.modalButtons}>
            <Button
              onPress={handleModalAction}
              style={styles.modalButton}
              size="medium"
            >
              {modalData.type === 'login_success' ? 'Continuar' : 'OK'}
            </Button>
          </View>
        </Card>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    borderRadius: 12,
  },
  select: {
    marginBottom: 16,
    borderRadius: 12,
  },
  button: {
    borderRadius: 12,
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  passwordIcon: {
    marginRight: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    borderRadius: 12,
  },
  progressIndicator: {
    alignSelf: 'center',
    marginBottom: 15,
    width: '100%',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 5,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});


