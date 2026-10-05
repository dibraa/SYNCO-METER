import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthLayout } from '../components/AuthLayout';

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
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
  }, []);

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

    // Mock auth — simulate network request
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      // Brief success moment before navigation
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    }, 1500);
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    // For now, show an alert or navigate to a reset screen
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCheck}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#00C853" />
        </View>
        <Text style={styles.successTitle}>Welcome Back!</Text>
        <Text style={styles.successSubtitle}>Signing you in...</Text>
      </View>
    );
  }

  return (
    <AuthLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.formContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
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
              disabled={isLoading}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContent: {
    paddingBottom: 20,
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
    marginBottom: 24,
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
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: '#00C853',
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00C853',
    borderRadius: 14,
    height: 52,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#00C853',
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
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
