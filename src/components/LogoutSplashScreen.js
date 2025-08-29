import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Layout, Text, ProgressBar } from '@ui-kitten/components';
import colors from '../lib/colors';

export default function LogoutSplashScreen({ onComplete, userName = 'Usuario' }) {
  const [progress, setProgress] = useState(1); // Comienza en 100%
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    let progressInterval;
    
    console.log('🚀 LogoutSplashScreen: Iniciando con progreso 100%');
    
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pausa para mostrar el 100% antes de empezar a bajar
    const startCountdown = setTimeout(() => {
      console.log('⏳ LogoutSplashScreen: Comenzando cuenta regresiva de 100% a 0%');
      
      // Simular progreso hacia atrás (de 100% a 0%)
      progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress - 0.02; // Más lento para más tiempo
          console.log(`📉 LogoutSplashScreen: Progreso: ${Math.round(newProgress * 100)}%`);
          
          if (newProgress <= 0) {
            console.log('✅ LogoutSplashScreen: Progreso completado, iniciando animación de salida');
            clearInterval(progressInterval);
            // Animación de salida
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              console.log('🎬 LogoutSplashScreen: Animación de salida completada, llamando onComplete');
              onComplete();
            });
            return 0;
          }
          return newProgress;
        });
      }, 100); // Más lento para más tiempo total
    }, 1000); // Pausa de 1 segundo para mostrar el 100%

    // Cleanup function
    return () => {
      console.log('🧹 LogoutSplashScreen: Cleanup ejecutado');
      clearTimeout(startCountdown);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [fadeAnim, scaleAnim, onComplete]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Layout style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>VeciMarket</Text>
          <Text style={styles.subtitle}>Tu directorio comunitario</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.message}>
            ¡Hasta pronto, {userName}! 👋
          </Text>
          <Text style={styles.subMessage}>
            Cerrando sesión...
          </Text>
          
          <ProgressBar
            progress={progress}
            style={styles.progressBar}
            progressColor={colors.secondary}
          />
          
          <Text style={styles.percentage}>
            {Math.round(progress * 100)}%
          </Text>
          
          <Text style={styles.farewell}>
            Gracias por usar nuestra aplicación
          </Text>
        </View>
      </Layout>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    width: 280,
    alignItems: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 25,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  percentage: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  farewell: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
