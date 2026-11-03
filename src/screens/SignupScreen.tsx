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
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
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

  const validate = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmError('');
    }

    return isValid;
  };

  const handleSignup = async () => {
    setError('');
    if (!validate()) return;

    setIsLoading(true);

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (authError) {
          setIsLoading(false);
          setError(authError.message);
          return;
        }

        setIsLoading(false);

        // Supabase returns a user but session may be null if email confirmation is enabled
        if (data.session) {
          setShowSuccess(true);
          setTimeout(() => {
            onSignupSuccess();
          }, 800);
        } else if (data.user) {
          // Email confirmation is required
          setNeedsVerification(true);
        } else {
          setShowSuccess(true);
          setTimeout(() => {
            onSignupSuccess();
          }, 800);
        }
      } catch (err: any) {
        setIsLoading(false);
        setError(err?.message || 'Registration failed. Please try again.');
      }
    } else {
      // Supabase is not configured — permit demo signup
      setTimeout(() => {
        setIsLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          onSignupSuccess();
        }, 800);
      }, 600);
    }
  };

  if (needsVerification) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="email-check-outline" size={56} color="#177245" />
        </View>
        <Text style={styles.successTitle}>Check Your Inbox</Text>
        <Text style={styles.verificationText}>
          We sent a verification link to <Text style={styles.bold}>{email.trim()}</Text>. Please click
          the link in the email to activate your account, then sign in.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onSwitchToLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Return to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-circle" size={56} color="#177245" />
        </View>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successSubtitle}>Welcome to SYNCO METER Energy Management</Text>
      </View>
    );
  }

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
              Create Account
            </Text>
            <Text style={styles.subtitle}>Register your home energy management profile</Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, nameError ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={nameError ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (nameError) setNameError('');
                  }}
                  autoCapitalize="words"
                />
              </View>
              {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
            </View>

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
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
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
                  placeholder="At least 6 characters"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, confirmError ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={confirmError ? '#EF4444' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (confirmError) setConfirmError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
              </View>
              {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.85}
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

            {/* Switch to Login */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.7}>
                <Text style={styles.switchLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

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
    paddingBottom: 24,
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
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
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
    marginTop: 4,
    marginLeft: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#177245',
    borderRadius: 14,
    height: 52,
    marginTop: 10,
    shadowColor: '#177245',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
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
  centerContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
});
