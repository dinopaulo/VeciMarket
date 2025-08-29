const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para resolver problemas de compilación
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
