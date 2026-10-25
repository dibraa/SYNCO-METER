import React from 'react';
import { DemoAuthForm } from '../components/DemoAuthForm';

export const SignupScreen = ({ onSwitchToLogin, onSignupSuccess }: { onSwitchToLogin: () => void; onSignupSuccess: () => void }) =>
  <DemoAuthForm signup onSuccess={onSignupSuccess} onSwitch={onSwitchToLogin} />;
