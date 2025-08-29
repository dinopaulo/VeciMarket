import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Layout, Text, ProgressBar } from '@ui-kitten/components';
import colors from '../lib/colors';

export default function SplashScreen({ onComplete, message = 'Iniciando sesión...' }) {
  const [progress, setProgress] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
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

    // Simular progreso
    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 0.05; // Más lento para más tiempo
        if (newProgress >= 1) {
          clearInterval(progressInterval);
          // Pequeña pausa para mostrar el 100% completo
          setTimeout(() => {
            // Animación de salida más rápida
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onComplete();
            });
          }, 600); // Pausa de 600ms para mostrar el 100%
          return 1;
        }
        return newProgress;
      });
    }, 150); // Más lento para más tiempo total

    return () => clearInterval(progressInterval);
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
          <Text style={styles.message}>{message}</Text>
          <ProgressBar
            progress={progress}
            style={styles.progressBar}
            progressColor={colors.secondary}
          />
          <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
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
    marginBottom: 60,
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
    width: 250,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  percentage: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
  },
});
