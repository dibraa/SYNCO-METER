import React, { useState } from 'react';
import { HemsProvider } from './src/context/HemsContext';
import { MainAppNavigator } from './src/screens/MainAppNavigator';
import { AuthNavigator } from './src/screens/AuthNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthNavigator onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <HemsProvider>
      <MainAppNavigator />
    </HemsProvider>
  );
}
