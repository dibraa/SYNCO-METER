import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  checkSupabaseReachability,
  withAuthRetry,
  classifySupabaseError,
  ReachabilityStatus,
} from '../services/supabaseClient';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';
import { colors, radii, shadows } from '../theme/theme';

interface LoginScreenProps {
  onSwitchToSignup: () => void;
  onForgotPassword: (email: string) => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToSignup,
  onForgotPassword,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkErr, setIsNetworkErr] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [reachability, setReachability] = useState<ReachabilityStatus>(
    isSupabaseConfigured() ? 'checking' : 'offline'
  );
  const [projectUrl, setProjectUrl] = useState<string>(getLoadedConfig().url);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const refreshReachability = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setReachability('offline');
      return;
    }
    setReachability('checking');
    const status = await checkSupabaseReachability();
    setReachability(status);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    let mounted = true;
    loadSavedSupabaseConfig().then((cfg) => {
      if (!mounted) return;
      setProjectUrl(cfg.url);
      refreshReachability();
    });

    const unsubscribe = onSupabaseConfigChange((cfg) => {
      if (!mounted) return;
      setProjectUrl(cfg.url);
      refreshReachability();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fadeAnim, slideAnim, refreshReachability]);

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
    setIsNetworkErr(false);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: authError } = await withAuthRetry(() =>
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
        );

        if (authError) {
          setIsLoading(false);
          const classified = classifySupabaseError(authError, projectUrl);
          setIsNetworkErr(classified.isNetworkError);
          setError(classified.message);
          if (classified.isNetworkError) {
            setReachability('unreachable');
          }
          return;
        }

        setReachability('reachable');
        setIsLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 700);
      } catch (err) {
        setIsLoading(false);
        const classified = classifySupabaseError(err, projectUrl);
        setIsNetworkErr(classified.isNetworkError);
        setError(classified.message);
        if (classified.isNetworkError) {
          setReachability('unreachable');
        }
      }
    } else {
      setIsLoading(false);
      setIsNetworkErr(true);
      setError(
        'Cloud connection is offline. Open Connection Settings above, or use "Continue as Demo / Guest" below.'
      );
    }
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);
    setError('');
    setIsNetworkErr(false);
    setTimeout(() => {
      setIsDemoLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 600);
    }, 500);
  };

  const handleForgotPassword = () => {
    onForgotPassword(email.trim());
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconWrap}>
          <MaterialCommunityIcons name="check-circle" size={56} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Welcome Back!</Text>
        <Text style={styles.successSubtitle}>Loading your energy dashboard...</Text>
      </View>
    );
  }

  const pillVisual =
    reachability === 'reachable'
      ? {
          bg: colors.successSoft,
          dot: colors.success,
          text: colors.successText,
          label: 'Cloud: Connected',
        }
      : reachability === 'checking'
      ? {
          bg: colors.primarySoft,
          dot: colors.primary,
          text: colors.primaryText,
          label: 'Checking cloud…',
        }
      : reachability === 'unreachable'
      ? {
          bg: colors.warningSoft,
          dot: colors.warning,
          text: colors.warningText,
          label: 'Cloud: Unreachable (Tap to fix)',
        }
      : {
          bg: colors.primarySoft,
          dot: colors.primary,
          text: colors.primaryText,
          label: 'Offline / Demo (Tap to connect)',
        };

  return (
    <AuthLayout>
      <Animated.View
        style={[
          styles.formContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Connection Status Pill */}
        <TouchableOpacity
          style={[styles.cloudPill, { backgroundColor: pillVisual.bg }]}
          onPress={() => setConfigModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Connection settings"
        >
          <View style={[styles.cloudDot, { backgroundColor: pillVisual.dot }]} />
          <Text style={[styles.cloudPillText, { color: pillVisual.text }]} numberOfLines={1}>
            {pillVisual.label}
          </Text>
          <MaterialCommunityIcons name="cog-outline" size={14} color={pillVisual.text} />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title} accessibilityRole="header">
          Welcome Back
        </Text>
        <Text style={styles.subtitle}>Sign in to monitor your home energy</Text>

        {/* Error Banner with Inline Recovery */}
        {error ? (
          <View
            style={styles.errorBanner}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <View style={styles.errorRow}>
              <MaterialCommunityIcons name="alert-circle" size={17} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            {isNetworkErr ? (
              <View style={styles.errorActions}>
                <TouchableOpacity
                  style={styles.errorActionBtn}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.errorActionText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.errorActionBtn}
                  onPress={() => setConfigModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.errorActionText}>Connection Settings</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Email Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={emailError ? colors.danger : colors.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.subtle}
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
              color={passwordError ? colors.danger : colors.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.subtle}
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
                color={colors.muted}
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

        {/* Sign In Button */}
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
              <MaterialCommunityIcons name="arrow-right" size={19} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Guest / Demo Mode Button */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleDemoLogin}
          disabled={isLoading || isDemoLoading}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Demo guest access"
        >
          {isDemoLoading ? (
            <ActivityIndicator color={colors.primaryText} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={18}
                color={colors.primaryText}
              />
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

      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSaveSuccess={(cfg) => {
          setProjectUrl(cfg.url);
          setError('');
          setIsNetworkErr(false);
          refreshReachability();
        }}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContent: {
    paddingBottom: 4,
  },
  cloudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    marginBottom: 18,
  },
  cloudDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  cloudPillText: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 250,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 25,
  },
  errorActionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 5,
    marginLeft: 2,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -2,
    minHeight: 32,
    justifyContent: 'center',
  },
  forgotText: {
    fontSize: 13,
    color: colors.primaryText,
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    height: 50,
    ...shadows.button,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
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
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    height: 48,
    marginTop: 12,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  switchText: {
    fontSize: 13,
    color: colors.muted,
  },
  switchLink: {
    fontSize: 13,
    color: colors.primaryText,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.muted,
  },
});
