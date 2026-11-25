import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  loadSavedSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  restoreDefaultSupabaseConfig,
  hasDefaultEnvSupabaseConfig,
  normalizeSupabaseUrl,
  testSupabaseConnection,
  getLoadedConfig,
  isSupabaseConfigured,
  SupabaseConfig,
} from '../services/supabaseClient';
import { colors, radii, shadows } from '../theme/theme';

interface SupabaseConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSuccess?: (config: SupabaseConfig) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  visible,
  onClose,
  onSaveSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [deviceId, setDeviceId] = useState('ESP32-PZEM-DEV-01');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const cfg = getLoadedConfig();
      setUrl(cfg.url || '');
      setAnonKey(cfg.anonKey || '');
      setDeviceId(cfg.deviceId || 'ESP32-PZEM-DEV-01');
      setTestResult(null);

      loadSavedSupabaseConfig().then((fresh) => {
        setUrl(fresh.url || '');
        setAnonKey(fresh.anonKey || '');
        setDeviceId(fresh.deviceId || 'ESP32-PZEM-DEV-01');
      });
    }
  }, [visible]);

  const handleTestConnection = async () => {
    const normalized = normalizeSupabaseUrl(url);
    if (normalized !== url) {
      setUrl(normalized);
    }

    if (!normalized || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both the Supabase Project URL and Publishable / Anon API key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(normalized, anonKey.trim());
    setIsTesting(false);
    if (result.normalizedUrl && result.normalizedUrl !== url) {
      setUrl(result.normalizedUrl);
    }
    setTestResult({ success: result.success, message: result.message });
  };

  const handleSave = async () => {
    const normalized = normalizeSupabaseUrl(url);
    setUrl(normalized);

    if (normalized && !normalized.startsWith('https://') && !normalized.startsWith('http://')) {
      setTestResult({
        success: false,
        message: 'Server URL must start with https:// (e.g. https://<project-ref>.supabase.co)',
      });
      return;
    }

    setIsSaving(true);
    const newConfig: SupabaseConfig = {
      url: normalized,
      anonKey: anonKey.trim(),
      deviceId: deviceId.trim() || 'ESP32-PZEM-DEV-01',
    };

    const success = await saveSupabaseConfig(newConfig);
    setIsSaving(false);

    if (success) {
      if (onSaveSuccess) {
        onSaveSuccess(newConfig);
      }
      Alert.alert(
        'Connection saved',
        newConfig.url
          ? 'Connection settings saved successfully.'
          : 'Credentials cleared. The app will run in local demo mode.'
      );
      onClose();
    } else {
      Alert.alert('Error', 'Failed to save configuration to local storage.');
    }
  };

  const handleRestoreDefaults = async () => {
    const restored = await restoreDefaultSupabaseConfig();
    setUrl(restored.url);
    setAnonKey(restored.anonKey);
    setDeviceId(restored.deviceId);
    setTestResult({
      success: true,
      message: 'Restored default project settings from .env. Tap Test to verify.',
    });
    if (onSaveSuccess) {
      onSaveSuccess(restored);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Switch to Demo Mode',
      'Clear saved credentials and run in offline demo mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Demo Mode',
          style: 'destructive',
          onPress: async () => {
            await clearSupabaseConfig();
            const cleared = getLoadedConfig();
            setUrl('');
            setAnonKey('');
            setDeviceId(cleared.deviceId);
            setTestResult(null);
            if (onSaveSuccess) {
              onSaveSuccess(cleared);
            }
          },
        },
      ]
    );
  };

  const isConfigured = isSupabaseConfigured();
  const hasDefaults = hasDefaultEnvSupabaseConfig();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons
                  name="cloud-sync-outline"
                  size={22}
                  color={colors.primaryText}
                />
              </View>
              <View>
                <Text style={styles.title}>Connection Settings</Text>
                <Text style={styles.subtitle}>Supabase IoT Telemetry & Auth</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close settings"
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Status Box */}
            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: isConfigured ? colors.greenSoft : colors.primaryTint,
                  borderColor: isConfigured ? '#BBF7D0' : colors.primarySoft,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConfigured ? colors.success : colors.primary },
                ]}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  {isConfigured ? 'Cloud Configured' : 'Offline / Demo Simulation'}
                </Text>
                <Text style={styles.statusHelp}>
                  {isConfigured
                    ? 'Tap Test below to verify live Auth and database reachability.'
                    : 'Enter your Supabase project URL and publishable/anon key to connect.'}
                </Text>
              </View>
            </View>

            {/* Server URL */}
            <Text style={styles.fieldLabel}>Supabase Project URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-project-ref.supabase.co"
              placeholderTextColor={colors.subtle}
              value={url}
              onChangeText={(t) => {
                setUrl(t);
                if (testResult) setTestResult(null);
              }}
              onBlur={() => {
                const norm = normalizeSupabaseUrl(url);
                if (norm !== url) setUrl(norm);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              API URL (https://&lt;ref&gt;.supabase.co) — dashboard links auto-convert
            </Text>

            {/* Publishable / Anon Key */}
            <Text style={styles.fieldLabel}>Publishable / Anon API Key</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="sb_publishable_... or eyJhbGciOi..."
              placeholderTextColor={colors.subtle}
              value={anonKey}
              onChangeText={(t) => {
                setAnonKey(t);
                if (testResult) setTestResult(null);
              }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Supabase Project Settings → API Keys (Publishable or legacy Anon key)
            </Text>

            {/* Target Device ID */}
            <Text style={styles.fieldLabel}>Target Smart Meter ID</Text>
            <TextInput
              style={styles.input}
              placeholder="ESP32-PZEM-DEV-01"
              placeholderTextColor={colors.subtle}
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>Matches device_id_str in your public.devices table</Text>

            {/* Test Result Banner */}
            {testResult ? (
              <View
                style={[
                  styles.testBanner,
                  testResult.success ? styles.testSuccess : styles.testFailure,
                ]}
              >
                <MaterialCommunityIcons
                  name={testResult.success ? 'check-circle' : 'alert-circle'}
                  size={18}
                  color={testResult.success ? colors.success : colors.danger}
                />
                <Text
                  style={[
                    styles.testText,
                    { color: testResult.success ? colors.successText : colors.danger },
                  ]}
                >
                  {testResult.message}
                </Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={17}
                      color={colors.primaryText}
                    />
                    <Text style={styles.testBtnText}>Test</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save & Connect</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Secondary Reset Actions */}
            <View style={styles.secondaryActions}>
              {hasDefaults ? (
                <TouchableOpacity style={styles.resetBtn} onPress={handleRestoreDefaults}>
                  <MaterialCommunityIcons
                    name="restore"
                    size={16}
                    color={colors.primaryText}
                  />
                  <Text style={[styles.resetBtnText, { color: colors.primaryText }]}>
                    Restore project default (.env)
                  </Text>
                </TouchableOpacity>
              ) : null}

              {Boolean(url || anonKey) ? (
                <TouchableOpacity style={styles.resetBtn} onPress={handleClear}>
                  <MaterialCommunityIcons name="cloud-off-outline" size={16} color={colors.muted} />
                  <Text style={styles.resetBtnText}>Switch to offline demo mode</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  statusHelp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.canvas,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  inputMultiline: {
    height: 76,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radii.control,
    marginTop: 14,
  },
  testSuccess: {
    backgroundColor: colors.successSoft,
  },
  testFailure: {
    backgroundColor: colors.dangerSoft,
  },
  testText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  testBtn: {
    flex: 0.85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    minHeight: 48,
    borderRadius: radii.control,
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  saveBtn: {
    flex: 1.35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    minHeight: 48,
    borderRadius: radii.control,
    ...shadows.button,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActions: {
    marginTop: 12,
    gap: 4,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 38,
  },
  resetBtnText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
});
