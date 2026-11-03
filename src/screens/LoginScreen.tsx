import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthLayout } from '../components/AuthLayout';
import {
  getSupabase,
  isSupabaseConfigured,
  onSupabaseConfigChange,
  getLoadedConfig,
  loadSavedSupabaseConfig,
} from '../services/supabaseClient';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

interface LoginScreenProps {
  onSwitchToSignup: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToSignup,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configured, setConfigured] = useState<boolean>(isSupabaseConfigured());
  const [projectUrl, setProjectUrl] = useState<string>(getLoadedConfig().url);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Load any saved credentials
    loadSavedSupabaseConfig().then((cfg) => {
      setConfigured(isSupabaseConfigured());
      setProjectUrl(cfg.url);
    });

    const unsubscribe = onSupabaseConfigChange((cfg) => {
      setConfigured(isSupabaseConfigured());
      setProjectUrl(cfg.url);
    });

    return () => unsubscribe();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value.trim())) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    setError('');
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) {
          setIsLoading(false);
          setError(authError.message);
          return;
        }

        setIsLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 700);
      } catch (err: any) {
        setIsLoading(false);
        setError(err?.message || 'Login failed. Please check your credentials.');
      }
    } else {
      // Supabase is not configured yet — prompt user or allow demo sign-in
      setIsLoading(false);
      setError(
        'Your connection is not configured. Open connection settings above, or use "Demo Access" below.'
      );
    }
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);
    setError('');
    setTimeout(() => {
      setIsDemoLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 600);
    }, 600);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email above to receive a password reset link.');
      return;
    }
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (resetError) {
          Alert.alert('Reset Failed', resetError.message);
        } else {
          Alert.alert('Email Sent', `Password reset instructions sent to ${email.trim()}.`);
        }
      } catch (err: any) {
        Alert.alert('Reset Failed', err?.message || 'Could not send reset email.');
      }
    } else {
      Alert.alert(
        'Offline / Demo Mode',
        'Password reset is available once your account is connected.'
      );
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCheck}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#177245" />
        </View>
        <Text style={styles.successTitle}>Welcome Back!</Text>
        <Text style={styles.successSubtitle}>Loading smart meter dashboard...</Text>
      </View>
    );
  }

  // Extract clean host name for display
  let displayHost = '';
  try {
    if (projectUrl) {
      displayHost = new URL(projectUrl).hostname;
    }
  } catch {
    displayHost = projectUrl;
  }

  return (
    <AuthLayout>
          <Animated.View
            style={[
              styles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Supabase Status Pill */}
            <TouchableOpacity
              style={[
                styles.cloudPill,
                configured ? styles.cloudPillActive : styles.cloudPillInactive,
              ]}
              onPress={() => setConfigModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Connection settings"
            >
              <View
                style={[
                  styles.cloudDot,
                  { backgroundColor: configured ? '#177245' : '#D97706' },
                ]}
              />
              <Text
                style={[
                  styles.cloudPillText,
                  { color: configured ? '#177245' : '#B45309' },
                ]}
                numberOfLines={1}
              >
                {configured
                  ? `Connection: ${displayHost ? 'Connected' : 'Ready'}`
                  : 'Connection: Not configured (Tap to set up)'}
              </Text>
              <MaterialCommunityIcons
                name="cog-outline"
                size={14}
                color={configured ? '#177245' : '#B45309'}
              />
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.title} accessibilityRole="header">
              Welcome Back
            </Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {/* Error Banner */}
            {error ? (
              <View
                style={styles.errorBanner}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={emailError ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={() => email && validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email address"
                />
              </View>
              {emailError ? (
                <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={passwordError ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  onBlur={() => password && validatePassword(password)}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password"
                  accessibilityHint="Enter your password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  accessibilityState={{ selected: showPassword }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || isDemoLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Guest / Demo Mode Button */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={isLoading || isDemoLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Demo guest access"
            >
              {isDemoLoading ? (
                <ActivityIndicator color="#177245" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="play-circle-outline" size={18} color="#177245" />
                  <Text style={styles.demoButtonText}>Continue as Demo / Guest</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Switch to Signup */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={onSwitchToSignup}
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel="Sign up"
              >
                <Text style={styles.switchLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSaveSuccess={(cfg) => {
          setConfigured(Boolean(cfg.url && cfg.anonKey));
          setProjectUrl(cfg.url);
        }}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContent: {
    paddingBottom: 20,
  },
  cloudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cloudPillActive: {
    backgroundColor: '#EAF5EE',
    borderColor: '#CCDFD1',
  },
  cloudPillInactive: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FED7AA',
  },
  cloudDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cloudPillText: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 240,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: '#177245',
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#177245',
    borderRadius: 14,
    height: 52,
    shadowColor: '#177245',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EAF5EE',
    borderRadius: 14,
    height: 48,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CCDFD1',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#177245',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 13,
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 13,
    color: '#177245',
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCheck: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});
