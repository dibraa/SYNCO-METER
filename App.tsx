import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HemsProvider } from './src/context/HemsContext';
import { MainAppNavigator } from './src/screens/MainAppNavigator';
import { AuthNavigator } from './src/screens/AuthNavigator';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import {
  View,
  StatusBar,
  ActivityIndicator,
  Image,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from './src/theme/theme';
import {
  loadSavedSupabaseConfig,
  getSupabase,
  isSupabaseConfigured,
} from './src/services/supabaseClient';

function hasWebRecoveryHash(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const hash = window.location?.hash || '';
  const search = window.location?.search || '';
  return hash.includes('type=recovery') || search.includes('type=recovery');
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(hasWebRecoveryHash());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        await loadSavedSupabaseConfig();
        const supabase = getSupabase();

        if (supabase && isSupabaseConfigured()) {
          const recoveryInUrl = hasWebRecoveryHash();

          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;
            if (event === 'PASSWORD_RECOVERY') {
              setIsPasswordRecovery(true);
              setIsAuthenticated(false);
              return;
            }
            if (event === 'SIGNED_OUT') {
              setIsPasswordRecovery(false);
              setIsAuthenticated(false);
              return;
            }
            if (session) {
              setIsAuthenticated(true);
            }
          });

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (isMounted) {
            if (recoveryInUrl) {
              setIsPasswordRecovery(true);
              setIsAuthenticated(false);
            } else if (session) {
              setIsAuthenticated(true);
            }
          }

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
      setIsPasswordRecovery(false);
      setIsAuthenticated(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
        <View style={styles.splashLogoFrame}>
          <Image
            source={require('./assets/LOGO.jpg')}
            style={styles.splashLogo}
            resizeMode="contain"
            accessibilityLabel="SYNCO METER Logo"
          />
        </View>
        <Text style={styles.splashTitle}>SYNCO METER</Text>
        <Text style={styles.splashSubtitle}>Smart Home Energy Management</Text>
        <ActivityIndicator style={{ marginTop: 24 }} size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <View style={styles.outerFrame}>
          <SafeAreaView style={styles.appFrame}>
            {isPasswordRecovery ? (
              <ForgotPasswordScreen
                initialStep="reset"
                onBackToLogin={handleSignOut}
                onResetComplete={() => {
                  setIsPasswordRecovery(false);
                  setIsAuthenticated(true);
                }}
              />
            ) : isAuthenticated ? (
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
  outerFrame: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.canvas,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashLogoFrame: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...shadows.card,
  },
  splashLogo: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  splashSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
});
