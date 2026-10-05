import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTelemetry } from '../context/TelemetryContext';

interface SupabaseConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    sourceMode,
    setSourceMode,
    supabaseConfig,
    updateSupabaseConfig,
    tariffRate,
    setTariffRate,
    overloadLimitWatts,
    setOverloadLimitWatts,
    currencySymbol,
  } = useTelemetry();

  const [url, setUrl] = useState(supabaseConfig.url);
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey);
  const [deviceId, setDeviceId] = useState(supabaseConfig.deviceId);
  const [tariff, setTariff] = useState(tariffRate.toString());
  const [overload, setOverload] = useState(overloadLimitWatts.toString());

  const handleSave = async () => {
    const numTariff = parseFloat(tariff) || 12.0;
    const numOverload = parseFloat(overload) || 3000;

    setTariffRate(numTariff);
    setOverloadLimitWatts(numOverload);

    await updateSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      deviceId: deviceId.trim(),
    });

    Alert.alert('Settings Saved', 'Telemetry and Cloud configuration updated successfully.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="cog" size={24} color="#38BDF8" />
              <Text style={styles.title}>SYSTEM & CLOUD CONFIG</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Mode Switcher */}
            <Text style={styles.sectionTitle}>DATA SOURCE MODE</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  sourceMode === 'MOCK' && styles.modeButtonActive,
                ]}
                onPress={() => setSourceMode('MOCK')}
              >
                <MaterialCommunityIcons
                  name="cpu-64-bit"
                  size={20}
                  color={sourceMode === 'MOCK' ? '#38BDF8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    sourceMode === 'MOCK' && styles.modeButtonTextActive,
                  ]}
                >
                  Mock Generator
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  sourceMode === 'SUPABASE' && styles.modeButtonActive,
                ]}
                onPress={() => {
                  if (!url && !supabaseConfig.url) {
                    Alert.alert(
                      'Supabase URL Missing',
                      'Please configure your Supabase URL & Anon Key below first.'
                    );
                    return;
                  }
                  setSourceMode('SUPABASE');
                }}
              >
                <MaterialCommunityIcons
                  name="cloud-sync"
                  size={20}
                  color={sourceMode === 'SUPABASE' ? '#34D399' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    sourceMode === 'SUPABASE' && styles.modeButtonTextActive,
                  ]}
                >
                  Supabase Live
                </Text>
              </TouchableOpacity>
            </View>

            {/* Supabase Cloud Settings */}
            <Text style={styles.sectionTitle}>SUPABASE CREDENTIALS</Text>
            <Text style={styles.fieldLabel}>Project URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://xyzcompany.supabase.co"
              placeholderTextColor="#475569"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Anon Public API Key</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              placeholderTextColor="#475569"
              value={anonKey}
              onChangeText={setAnonKey}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Target Device ID</Text>
            <TextInput
              style={styles.input}
              placeholder="ESP32-PZEM-DEV-01"
              placeholderTextColor="#475569"
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="none"
            />

            {/* Smart Meter Parameters */}
            <Text style={styles.sectionTitle}>METER PARAMETERS</Text>
            <View style={styles.paramRow}>
              <View style={styles.paramCol}>
                <Text style={styles.fieldLabel}>Tariff ({currencySymbol}/kWh)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12.00"
                  placeholderTextColor="#475569"
                  value={tariff}
                  onChangeText={setTariff}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.paramCol}>
                <Text style={styles.fieldLabel}>Overload Limit (W)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3000"
                  placeholderTextColor="#475569"
                  value={overload}
                  onChangeText={setOverload}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialCommunityIcons name="content-save-check" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>SAVE CONFIGURATION</Text>
            </TouchableOpacity>
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
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeButtonTextActive: {
    color: '#F8FAFC',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 6,
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
  paramRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paramCol: {
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 30,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
