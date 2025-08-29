import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import AuthScreen from './src/pages/AuthScreen';
import colors from './src/lib/colors';

// Tema personalizado con los colores del usuario
const customTheme = {
  ...eva.light,
  'color-primary-100': colors.tertiary,
  'color-primary-200': colors.tertiary,
  'color-primary-300': colors.tertiary,
  'color-primary-400': colors.tertiary,
  'color-primary-500': colors.secondary,
  'color-primary-600': colors.secondary,
  'color-primary-700': colors.secondary,
  'color-primary-800': colors.secondary,
  'color-primary-900': colors.primary,
  'color-primary-default': colors.secondary,
  'color-primary-active': colors.secondary,
  'color-primary-focus': colors.secondary,
  'color-primary-hover': colors.secondary,
  'color-primary-disabled': '#9ca3af',
  'color-primary-transparent-100': `${colors.secondary}10`,
  'color-primary-transparent-200': `${colors.secondary}20`,
  'color-primary-transparent-300': `${colors.secondary}30`,
  'color-primary-transparent-400': `${colors.secondary}40`,
  'color-primary-transparent-500': `${colors.secondary}50`,
  'color-primary-transparent-600': `${colors.secondary}60`,
  'color-primary-transparent-700': `${colors.secondary}70`,
  'color-primary-transparent-800': `${colors.secondary}80`,
  'color-primary-transparent-900': `${colors.secondary}90`,
};

export default function App() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={customTheme}>
        <AuthScreen />
        <StatusBar style="auto" />
      </ApplicationProvider>
    </>
  );
}


