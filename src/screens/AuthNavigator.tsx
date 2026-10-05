import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';

type AuthMode = 'login' | 'signup';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'login') {
    return (
      <LoginScreen
        onSwitchToSignup={() => setMode('signup')}
        onLoginSuccess={onAuthSuccess}
      />
    );
  }

  return (
    <SignupScreen
      onSwitchToLogin={() => setMode('login')}
      onSignupSuccess={onAuthSuccess}
    />
  );
};
