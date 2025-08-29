import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl =
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.supabaseUrl) ||
  (Constants?.manifest?.extra && Constants.manifest.extra.supabaseUrl) ||
  '';

const supabaseAnonKey =
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.supabaseAnonKey) ||
  (Constants?.manifest?.extra && Constants.manifest.extra.supabaseAnonKey) ||
  '';

console.log('Configuración Supabase:', {
  supabaseUrl: supabaseUrl ? 'Configurada' : 'No configurada',
  supabaseAnonKey: supabaseAnonKey ? 'Configurada' : 'No configurada',
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});



