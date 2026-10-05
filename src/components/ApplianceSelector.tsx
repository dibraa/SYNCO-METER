import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppliancePreset } from '../types/telemetry';
import { APPLIANCE_PROFILES } from '../mock/telemetryGenerator';

interface ApplianceSelectorProps {
  currentPreset: AppliancePreset;
  onSelectPreset: (preset: AppliancePreset) => void;
  disabled?: boolean;
}

export const ApplianceSelector: React.FC<ApplianceSelectorProps> = ({
  currentPreset,
  onSelectPreset,
  disabled = false,
}) => {
  const presets = Object.keys(APPLIANCE_PROFILES) as AppliancePreset[];

  const getIconName = (preset: AppliancePreset): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (preset) {
      case 'STANDBY':
        return 'power-sleep';
      case 'REFRIGERATOR':
        return 'fridge-outline';
      case 'AIR_CONDITIONER':
        return 'air-conditioner';
      case 'INDUCTION_COOKER':
        return 'stove';
      case 'WATER_HEATER':
        return 'water-boiler';
      case 'OVERLOAD_SPIKE':
        return 'flash-alert';
      default:
        return 'lightning-bolt';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="chip" size={18} color="#38BDF8" />
          <Text style={styles.title}>LOAD SIMULATION PROFILE</Text>
        </View>
        <Text style={styles.badgeText}>Stage 1: Mock Engine</Text>
      </View>

      <Text style={styles.subtitle}>
        Select an appliance scenario to simulate real-time PZEM-004T load behavior:
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
        {presets.map((presetKey) => {
          const profile = APPLIANCE_PROFILES[presetKey];
          const isSelected = currentPreset === presetKey;
          const isSpike = presetKey === 'OVERLOAD_SPIKE';

          return (
            <TouchableOpacity
              key={presetKey}
              style={[
                styles.chip,
                isSelected && (isSpike ? styles.chipSpikeSelected : styles.chipSelected),
                disabled && styles.chipDisabled,
              ]}
              onPress={() => onSelectPreset(presetKey)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={getIconName(presetKey)}
                size={18}
                color={
                  isSelected
                    ? isSpike
                      ? '#EF4444'
                      : '#38BDF8'
                    : '#94A3B8'
                }
              />
              <View>
                <Text
                  style={[
                    styles.chipTitle,
                    isSelected && (isSpike ? styles.chipTitleSpike : styles.chipTitleActive),
                  ]}
                >
                  {profile.name}
                </Text>
                <Text style={styles.chipAmp}>~{profile.baseCurrent}A</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  scrollList: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  chipSpikeSelected: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  chipTitleActive: {
    color: '#38BDF8',
  },
  chipTitleSpike: {
    color: '#F87171',
  },
  chipAmp: {
    fontSize: 10,
    color: '#64748B',
  },
});
