import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthLayout } from '../components/AuthLayout';
import {
  getSupabase,
  isSupabaseConfigured,
  getLoadedConfig,
  getPasswordResetRedirectUrl,
  checkEmailRegistered,
  withAuthRetry,
  classifySupabaseError,
} from '../services/supabaseClient';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';
import { colors, radii, shadows } from '../theme/theme';

export type RecoveryStep = 'request' | 'sent' | 'reset' | 'done';

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  initialStep?: 'request' | 'reset';
  onBackToLogin: () => void;
  onSwitchToSignup?: () => void;
  onResetComplete: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  initialEmail = '',
  initialStep = 'request',
  onBackToLogin,
  onSwitchToSignup,
  onResetComplete,
}) => {
  const [step, setStep] = useState<RecoveryStep>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkErr, setIsNetworkErr] = useState(false);
  const [isUnregisteredEmail, setIsUnregisteredEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    if (!emailRegex.test(value.trim())) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSendResetEmail = async () => {
    setError('');
    setIsNetworkErr(false);
    setIsUnregisteredEmail(false);
    if (!validateEmail(email)) return;

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setIsNetworkErr(true);
      setError('Cloud connection is offline. Configure your Supabase connection to reset passwords.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify the email is registered before requesting a reset link
      const registrationStatus = await checkEmailRegistered(email.trim());
      if (registrationStatus === 'not_registered') {
        setIsLoading(false);
        setIsUnregisteredEmail(true);
        setEmailError('This email is not registered');
        setError(
          `No account found for ${email.trim()}. Check the spelling or create a new account.`
        );
        return;
      }

      // 2. Send the password reset email
      const redirectTo = getPasswordResetRedirectUrl();
      const { error: resetError } = await withAuthRetry(() =>
        supabase.auth.resetPasswordForEmail(
          email.trim(),
          redirectTo ? { redirectTo } : undefined
        )
      );

      setIsLoading(false);
      if (resetError) {
        const classified = classifySupabaseError(resetError, getLoadedConfig().url);
        setIsNetworkErr(classified.isNetworkError);
        setError(classified.message);
        return;
      }

      setResendCooldown(60);
      setStep('sent');
    } catch (err) {
      setIsLoading(false);
      const classified = classifySupabaseError(err, getLoadedConfig().url);
      setIsNetworkErr(classified.isNetworkError);
      setError(classified.message);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsNetworkErr(false);
    const cleanedToken = otpCode.trim();
    if (cleanedToken.length < 6) {
      setError('Enter the 6-to-8 digit recovery code from your reset email.');
      return;
    }

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setIsNetworkErr(true);
      setError('Cloud connection is offline.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: verifyError } = await withAuthRetry(() =>
        supabase.auth.verifyOtp({
          email: email.trim(),
          token: cleanedToken,
          type: 'recovery',
        })
      );

      setIsLoading(false);
      if (verifyError) {
        const classified = classifySupabaseError(verifyError, getLoadedConfig().url);
        setIsNetworkErr(classified.isNetworkError);
        setError(classified.message);
        return;
      }

      setStep('reset');
    } catch (err) {
      setIsLoading(false);
      const classified = classifySupabaseError(err, getLoadedConfig().url);
      setIsNetworkErr(classified.isNetworkError);
      setError(classified.message);
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setIsNetworkErr(false);

    let valid = true;
    if (!newPassword) {
      setPasswordError('New password is required');
      valid = false;
    } else if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password');
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }

    if (!valid) return;

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setIsNetworkErr(true);
      setError('Cloud connection is offline.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await withAuthRetry(() =>
        supabase.auth.updateUser({ password: newPassword })
      );

      setIsLoading(false);
      if (updateError) {
        const classified = classifySupabaseError(updateError, getLoadedConfig().url);
        setIsNetworkErr(classified.isNetworkError);
        setError(classified.message);
        return;
      }

      // Clean recovery hash/query params on web so refresh does not re-open recovery screen
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setStep('done');
      doneTimerRef.current = setTimeout(() => {
        onResetComplete();
      }, 1100);
    } catch (err) {
      setIsLoading(false);
      const classified = classifySupabaseError(err, getLoadedConfig().url);
      setIsNetworkErr(classified.isNetworkError);
      setError(classified.message);
    }
  };

  if (step === 'done') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-circle" size={56} color={colors.success} />
        </View>
        <Text style={styles.centerTitle}>Password Updated!</Text>
        <Text style={styles.centerSub}>Signing you into SYNCO METER...</Text>
      </View>
    );
  }

  return (
    <AuthLayout>
      <View style={styles.content}>
        {/* Step 1: Enter email to request reset */}
        {step === 'request' ? (
          <>
            <TouchableOpacity
              style={styles.backRow}
              onPress={onBackToLogin}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to Sign In"
            >
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.primaryText} />
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>

            <Text style={styles.title} accessibilityRole="header">
              Forgot Password
            </Text>
            <Text style={styles.subtitle}>
              Enter the email linked to your account and we'll send you a password reset link.
            </Text>

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
                      onPress={handleSendResetEmail}
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
                {isUnregisteredEmail && onSwitchToSignup ? (
                  <View style={styles.errorActions}>
                    <TouchableOpacity
                      style={styles.errorActionBtn}
                      onPress={onSwitchToSignup}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.errorActionText}>Create Account</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}

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
                    if (isUnregisteredEmail) {
                      setIsUnregisteredEmail(false);
                      setError('');
                    }
                  }}
                  onBlur={() => email && validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleSendResetEmail}
                  accessibilityLabel="Email address"
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledBtn]}
              onPress={handleSendResetEmail}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Send reset link"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="email-fast-outline" size={19} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {/* Step 2: Reset email sent — click link or enter recovery code */}
        {step === 'sent' ? (
          <>
            <View style={styles.sentHeader}>
              <View style={styles.sentIconBox}>
                <MaterialCommunityIcons
                  name="email-check-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.title} accessibilityRole="header">
                Check Your Email
              </Text>
              <Text style={styles.subtitle}>
                We sent a password reset link to{' '}
                <Text style={styles.bold}>{email.trim()}</Text>. Open the link to set your new
                password automatically.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons name="alert-circle" size={17} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            ) : null}

            {/* Optional in-app recovery code verification */}
            <View style={styles.otpSection}>
              <Text style={styles.label}>Have a recovery code instead?</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="key-outline" size={20} color={colors.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6–8 digit code"
                  placeholderTextColor={colors.subtle}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                  accessibilityLabel="Recovery code"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isLoading || otpCode.trim().length < 6) && styles.disabledBtn,
                ]}
                onPress={handleVerifyOtp}
                disabled={isLoading || otpCode.trim().length < 6}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify Recovery Code</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.sentActions}>
              <TouchableOpacity
                style={[styles.softButton, resendCooldown > 0 && styles.disabledBtn]}
                onPress={handleSendResetEmail}
                disabled={resendCooldown > 0 || isLoading}
                activeOpacity={0.75}
              >
                <Text style={styles.softButtonText}>
                  {resendCooldown > 0
                    ? `Resend email in ${resendCooldown}s`
                    : 'Resend Reset Email'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={onBackToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* Step 3: Set New Password (from email link PASSWORD_RECOVERY or OTP) */}
        {step === 'reset' ? (
          <>
            <View style={styles.recoveryBadge}>
              <MaterialCommunityIcons name="shield-key-outline" size={15} color={colors.primaryText} />
              <Text style={styles.recoveryBadgeText}>Password Recovery Verified</Text>
            </View>

            <Text style={styles.title} accessibilityRole="header">
              Set New Password
            </Text>
            <Text style={styles.subtitle}>
              Choose a strong new password for your SYNCO METER account.
            </Text>

            {error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons name="alert-circle" size={17} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New Password</Text>
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
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  accessibilityLabel="New password"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={[styles.inputContainer, confirmError ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={confirmError ? colors.danger : colors.muted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your new password"
                  placeholderTextColor={colors.subtle}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (confirmError) setConfirmError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleUpdatePassword}
                  accessibilityLabel="Confirm new password"
                />
              </View>
              {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledBtn]}
              onPress={handleUpdatePassword}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Update password"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={19} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={onBackToLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Cancel & Return to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSaveSuccess={() => {
          setError('');
          setIsNetworkErr(false);
        }}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 4,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
    minHeight: 32,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    height: 50,
    marginTop: 8,
    ...shadows.button,
  },
  disabledBtn: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentHeader: {
    marginBottom: 4,
  },
  sentIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  otpSection: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  sentActions: {
    marginTop: 14,
    gap: 10,
  },
  softButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.control,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  linkBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: 14,
  },
  recoveryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
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
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  centerSub: {
    fontSize: 14,
    color: colors.muted,
  },
});
