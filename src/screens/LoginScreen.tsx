import React from 'react';
import { DemoAuthForm } from '../components/DemoAuthForm';

export const LoginScreen = ({ onSwitchToSignup, onLoginSuccess }: { onSwitchToSignup: () => void; onLoginSuccess: () => void }) =>
  <DemoAuthForm onSuccess={onLoginSuccess} onSwitch={onSwitchToSignup} />;
