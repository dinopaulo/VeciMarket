import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, Dimensions, TouchableOpacity, Image, Alert } from 'react-native';
import { Input, Button, Select, SelectItem, Text, Layout, Icon, Card, Toggle } from '@ui-kitten/components';
import { IndexPath } from '@ui-kitten/components/ui';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import * as ImagePicker from 'expo-image-picker';

export default function BusinessRegistrationView({ userData, onComplete, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  const [businessData, setBusinessData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    whatsapp: '',
    direccion: '',
    logoUrl: ''
  });
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(new IndexPath(0));
  const [logoImage, setLogoImage] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const { width: screenWidth, height: screenHeight } = dimensions;
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
  const isLargeScreen = screenHeight >= 800;
  const isLandscape = screenWidth > screenHeight;

  const CATEGORIAS = [
    'Restaurante', 'Tienda', 'Servicios', 'Salud', 'Educación', 
    'Transporte', 'Entretenimiento', 'Tecnología', 'Otros'
  ];

  // Verificar acceso al bucket al montar el componente
  useEffect(() => {
    checkBucketAccess();
  }, []);

  // Iconos para la navegación
  const ArrowRightIcon = (props) => (
    <Icon {...props} name='arrow-forward'/>
  );

  const ArrowLeftIcon = (props) => (
    <Icon {...props} name='arrow-back'/>
  );

  const CheckIcon = (props) => (
    <Icon {...props} name='checkmark'/>
  );

  const STEPS = [
    {
      id: 0,
      title: 'Información Básica',
      subtitle: 'Datos principales del negocio',
      icon: '🏢',
      fields: ['nombre', 'descripcion']
    },
    {
      id: 1,
      title: 'Categoría',
      subtitle: '¿Qué tipo de negocio tienes?',
      icon: '🏷️',
      fields: ['categoria']
    },
    {
      id: 2,
      title: 'Contacto',
      subtitle: 'Información de contacto',
      icon: '📱',
      fields: ['whatsapp']
    },
    {
      id: 3,
      title: 'Ubicación y Logo',
      subtitle: '¿Dónde se encuentra tu negocio?',
      icon: '📍',
      fields: ['direccion']
    }
  ];

  const handleInputChange = (field, value) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepValid = () => {
    const requiredFields = {
      0: ['nombre'],
      1: ['categoria'],
      2: ['whatsapp'],
      3: ['direccion']
    };

    const fields = requiredFields[currentStep] || [];
    return fields.every(field => {
      if (field === 'whatsapp') {
        return businessData.whatsapp && businessData.whatsapp.length === 9;
      }
      return businessData[field] && businessData[field].trim() !== '';
    });
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1 && isStepValid()) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleComplete = async () => {
    if (!isStepValid()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Usar la URL del logo que ya se subió automáticamente
      let logoUrl = businessData.logoUrl || '';
      
      // Si no hay URL pero hay imagen, intentar subirla ahora
      if (!logoUrl && logoImage) {
        console.log('🔄 No hay URL del logo, intentando subir ahora...');
        const uploadedUrl = await uploadLogoToStorage(logoImage);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
          setBusinessData(prev => ({
            ...prev,
            logoUrl: uploadedUrl
          }));
        }
      }

      // Construir la URL completa de WhatsApp si se proporcionó un número
      const whatsappUrl = businessData.whatsapp ? `https://wa.me/593${businessData.whatsapp}` : '';

      console.log('Creando negocio con datos:', {
        usuario_id: userData.id,
        nombre: businessData.nombre,
        categoria: businessData.categoria,
        whatsapp: whatsappUrl,
        direccion: businessData.direccion,
        logo_url: logoUrl
      });

      const { data, error } = await supabase
        .from('negocios')
        .insert([
          {
            usuario_id: userData.id,
            nombre: businessData.nombre,
            descripcion: businessData.descripcion,
            categoria: businessData.categoria,
            whatsapp: whatsappUrl,
            direccion: businessData.direccion,
            logo_url: logoUrl,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error al insertar negocio:', error);
        setError('Error al crear perfil del negocio: ' + error.message);
        return;
      }

      console.log('Negocio creado exitosamente');
      onComplete();
    } catch (error) {
      console.error('Error general:', error);
      setError('Error inesperado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar acceso al bucket
  const checkBucketAccess = async () => {
    try {
      console.log('🔍 Verificando acceso al bucket "Logo Negocios"...');
      
      const { data, error } = await supabase.storage
        .from('Logo Negocios')
        .list('', { limit: 1 });
      
      if (error) {
        console.error('❌ Error al acceder al bucket:', error);
        Alert.alert(
          'Error de Acceso',
          'No se puede acceder al bucket de logos. Verifica las políticas de acceso.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      console.log('✅ Acceso al bucket confirmado');
      return true;
    } catch (error) {
      console.error('❌ Error al verificar bucket:', error);
      return false;
    }
  };

  // Función para seleccionar imagen del logo
  const pickLogoImage = async () => {
    try {
      console.log('📱 INICIO: Seleccionando imagen...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📱 Resultado de ImagePicker:', result);
      console.log('📱 Canceled:', result.canceled);
      console.log('📱 Assets:', result.assets);

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('✅ Imagen seleccionada:', selectedImage);
        
        // Actualizar estado para la UI
        setLogoImage(selectedImage);
        setLogoPreview(selectedImage.uri);
        
        console.log('🔄 Iniciando subida automática...');
        // Pasar la imagen directamente, no depender del estado
        const logoUrl = await uploadLogoToStorage(selectedImage);
        
        if (logoUrl) {
          console.log('🎉 Logo subido exitosamente:', logoUrl);
          setBusinessData(prev => ({
            ...prev,
            logoUrl: logoUrl
          }));
        } else {
          console.log('❌ No se pudo subir el logo');
        }
      } else {
        console.log('❌ No se seleccionó imagen o se canceló');
      }
    } catch (error) {
      console.error('❌ ERROR en pickLogoImage:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para subir imagen a Supabase Storage
  const uploadLogoToStorage = async (imageData, retryCount = 0) => {
    if (!imageData) {
      console.log('❌ No hay imagen para subir');
      return null;
    }

    try {
      setUploadingLogo(true);
      console.log('🔄 INICIO: Subida de logo como archivo binario');
      console.log('📱 Imagen a subir:', imageData);
      console.log('📱 URI:', imageData.uri);
      
      // 1. Crear nombre del archivo
      const fileExt = imageData.uri.split('.').pop();
      const fileName = `${userData.id}_${Date.now()}.${fileExt}`;
      console.log('📁 Nombre del archivo:', fileName);
      
      // 2. Leer la imagen como array buffer
      console.log('🔄 Paso 1: Leyendo imagen como array buffer...');
      const response = await fetch(imageData.uri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('✅ Array buffer creado, tamaño:', arrayBuffer.byteLength, 'bytes');
      console.log('📏 Tamaño del archivo original:', imageData.fileSize, 'bytes');
      console.log('📊 Ratio de integridad:', (arrayBuffer.byteLength / imageData.fileSize).toFixed(2));
      
      // 3. Subir a Supabase
      console.log('🚀 Paso 2: Subiendo archivo binario a Supabase Storage...');
      console.log('🪣 Bucket: Logo Negocios');
      console.log('📁 Archivo:', fileName);
      
      const { data, error } = await supabase.storage
        .from('Logo Negocios')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) {
        console.error('❌ ERROR en Supabase Storage:', error);
        throw error;
      }

      console.log('✅ Imagen subida exitosamente a Supabase');
      console.log('📊 Data de respuesta:', data);
      
      // 4. Obtener URL pública
      console.log('🔗 Paso 3: Obteniendo URL pública...');
      const { data: { publicUrl } } = supabase.storage
        .from('Logo Negocios')
        .getPublicUrl(fileName);

      console.log('🌐 URL pública obtenida:', publicUrl);
      console.log('✅ SUBIDA COMPLETADA EXITOSAMENTE');
      
      return publicUrl;
      
    } catch (error) {
      console.error('❌ ERROR GENERAL en uploadLogoToStorage:');
      console.error('❌ Tipo de error:', typeof error);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Stack:', error.stack);
      
      if (error.message.includes('Network request failed') && retryCount < 2) {
        console.log('🌐 Error de red detectado');
        console.log(`🔄 Reintentando (${retryCount + 1}/3)...`);
        setUploadingLogo(false);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return uploadLogoToStorage(imageData, retryCount + 1);
      }
      
      return null;
    } finally {
      setUploadingLogo(false);
      console.log('🏁 FIN: Función uploadLogoToStorage terminada');
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 0: // Información Básica
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del Negocio *</Text>
              <Input
                placeholder="Ej: Mi Restaurante"
                value={businessData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                style={styles.modernInput}
                size="large"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <Input
                placeholder="Describe tu negocio..."
                value={businessData.descripcion}
                onChangeText={(value) => handleInputChange('descripcion', value)}
                style={styles.modernInput}
                size="large"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCapitalize="sentences"
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>
          </Card>
        );
        
      case 1: // Categoría
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Selecciona la Categoría *</Text>
              <Select
                selectedIndex={selectedCategoryIndex}
                onSelect={(index) => {
                  if (index && index.row >= 0 && index.row < CATEGORIAS.length) {
                    setSelectedCategoryIndex(index);
                    handleInputChange('categoria', CATEGORIAS[index.row]);
                  }
                }}
                value={businessData.categoria || 'Selecciona una categoría'}
                style={styles.modernSelect}
                size="large"
                placeholder="Selecciona una categoría"
              >
                {CATEGORIAS.map((categoria) => (
                  <SelectItem key={categoria} title={categoria} />
                ))}
              </Select>
            </View>
          </Card>
        );
        
      case 2: // Contacto
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de WhatsApp *</Text>
              <View style={styles.whatsappContainer}>
                <View style={styles.whatsappPrefix}>
                  <Text style={styles.whatsappPrefixText}>+593</Text>
                </View>
                <Input
                  placeholder="9XXXXXXXX"
                  value={businessData.whatsapp}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/[^0-9]/g, '');
                    if (cleanText.length <= 9) {
                      handleInputChange('whatsapp', cleanText);
                    }
                  }}
                  style={styles.whatsappInput}
                  size="large"
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>
              <Text style={styles.helperText}>Ingresa tu número sin el 0 inicial</Text>
            </View>
          </Card>
        );
        
      case 3: // Ubicación y Logo
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección del Negocio *</Text>
              <Input
                placeholder="Ingresa la dirección completa"
                value={businessData.direccion}
                onChangeText={(text) => handleInputChange('direccion', text)}
                style={styles.modernInput}
                size="large"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Logo del Negocio</Text>
              <TouchableOpacity style={styles.logoContainer} onPress={pickLogoImage}>
                {logoPreview ? (
                  <View style={styles.logoPreviewContainer}>
                    <Image source={{ uri: logoPreview }} style={styles.logoImage} />
                    <View style={styles.logoOverlay}>
                      <Text style={styles.logoOverlayText}>Cambiar</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoPlaceholderIcon}>📷</Text>
                    <Text style={styles.logoPlaceholderText}>Seleccionar Logo</Text>
                    <Text style={styles.logoPlaceholderSubtext}>JPG, PNG • Máx. 5MB</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {uploadingLogo && (
                <View style={styles.uploadingIndicator}>
                  <Text style={styles.uploadingText}>Subiendo logo...</Text>
                </View>
              )}
              
              {businessData.logoUrl && (
                <View style={styles.successIndicator}>
                  <Text style={styles.successText}>✅ Logo subido exitosamente</Text>
                </View>
              )}
              
              {logoPreview && (
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => {
                    setLogoImage(null);
                    setLogoPreview(null);
                    setBusinessData(prev => ({ ...prev, logoUrl: '' }));
                  }}
                >
                  <Text style={styles.removeButtonText}>🗑️ Eliminar Logo</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        );
        
      default:
        return null;
    }
  };

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / STEPS.length) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Registro de Negocio</Text>
          <Text style={styles.progressSubtitle}>Paso {currentStep + 1} de {STEPS.length}</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicators}>
        {STEPS.map((step, index) => (
          <View key={step.id} style={styles.stepIndicator}>
            <View style={[
              styles.stepCircle,
              index <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              {index < currentStep ? (
                <CheckIcon style={styles.checkIcon} fill={colors.white} />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index <= currentStep ? styles.stepNumberActive : styles.stepNumberInactive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            {index < STEPS.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentStep ? styles.stepLineActive : styles.stepLineInactive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const getStyles = () => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.lightGray,
      },
      scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 30,
      },
      progressContainer: {
        marginBottom: 24,
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      progressHeader: {
        alignItems: 'center',
        marginBottom: 16,
      },
      progressTitle: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
      },
      progressSubtitle: {
        color: colors.secondary,
        fontSize: 16,
        fontWeight: '500',
      },
      progressBar: {
        height: 8,
        backgroundColor: colors.lightGray,
        borderRadius: 4,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        backgroundColor: colors.secondary,
        borderRadius: 4,
      },
      stepIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      stepIndicator: {
        alignItems: 'center',
        flex: 1,
      },
      stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
      },
      stepCircleActive: {
        backgroundColor: colors.secondary,
      },
      stepCircleInactive: {
        backgroundColor: colors.lightGray,
      },
      stepNumber: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      stepNumberActive: {
        color: colors.white,
      },
      stepNumberInactive: {
        color: colors.secondary,
      },
      checkIcon: {
        width: 20,
        height: 20,
      },
      stepLine: {
        width: 40,
        height: 2,
        marginHorizontal: 4,
      },
      stepLineActive: {
        backgroundColor: colors.secondary,
      },
      stepLineInactive: {
        backgroundColor: colors.lightGray,
      },
      stepCard: {
        marginBottom: 20,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
      },
      stepHeader: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
      },
      stepIcon: {
        fontSize: 48,
        marginBottom: 12,
      },
      stepTitle: {
        color: colors.primary,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
      },
      stepSubtitle: {
        color: colors.secondary,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
      },
      inputGroup: {
        marginBottom: 20,
      },
      inputLabel: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
      },
      modernInput: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.lightGray,
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
      modernSelect: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.lightGray,
        backgroundColor: colors.white,
      },
      whatsappContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.lightGray,
        backgroundColor: colors.white,
        overflow: 'hidden',
      },
      whatsappPrefix: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
      },
      whatsappPrefixText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
      },
      whatsappInput: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
      },
      helperText: {
        color: colors.secondary,
        fontSize: 14,
        marginTop: 8,
        fontStyle: 'italic',
      },
      logoContainer: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.lightGray,
        borderStyle: 'dashed',
        backgroundColor: colors.white,
        overflow: 'hidden',
      },
      logoPlaceholder: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      logoPlaceholderIcon: {
        fontSize: 48,
        marginBottom: 12,
      },
      logoPlaceholderText: {
        color: colors.secondary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
      },
      logoPlaceholderSubtext: {
        color: colors.secondary,
        fontSize: 14,
        opacity: 0.7,
      },
      logoPreviewContainer: {
        position: 'relative',
        height: 120,
      },
      logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
      },
      logoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 8,
        alignItems: 'center',
      },
      logoOverlayText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
      },
      uploadingIndicator: {
        backgroundColor: colors.lightGray,
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
      },
      uploadingText: {
        color: colors.secondary,
        fontSize: 14,
        fontWeight: '500',
      },
      successIndicator: {
        backgroundColor: colors.success + '20',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.success,
      },
      successText: {
        color: colors.success,
        fontSize: 14,
        fontWeight: '600',
      },
      removeButton: {
        backgroundColor: colors.danger + '20',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.danger,
      },
      removeButtonText: {
        color: colors.danger,
        fontSize: 14,
        fontWeight: '600',
      },
      navigationButtons: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 16,
        width: '100%',
      },

      backButton: {
        backgroundColor: 'transparent',
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
        width: '48%',
      },
      nextButton: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
        borderWidth: 2,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
        width: '48%',
      },
      completeButton: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
        borderWidth: 2,
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
        width: '48%',
      },
      cancelButton: {
        alignSelf: 'center',
        marginTop: 8,
      },
      errorText: {
        marginBottom: 16,
        textAlign: 'center',
        paddingHorizontal: 16,
        color: colors.danger,
        fontSize: 14,
        fontWeight: '500',
      },
    });
  };

  const styles = getStyles();

  return (
    <Layout style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderProgressBar()}
        {renderStepIndicators()}
        
        {!!error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}
        
        {renderStepContent()}
        
        <View style={styles.navigationButtons}>
          <Button
            onPress={prevStep}
            disabled={currentStep === 0}
            style={styles.backButton}
            size="large"
            appearance="outline"
            accessoryLeft={ArrowLeftIcon}
          >
            Anterior
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              onPress={nextStep}
              disabled={!isStepValid()}
              style={styles.nextButton}
              size="large"
              accessoryRight={ArrowRightIcon}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onPress={handleComplete}
              disabled={loading || !isStepValid()}
              style={styles.completeButton}
              size="large"
              accessoryRight={CheckIcon}
            >
              {loading ? 'Completando...' : 'Completar'}
            </Button>
          )}
        </View>
        
        <Button
          onPress={onBack}
          style={styles.cancelButton}
          size="medium"
          appearance="ghost"
          status="basic"
        >
          Cancelar
        </Button>
      </ScrollView>
    </Layout>
  );
}
