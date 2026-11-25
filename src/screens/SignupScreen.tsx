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
  const [isNetworkErr, setIsNetworkErr] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [reachability, setReachability] = useState<ReachabilityStatus>(
    isSupabaseConfigured() ? 'checking' : 'offline'
  );
  const [projectUrl, setProjectUrl] = useState<string>(getLoadedConfig().url);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

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
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [fadeAnim, slideAnim, refreshReachability]);

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
    setIsNetworkErr(false);
    if (!validate()) return;

    setIsLoading(true);

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error: authError } = await withAuthRetry(() =>
          supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: name.trim(),
              },
            },
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

        // Duplicate email check (Supabase returns user with empty identities when email already exists)
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          setIsLoading(false);
          setError('An account with this email already exists. Please sign in instead.');
          return;
        }

        // Instant session path (Confirm email is OFF)
        if (data.session) {
          setReachability('reachable');
          setIsLoading(false);
          setShowSuccess(true);
          scheduleTimeout(() => {
            onSignupSuccess();
          }, 500);
          return;
        }

        // Fallback auto-sign-in attempt if session wasn't immediately attached
        if (data.user) {
          const { data: loginData, error: loginError } = await withAuthRetry(() =>
            supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })
          );
          setIsLoading(false);

          if (!loginError && loginData.session) {
            setReachability('reachable');
            setShowSuccess(true);
            scheduleTimeout(() => {
              onSignupSuccess();
            }, 500);
            return;
          }

          if (loginError) {
            const classified = classifySupabaseError(loginError, projectUrl);
            setIsNetworkErr(classified.isNetworkError);
            setError(classified.message);
            return;
          }

          setError(
            'Account created, but auto-login requires Confirm email to be OFF under Authentication → Providers → Email in Supabase Dashboard.'
          );
          return;
        }

        setReachability('reachable');
        setIsLoading(false);
        setShowSuccess(true);
        scheduleTimeout(() => {
          onSignupSuccess();
        }, 500);
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
      scheduleTimeout(() => {
        setIsLoading(false);
        setShowSuccess(true);
        scheduleTimeout(() => {
          onSignupSuccess();
        }, 700);
      }, 500);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-circle" size={54} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successSubtitle}>Welcome to SYNCO METER Energy Management</Text>
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
        >
          <View style={[styles.cloudDot, { backgroundColor: pillVisual.dot }]} />
          <Text style={[styles.cloudPillText, { color: pillVisual.text }]} numberOfLines={1}>
            {pillVisual.label}
          </Text>
          <MaterialCommunityIcons name="cog-outline" size={14} color={pillVisual.text} />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title} accessibilityRole="header">
          Create Account
        </Text>
        <Text style={styles.subtitle}>Register your home energy management profile</Text>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <View style={styles.errorRow}>
              <MaterialCommunityIcons name="alert-circle" size={17} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            {isNetworkErr ? (
              <View style={styles.errorActions}>
                <TouchableOpacity
                  style={styles.errorActionBtn}
                  onPress={handleSignup}
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

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputContainer, nameError ? styles.inputError : null]}>
            <MaterialCommunityIcons
              name="account-outline"
              size={20}
              color={nameError ? colors.danger : colors.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={colors.subtle}
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
              color={emailError ? colors.danger : colors.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.subtle}
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
              color={passwordError ? colors.danger : colors.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.subtle}
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
                color={colors.muted}
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
              color={confirmError ? colors.danger : colors.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor={colors.subtle}
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
              <MaterialCommunityIcons name="arrow-right" size={19} color="#FFFFFF" />
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
    marginBottom: 18,
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
    marginBottom: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    height: 48,
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
    marginTop: 4,
    marginLeft: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    height: 50,
    marginTop: 10,
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
  centerContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
