import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HemsProvider } from './src/context/HemsContext';
import { MainAppNavigator } from './src/screens/MainAppNavigator';
import { AuthNavigator } from './src/screens/AuthNavigator';
import { View, StatusBar, ActivityIndicator, Image, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/theme';
import {
  loadSavedSupabaseConfig,
  getSupabase,
  isSupabaseConfigured,
} from './src/services/supabaseClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        await loadSavedSupabaseConfig();
        const supabase = getSupabase();

        if (supabase && isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted && session) {
            setIsAuthenticated(true);
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (isMounted) {
                setIsAuthenticated(Boolean(session));
              }
            }
          );

          return () => {
            authListener?.subscription?.unsubscribe();
          };
        }
      } catch (err) {
        console.warn('[App] Error restoring auth session:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    const unsubPromise = initSession();

    return () => {
      isMounted = false;
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      if (supabase && isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[App] Error signing out of Supabase:', err);
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" />
        <Image
          source={require('./assets/LOGO.jpg')}
          style={styles.splashLogo}
          resizeMode="contain"
          accessibilityLabel="SYNCO METER Logo"
        />
        <Text style={styles.splashTitle}>SYNCO METER</Text>
        <Text style={styles.splashSubtitle}>Home Energy Management System</Text>
        <ActivityIndicator style={{ marginTop: 24 }} size="small" color={colors.green} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, backgroundColor: colors.neutral, alignItems: 'center' }}>
          <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, backgroundColor: colors.surface }}>
            {isAuthenticated ? (
              <HemsProvider onSignOut={handleSignOut}>
                <MainAppNavigator />
              </HemsProvider>
            ) : (
              <AuthNavigator onAuthSuccess={() => setIsAuthenticated(true)} />
            )}
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashLogo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#172B22',
    letterSpacing: 0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#59685F',
    marginTop: 4,
  },
});
