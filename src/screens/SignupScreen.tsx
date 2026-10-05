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

interface SignupScreenProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSwitchToLogin,
  onSignupSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setIsLoading(true);

    // Mock auth — simulate network request
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      // Brief success moment before navigation
      setTimeout(() => {
        onSignupSuccess();
      }, 800);
    }, 1500);
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    if (password.length < 6) return { label: 'Weak', color: '#EF4444', width: '25%' };
    if (password.length < 10) return { label: 'Medium', color: '#F59E0B', width: '50%' };
    return { label: 'Strong', color: '#00C853', width: '100%' };
  };

  const strength = getPasswordStrength();

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCheck}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#00C853" />
        </View>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successSubtitle}>Welcome to SYNCO METER</Text>
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
              Create Account
            </Text>
            <Text style={styles.subtitle}>Start managing your energy</Text>

            {/* Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={errors.name ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    clearError('name');
                  }}
                  autoCapitalize="words"
                  textContentType="name"
                  returnKeyType="next"
                  accessibilityLabel="Full name"
                  accessibilityHint="Enter your full name"
                />
              </View>
              {errors.name ? (
                <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                  {errors.name}
                </Text>
              ) : null}
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={errors.email ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError('email');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email address"
                />
              </View>
              {errors.email ? (
                <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                  {errors.email}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={errors.password ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError('password');
                  }}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  returnKeyType="next"
                  accessibilityLabel="Password"
                  accessibilityHint="Create a password"
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
              {errors.password ? (
                <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                  {errors.password}
                </Text>
              ) : null}
              {/* Password Strength */}
              {password ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        { backgroundColor: strength.color, width: strength.width as any },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword ? styles.inputError : null,
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={errors.confirmPassword ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError('confirmPassword');
                  }}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSignup}
                  accessibilityLabel="Confirm password"
                  accessibilityHint="Re-enter your password"
                />
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Switch to Login */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={onSwitchToLogin}
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel="Sign in"
              >
                <Text style={styles.switchLink}>Sign In</Text>
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
  fieldGroup: {
    marginBottom: 14,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00C853',
    borderRadius: 14,
    height: 52,
    marginTop: 8,
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
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  termsLink: {
    color: '#00C853',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
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
