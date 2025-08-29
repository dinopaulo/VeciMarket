# VeciMarket - Aplicación de Negocios

## Descripción
VeciMarket es una aplicación móvil desarrollada con React Native y Kitten UI que permite a los negocios locales mostrar sus productos y servicios, y a los usuarios descubrir y contactar negocios cercanos.

## Características Principales

### 🏠 **Vista Inicio (Home)**
- Barra de búsqueda para encontrar negocios o productos
- Filtros por categorías (Comida, Ropa, Ferretería, Belleza, etc.)
- Módulos de negocios con imágenes, descripciones y botones de acción
- Botones para ver catálogo y contactar por WhatsApp

### 🏢 **Vista Negocios**
- Lista completa de negocios disponibles
- Filtros por categoría y ordenamiento
- Información detallada: calificaciones, reseñas, distancia, estado (abierto/cerrado)
- Etiquetas descriptivas para cada negocio
- Botones para ver detalles y contactar

### ❤️ **Vista Favoritos**
- Lista de negocios favoritos del usuario
- Búsqueda dentro de favoritos
- Gestión de favoritos (agregar/eliminar)
- Estado vacío cuando no hay favoritos

### 🛒 **Vista Carrito**
- Carrito de compras organizado por negocio
- Gestión de cantidades y eliminación de productos
- Información de entrega configurable
- Resumen del pedido con subtotal, envío y total
- Proceso de checkout

### 👤 **Vista Perfil**
- Perfil del negocio con estadísticas
- Sección de carpetas/proyectos
- Gestión del equipo y proyectos en curso
- Información de contacto y ubicación

## Estructura del Proyecto

```
src/
├── components/
│   ├── MainLayout.js              # Layout principal con header y bottom tabs
│   ├── BusinessHomeView.js        # Vista principal del negocio
│   ├── BusinessesView.js          # Lista de negocios
│   ├── FavoritesView.js           # Favoritos del usuario
│   ├── CartView.js                # Carrito de compras
│   ├── BusinessProfileView.js     # Perfil del negocio
│   └── BusinessApp.js             # Aplicación principal integradora
├── lib/
│   ├── colors.js                  # Paleta de colores personalizada
│   └── supabase.js                # Configuración de Supabase
└── pages/
    ├── AuthScreen.js              # Pantalla de autenticación
    └── WelcomeScreen.js           # Pantalla de bienvenida
```

## Tecnologías Utilizadas

- **React Native**: Framework principal para desarrollo móvil
- **Kitten UI**: Biblioteca de componentes UI moderna y personalizable
- **Eva Design System**: Sistema de diseño base para Kitten UI
- **Supabase**: Backend y base de datos
- **Expo**: Plataforma de desarrollo y herramientas

## Paleta de Colores

```javascript
export const colors = {
  primary: '#131629',    // Azul oscuro - Color principal
  secondary: '#e06f33',  // Naranja - Color de acento
  tertiary: '#ffffff',   // Blanco - Color de fondo
  lightGray: '#f0f0f0', // Gris claro - Bordes y fondos secundarios
  success: '#4CAF50',    // Verde - Estados exitosos
  danger: '#f44336',     // Rojo - Estados de error
  white: '#ffffff',      // Blanco puro
};
```

## Componentes Kitten UI Utilizados

### Navegación
- `TopNavigation`: Header superior con título y acciones
- `BottomNavigation`: Menú inferior con pestañas
- `BottomNavigationTab`: Pestañas individuales del menú

### Formularios y Entrada
- `Input`: Campos de texto con iconos
- `Select`: Selectores desplegables
- `Button`: Botones con diferentes estilos y tamaños

### Layout y Contenido
- `Layout`: Contenedor principal
- `Card`: Tarjetas para mostrar información
- `Text`: Componente de texto con estilos
- `Icon`: Iconos del sistema Eva
- `Avatar`: Imágenes de perfil circulares
- `Divider`: Separadores visuales

## Funcionalidades Implementadas

### ✅ **Completadas**
- Layout principal con navegación superior e inferior
- Vista de inicio con módulos de negocios
- Vista de lista de negocios con filtros
- Vista de favoritos con gestión
- Vista de carrito con funcionalidad completa
- Vista de perfil del negocio
- Sistema de navegación por pestañas
- Diseño responsive y moderno
- Integración con paleta de colores personalizada

### 🔄 **En Desarrollo**
- Integración con Supabase para datos reales
- Sistema de autenticación completo
- Gestión de estado global
- Notificaciones push
- Geolocalización para negocios cercanos

### 📋 **Pendientes**
- Sistema de pagos
- Chat en tiempo real
- Reseñas y calificaciones
- Historial de pedidos
- Configuraciones de usuario

## Instalación y Uso

1. **Instalar dependencias**:
   ```bash
   npm install
   # o
   yarn install
   ```

2. **Configurar variables de entorno**:
   - Crear archivo `.env` con credenciales de Supabase
   - Configurar bucket de almacenamiento para imágenes

3. **Ejecutar la aplicación**:
   ```bash
   npm start
   # o
   yarn start
   ```

4. **Ejecutar en dispositivo/emulador**:
   ```bash
   npm run android
   # o
   npm run ios
   ```

## Personalización

### Cambiar Colores
Edita `src/lib/colors.js` para modificar la paleta de colores de la aplicación.

### Modificar Componentes
Los componentes están organizados modularmente y pueden ser personalizados individualmente.

### Agregar Nuevas Vistas
1. Crear el componente de la vista
2. Agregarlo al `BusinessApp.js`
3. Actualizar la navegación si es necesario

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Para preguntas o soporte, contacta al equipo de desarrollo de VeciMarket.

---

**Desarrollado con ❤️ usando React Native y Kitten UI**
