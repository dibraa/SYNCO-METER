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
  testSupabaseConnection,
  getLoadedConfig,
  isSupabaseConfigured,
  SupabaseConfig,
} from '../services/supabaseClient';

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

      // Refresh from storage in case it changed externally
      loadSavedSupabaseConfig().then((fresh) => {
        setUrl(fresh.url || '');
        setAnonKey(fresh.anonKey || '');
        setDeviceId(fresh.deviceId || 'ESP32-PZEM-DEV-01');
      });
    }
  }, [visible]);

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both the server URL and public API key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newConfig: SupabaseConfig = {
      url: url.trim(),
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

  const handleClear = () => {
    Alert.alert(
      'Reset Credentials',
      'Are you sure you want to clear saved connection settings? The app will revert to demo simulation mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearSupabaseConfig();
            setUrl('');
            setAnonKey('');
            setDeviceId('ESP32-PZEM-DEV-01');
            setTestResult(null);
            Alert.alert('Reset', 'Connection settings have been reset.');
          },
        },
      ]
    );
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={24} color="#34D399" />
              <View>
                <Text style={styles.title}>CONNECTION SETTINGS</Text>
                <Text style={styles.subtitle}>Connect IoT Telemetry & Authentication</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close settings">
              <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Status Pill */}
            <View style={styles.statusBox}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConfigured ? '#34D399' : '#F59E0B' },
                ]}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  {isConfigured ? 'Status: Connected' : 'Status: Offline / Demo Simulation'}
                </Text>
                <Text style={styles.statusHelp}>
                  {isConfigured
                    ? 'App is streaming live telemetry and syncing auth.'
                    : 'Enter your server URL and public API key to connect.'}
                </Text>
              </View>
            </View>

            {/* Supabase URL */}
            <Text style={styles.fieldLabel}>Server URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-server.example.com"
              placeholderTextColor="#64748B"
              value={url}
              onChangeText={(t) => {
                setUrl(t);
                if (testResult) setTestResult(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Enter the server URL provided by your administrator.
            </Text>

            {/* Supabase Anon Key */}
            <Text style={styles.fieldLabel}>Anon Public API Key</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              placeholderTextColor="#64748B"
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
              Enter the public API key provided by your administrator.
            </Text>

            {/* Target Device ID */}
            <Text style={styles.fieldLabel}>Target Device ID (PZEM Smart Plug)</Text>
            <TextInput
              style={styles.input}
              placeholder="ESP32-PZEM-DEV-01"
              placeholderTextColor="#64748B"
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              Must match the device_id_str in your public.devices table
            </Text>

            {/* Test Result Banner */}
            {testResult && (
              <View
                style={[
                  styles.testBanner,
                  testResult.success ? styles.testSuccess : styles.testFailure,
                ]}
              >
                <MaterialCommunityIcons
                  name={testResult.success ? 'check-circle' : 'alert-circle'}
                  size={20}
                  color={testResult.success ? '#34D399' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.testText,
                    { color: testResult.success ? '#34D399' : '#EF4444' },
                  ]}
                >
                  {testResult.message}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#38BDF8" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="lightning-bolt" size={18} color="#38BDF8" />
                    <Text style={styles.testBtnText}>TEST CONNECTION</Text>
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
                    <MaterialCommunityIcons name="content-save-check" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>SAVE & CONNECT</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Reset button */}
            {Boolean(url || anonKey) && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleClear}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#94A3B8" />
                <Text style={styles.resetBtnText}>Clear credentials (Use offline demo)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
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
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusHelp: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  inputMultiline: {
    height: 70,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 4,
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  testSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  testFailure: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  testText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#177245',
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
