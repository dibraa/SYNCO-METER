import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, ui } from '../theme/theme';

export function DemoAuthForm({ signup = false, onSuccess, onSwitch }: { signup?: boolean; onSuccess: () => void; onSwitch: () => void }) {
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const inputs = useRef<Partial<Record<keyof typeof values, TextInput | null>>>({});
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const fields: { key: keyof typeof values; label: string; placeholder: string; secret?: boolean }[] = [
    ...(signup ? [{ key: 'name' as const, label: 'Full name', placeholder: 'Your name' }] : []),
    { key: 'email', label: 'Email address', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', placeholder: signup ? 'At least 6 characters' : 'Enter your password', secret: true },
    ...(signup ? [{ key: 'confirm' as const, label: 'Confirm password', placeholder: 'Repeat your password', secret: true }] : []),
  ];
  const submit = () => {
    if (busy.current) return;
    const next: Record<string, string> = {};
    if (signup && !values.name.trim()) next.name = 'Name is required';
    if (!values.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter a valid email address';
    if (!values.password) next.password = 'Password is required';
    else if (values.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (signup && !values.confirm) next.confirm = 'Please confirm your password';
    else if (signup && values.confirm !== values.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) {
      inputs.current[fields.find(field => next[field.key])!.key]?.focus();
      return;
    }
    busy.current = true;
    setLoading(true);
    timer.current = setTimeout(onSuccess, 800);
  };
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <Image
          source={require('../../assets/LOGO.jpg')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="SYNCO METER Logo"
        />
      </View>
      <View style={styles.intro}><Text style={styles.title} accessibilityRole="header">{signup ? 'Try the demo' : 'Welcome back'}</Text><Text style={ui.body}>See your energy use. Stay in control.</Text></View>
      <View style={styles.demo}><Text style={styles.demoText}>Demo access only. No account is created or verified. Use sample details.</Text></View>
      <View style={styles.form}>
        {fields.map((field, index) => <View key={field.key} style={styles.field}>
          <Text style={ui.label}>{field.label}</Text>
          <View style={[styles.inputRow, errors[field.key] ? styles.invalid : undefined]}>
            <TextInput ref={input => { inputs.current[field.key] = input; }} style={styles.input} accessibilityLabel={field.label} placeholder={field.placeholder}
              placeholderTextColor={colors.muted} value={values[field.key]} editable={!loading}
              onChangeText={text => { setValues(previous => ({ ...previous, [field.key]: text })); setErrors(previous => ({ ...previous, [field.key]: '' })); }}
              secureTextEntry={field.secret && !visible} autoCapitalize={field.key === 'name' ? 'words' : 'none'} autoCorrect={false}
              keyboardType={field.key === 'email' ? 'email-address' : 'default'}
              textContentType={field.key === 'email' ? 'emailAddress' : field.key === 'name' ? 'name' : signup ? 'newPassword' : 'password'}
              returnKeyType={index === fields.length - 1 ? 'go' : 'next'}
              onSubmitEditing={() => index === fields.length - 1 ? submit() : inputs.current[fields[index + 1].key]?.focus()} />
            {field.key === 'password' && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={styles.eye}><MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} color={colors.muted} size={20} /></Pressable>}
          </View>
          {!!errors[field.key] && <Text style={styles.error} accessibilityRole="alert">{errors[field.key]}</Text>}
        </View>)}
        {!signup && <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Forgot password. Coming soon" style={styles.unavailable}><Text style={ui.muted}>Forgot password?</Text><Text style={styles.coming}>Coming soon</Text></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={signup ? 'Create demo account' : 'Sign in'} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={submit} style={[ui.action, loading && { opacity: 0.7 }]}>
          {loading ? <View style={ui.row}><ActivityIndicator color="#FFFFFF" /><Text style={ui.actionText}>Opening demo…</Text></View> : <Text style={ui.actionText}>{signup ? 'Create demo account' : 'Sign in'}</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={signup ? 'Back to sign in' : 'Sign up'} disabled={loading} onPress={onSwitch} style={styles.switch}><Text style={styles.link}>{signup ? 'Back to sign in' : 'New here? Sign up'}</Text></Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, padding: 24, paddingVertical: 32, gap: 24, justifyContent: 'center' },
  brand: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logoImage: { width: 140, height: 140, borderRadius: 20 },
  brandText: { color: colors.text, fontSize: 17, fontWeight: '800' },
  intro: { gap: 8 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },
  demo: { padding: 12, backgroundColor: colors.greenSoft, borderRadius: 10 },
  demoText: { color: colors.green, fontSize: 13, lineHeight: 19 },
  form: { gap: 16 },
  field: { gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, minWidth: 0, minHeight: 52, padding: 14, fontSize: 16, color: colors.text },
  invalid: { borderColor: colors.danger },
  eye: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, color: colors.danger },
  unavailable: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  coming: { color: colors.muted, backgroundColor: colors.neutral, padding: 6, borderRadius: 6, fontSize: 11 },
  switch: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 8 },
  link: { fontSize: 15, color: colors.green, fontWeight: '600' },
});
