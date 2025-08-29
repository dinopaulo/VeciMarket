import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import {
  Input,
  Button,
  Text,
  Layout,
  Icon,
  Select,
  SelectItem,
  IndexPath,
  TopNavigation,
  TopNavigationAction,
  CheckBox,
  Spinner,
  Modal,
  Card
} from '@ui-kitten/components';
import { supabase } from '../lib/supabase';
import colors from '../lib/colors';
import * as ImagePicker from 'expo-image-picker';

export default function AddProductView({ businessData, onBack, onProductAdded, editingProduct, isEditing }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Estados para modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const TIPOS_PRODUCTO = [
    'Producto', 'Servicio', 'Combo', 'Promoción', 'Otro'
  ];

  const [newProduct, setNewProduct] = useState({
    nombre: editingProduct?.nombre || '',
    descripcion: editingProduct?.descripcion || '',
    valor: editingProduct?.valor ? editingProduct.valor.toString() : '',
    disponibilidad: editingProduct?.disponibilidad || 'disponible',
    imagen: null,
    imagenUrl: editingProduct?.imagen_url || '',
    tipoProducto: editingProduct?.tipo_producto || ''
  });

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(
    new IndexPath(
      TIPOS_PRODUCTO.indexOf(editingProduct?.tipo_producto || editingProduct?.categoria || 'Producto')
    )
  );

  // Iconos
  const BackIcon = (props) => <Icon {...props} name='arrow-back' />;
  const SaveIcon = (props) => <Icon {...props} name='checkmark' />;
  const EditIcon = (props) => <Icon {...props} name='edit' />;
  const FileIcon = (props) => <Icon {...props} name='file' />;
  const CreditCardIcon = (props) => <Icon {...props} name='credit-card' />;
  const BookmarkIcon = (props) => <Icon {...props} name='bookmark' />;
  const ImageIcon = (props) => <Icon {...props} name='image' />;
  const CheckmarkCircleIcon = (props) => <Icon {...props} name='checkmark-circle' />;
  const CloseCircleIcon = (props) => <Icon {...props} name='close-circle' />;

  // Acciones de navegación
  const renderBackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={onBack} />
  );

  // Seleccionar imagen del producto
  const pickProductImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        setNewProduct(prev => ({
          ...prev,
          imagen: selectedImage,
          imagenUrl: selectedImage.uri
        }));
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      setModalMessage('No se pudo seleccionar la imagen');
      setModalTitle('Error');
      setShowErrorModal(true);
    }
  };

  // Subir imagen a Supabase Storage
  const uploadProductImage = async (imageData) => {
    if (!imageData) return null;

    try {
      setUploadingImage(true);

      const fileExt = imageData.uri.split('.').pop();
      const fileName = `producto_${Date.now()}.${fileExt}`;

      const response = await fetch(imageData.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from('Productos Imagenes')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Productos Imagenes')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setModalMessage('No se pudo subir la imagen del producto');
      setModalTitle('Error');
      setShowErrorModal(true);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Agregar o actualizar producto
  const handleSaveProduct = async () => {
    if (!newProduct.nombre || !newProduct.valor || !newProduct.tipoProducto) {
      setModalMessage('Por favor completa nombre, valor y tipo de producto');
      setModalTitle('Campos Requeridos');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      let imagenUrl = newProduct.imagenUrl;
      if (newProduct.imagen) {
        imagenUrl = await uploadProductImage(newProduct.imagen);
      }

      if (isEditing && editingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('productos')
          .update({
            nombre: newProduct.nombre,
            descripcion: newProduct.descripcion,
            valor: parseFloat(newProduct.valor),
            tipo_producto: newProduct.tipoProducto,
            disponibilidad: newProduct.disponibilidad,
            imagen_url: imagenUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error al actualizar producto:', error);
          setModalMessage('No se pudo actualizar el producto');
          setModalTitle('Error');
          setShowErrorModal(true);
          return;
        }

        setModalMessage('Producto actualizado correctamente');
        setModalTitle('Éxito');
        setShowSuccessModal(true);
        onProductAdded();
      } else {
        // Crear nuevo producto
        const { data, error } = await supabase
          .from('productos')
          .insert([{
            negocio_id: businessData.id,
            nombre: newProduct.nombre,
            descripcion: newProduct.descripcion,
            valor: parseFloat(newProduct.valor),
            tipo_producto: newProduct.tipoProducto,
            disponibilidad: newProduct.disponibilidad,
            imagen_url: imagenUrl,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error al crear producto:', error);
          setModalMessage('No se pudo crear el producto');
          setModalTitle('Error');
          setShowErrorModal(true);
          return;
        }

        setModalMessage('Producto agregado correctamente');
        setModalTitle('Éxito');
        setShowSuccessModal(true);
        onProductAdded();
        onBack();
      }
    } catch (error) {
      console.error('Error general:', error);
      setModalMessage('Error inesperado al guardar producto');
      setModalTitle('Error');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={styles.container}>
      <TopNavigation
        title={props => (
          <View style={styles.topNavigationTitleContainer}>
            <View style={styles.titleTextContainer}>
              <Text {...props} style={styles.topNavigationTitle}>
                {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </Text>
              <Text {...props} style={styles.topNavigationSubtitle}>
                {isEditing ? 'Modifica la información de tu producto' : 'Completa la información básica de tu producto'}
              </Text>
            </View>
          </View>
        )}
        accessoryLeft={renderBackAction}
        style={styles.topNavigation}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulario */}
        <Layout style={styles.formContainer}>
          {/* Campo Nombre */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <View style={styles.labelIconContainer}>
                <EditIcon style={styles.labelIcon} fill={colors.secondary} />
              </View>
              <View style={styles.labelTextContainer}>
                <Text style={styles.inputLabel}>Nombre del Producto</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
            </View>
            <Input
              placeholder="Ej: Hamburguesa Clásica"
              value={newProduct.nombre}
              onChangeText={(value) => setNewProduct(prev => ({ ...prev, nombre: value }))}
              style={styles.formInput}
              textStyle={styles.inputText}
            />
          </View>

          {/* Campo Descripción */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <View style={styles.labelIconContainer}>
                <FileIcon style={styles.labelIcon} fill={colors.secondary} />
              </View>
              <View style={styles.labelTextContainer}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <Text style={styles.optionalIndicator}>(opcional)</Text>
              </View>
            </View>
            <Input
              placeholder="Describe tu producto..."
              value={newProduct.descripcion}
              onChangeText={(value) => setNewProduct(prev => ({ ...prev, descripcion: value }))}
              style={styles.formInput}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              textStyle={styles.inputText}
            />
          </View>

          {/* Campo Valor */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <View style={styles.labelIconContainer}>
                <CreditCardIcon style={styles.labelIcon} fill={colors.secondary} />
              </View>
              <View style={styles.labelTextContainer}>
                <Text style={styles.inputLabel}>Valor</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
            </View>
            <Input
              placeholder="0.00"
              value={newProduct.valor}
              onChangeText={(value) => setNewProduct(prev => ({ ...prev, valor: value }))}
              style={styles.formInput}
              keyboardType="numeric"
              textStyle={styles.inputText}
            />
          </View>

          {/* Campo Tipo de Producto */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <View style={styles.labelIconContainer}>
                <BookmarkIcon style={styles.labelIcon} fill={colors.secondary} />
              </View>
              <View style={styles.labelTextContainer}>
                <Text style={styles.inputLabel}>Tipo de Producto</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
            </View>
            <Select
              selectedIndex={selectedTypeIndex}
              onSelect={(index) => {
                if (index && index.row >= 0 && index.row < TIPOS_PRODUCTO.length) {
                  setSelectedTypeIndex(index);
                  setNewProduct(prev => ({ ...prev, tipoProducto: TIPOS_PRODUCTO[index.row] }));
                }
              }}
              value={newProduct.tipoProducto || 'Selecciona un tipo'}
              style={styles.formSelect}
              textStyle={styles.selectText}
            >
              {TIPOS_PRODUCTO.map((tipo) => (
                <SelectItem key={tipo} title={tipo} />
              ))}
            </Select>
          </View>

          {/* Campo Disponibilidad */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <View style={styles.labelIconContainer}>
                <CheckmarkCircleIcon style={styles.labelIcon} fill={colors.secondary} />
              </View>
              <View style={styles.labelTextContainer}>
                <Text style={styles.inputLabel}>Disponibilidad</Text>
                <Text style={styles.optionalIndicator}>(opcional)</Text>
              </View>
            </View>
            <View style={styles.statusOptionsContainer}>
              <CheckBox
                checked={newProduct.disponibilidad === 'disponible'}
                onChange={(checked) => setNewProduct(prev => ({ ...prev, disponibilidad: checked ? 'disponible' : 'no_disponible' }))}
                style={styles.statusOption}
              >
                <Text style={styles.statusOptionText}>Disponible</Text>
              </CheckBox>

              <CheckBox
                checked={newProduct.disponibilidad === 'no_disponible'}
                onChange={(checked) => setNewProduct(prev => ({ ...prev, disponibilidad: checked ? 'no_disponible' : 'disponible' }))}
                style={styles.statusOption}
              >
                <Text style={styles.statusOptionText}>No Disponible</Text>
              </CheckBox>
            </View>
          </View>

          {/* Campo Imagen */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <View style={styles.labelIconContainer}>
                <ImageIcon style={styles.labelIcon} fill={colors.secondary} />
              </View>
              <View style={styles.labelTextContainer}>
                <Text style={styles.inputLabel}>Imagen del Producto</Text>
                <Text style={styles.optionalIndicator}>(opcional)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.imagePickerContainer} onPress={pickProductImage}>
              {newProduct.imagenUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: newProduct.imagenUrl }} style={styles.imagePreview} />
                  <View style={styles.imageOverlay}>
                    <Icon name='edit' style={styles.imageOverlayIcon} fill={colors.white} />
                    <Text style={styles.imageOverlayText}>Cambiar Imagen</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imagePlaceholderIconContainer}>
                    <ImageIcon style={styles.imagePlaceholderIcon} fill={colors.secondary} />
                  </View>
                  <Text style={styles.imagePlaceholderText}>Seleccionar Imagen</Text>
                  <Text style={styles.imagePlaceholderSubtext}>Toca para elegir una foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Layout>

        {/* Botón de guardar */}
        <View style={styles.actionsContainer}>
          <Button
            onPress={handleSaveProduct}
            disabled={loading || !newProduct.nombre || !newProduct.valor || !newProduct.tipoProducto}
            accessoryLeft={SaveIcon}
            style={[
              styles.saveButton,
              (!newProduct.nombre || !newProduct.valor || !newProduct.tipoProducto) && styles.saveButtonDisabled
            ]}
            textStyle={styles.saveButtonText}
            size="large"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Guardar Producto')}
          </Button>
        </View>
      </ScrollView>

      {/* Modales */}
      <Modal
        visible={showSuccessModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowSuccessModal(false)}
      >
        <Card disabled={true}>
          <Icon name='checkmark-circle' style={styles.modalIcon} fill={colors.success} />
          <Text category='h6' style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          <Button onPress={() => setShowSuccessModal(false)} style={styles.modalButton}>
            OK
          </Button>
        </Card>
      </Modal>

      <Modal
        visible={showErrorModal}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setShowErrorModal(false)}
      >
        <Card disabled={true}>
          <Icon name='close-circle' style={styles.modalIcon} fill={colors.danger} />
          <Text category='h6' style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          <Button onPress={() => setShowErrorModal(false)} style={styles.modalButton}>
            OK
          </Button>
        </Card>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  topNavigation: {
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 30,
    marginTop: 20,
  },
  topNavigationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleTextContainer: {
    flex: 1,
  },
  topNavigationTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 24,
  },
  topNavigationSubtitle: {
    color: colors.primary,
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelIcon: {
    width: 18,
    height: 18,
  },
  labelTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  requiredIndicator: {
    color: colors.danger,
    fontSize: 16,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  optionalIndicator: {
    color: colors.secondary,
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.8,
  },
  inputText: {
    fontSize: 16,
    color: colors.primary,
  },
  formInput: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  formSelect: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  selectText: {
    fontSize: 16,
    color: colors.primary,
  },
  imagePickerContainer: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imagePlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderIcon: {
    width: 32,
    height: 32,
  },
  imagePlaceholderText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  imagePlaceholderSubtext: {
    color: colors.secondary,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 160,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageOverlayIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  imageOverlayText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  statusOption: {
    marginHorizontal: 10,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsContainer: {
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 20,
    height: 56,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.lightGray,
    borderColor: colors.lightGray,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  // Estilos para modales
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.primary,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    borderRadius: 12,
    height: 50,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
