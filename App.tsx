import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HemsProvider } from './src/context/HemsContext';
import { MainAppNavigator } from './src/screens/MainAppNavigator';
import { AuthNavigator } from './src/screens/AuthNavigator';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/theme';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, backgroundColor: colors.neutral, alignItems: 'center' }}>
          <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 520, backgroundColor: colors.surface }}>
            {isAuthenticated ? <HemsProvider onSignOut={() => setIsAuthenticated(false)}><MainAppNavigator /></HemsProvider>
              : <AuthNavigator onAuthSuccess={() => setIsAuthenticated(true)} />}
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
