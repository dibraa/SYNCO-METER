import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HemsProvider } from './src/context/HemsContext';
import { MainAppNavigator } from './src/screens/MainAppNavigator';
import { AuthNavigator } from './src/screens/AuthNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthNavigator onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HemsProvider onSignOut={() => setIsAuthenticated(false)}>
        <MainAppNavigator />
      </HemsProvider>
    </GestureHandlerRootView>
  );
}
