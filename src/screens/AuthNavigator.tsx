import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [forgotEmail, setForgotEmail] = useState('');

  if (mode === 'forgot') {
    return (
      <ForgotPasswordScreen
        initialEmail={forgotEmail}
        initialStep="request"
        onBackToLogin={() => setMode('login')}
        onResetComplete={onAuthSuccess}
      />
    );
  }

  if (mode === 'signup') {
    return (
      <SignupScreen
        onSwitchToLogin={() => setMode('login')}
        onSignupSuccess={onAuthSuccess}
      />
    );
  }

  return (
    <LoginScreen
      onSwitchToSignup={() => setMode('signup')}
      onForgotPassword={(email) => {
        setForgotEmail(email);
        setMode('forgot');
      }}
      onLoginSuccess={onAuthSuccess}
    />
  );
};
