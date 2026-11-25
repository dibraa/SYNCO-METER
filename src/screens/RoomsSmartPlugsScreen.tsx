import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { SystemMode } from '../types/hems';
import { Screen, Section, SettingRow } from '../components/Screen';
import { RoomSummary } from '../components/RoomSummary';
import { colors, radii, spacing, ui } from '../theme/theme';

const MODES: { id: SystemMode; label: string; hint: string }[] = [
  { id: 'Auto', label: 'Auto', hint: 'Cuts vacant plugs automatically' },
  { id: 'Eco', label: 'Eco', hint: 'Tighter standby thresholds' },
  { id: 'Manual', label: 'Manual', hint: 'Full manual relay control' },
];

export const RoomsSmartPlugsScreen = () => {
  const {
    nodes,
    totalPowerWatts,
    toggleNodeRelay,
    extendCutoff,
    systemMode,
    setSystemMode,
  } = useHems();

  const activeCount = nodes.filter((node) => node.relayState).length;
  const activeModeObj = MODES.find((m) => m.id === systemMode) ?? MODES[0];

  return (
    <Screen
      title="Smart Plugs"
      subtitle="Live load & room relay controls"
      headerRight={
        <View style={ui.pill}>
          <Text style={ui.pillText}>{totalPowerWatts.toLocaleString()} W</Text>
        </View>
      }
    >
      {/* Active Load & System Mode Card */}
      <View style={ui.card}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}>
            <MaterialCommunityIcons name="power-plug-outline" size={22} color={colors.primary} />
          </View>
          <View style={ui.grow}>
            <Text style={styles.summaryTitle}>
              {activeCount} of {nodes.length} plugs active
            </Text>
            <Text style={ui.muted}>{activeModeObj.hint}</Text>
          </View>
        </View>

        <View style={styles.modeTrack}>
          {MODES.map((mode) => {
            const selected = systemMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                aria-selected={selected}
                onPress={() => setSystemMode(mode.id)}
                style={[styles.modeBtn, selected && styles.modeBtnActive]}
              >
                <Text style={[styles.modeText, selected && styles.modeTextActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Connected Rooms */}
      <Section title="Connected Rooms">
        {nodes.map((node) => (
          <RoomSummary
            key={node.id}
            node={node}
            detailed
            onToggle={() => toggleNodeRelay(node.id)}
            onExtend={() => extendCutoff(node.id, 30)}
          />
        ))}
        {!nodes.length && <Text style={ui.muted}>No rooms added yet.</Text>}
      </Section>

      {/* Automation Settings */}
      <View style={ui.card}>
        <SettingRow
          label="Automation schedules"
          value="Vacancy timers & overnight cutoffs"
          icon="clock-check-outline"
          unavailable
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modeTrack: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    padding: 3,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: colors.surface,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  modeTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
});
