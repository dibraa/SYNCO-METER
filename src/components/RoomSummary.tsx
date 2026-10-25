import React from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { SmartNode } from '../types/hems';
import { Disclosure } from './Screen';
import { colors, ui } from '../theme/theme';

export const countdownLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function RoomSummary({ node, detailed = false, onToggle, onExtend }: {
  node: SmartNode; detailed?: boolean; onToggle: () => void; onExtend: () => void;
}) {
  return <View style={ui.card}>
    <View style={ui.row}>
      <View style={ui.grow}>
        <Text style={ui.heading}>{node.name}</Text>
        <Text style={ui.muted}>{node.location}</Text>
      </View>
      <Switch hitSlop={12} value={node.relayState} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.green }} thumbColor="#FFFFFF"
        accessibilityLabel={`${node.name} power`} />
    </View>
    <View style={styles.status}>
      <Text style={styles.watts}>{node.relayState ? node.activePowerWatts : 0} W</Text>
      <Text style={ui.muted}>{node.relayState ? 'On' : 'Off'} · {node.occupancy}{!node.isOnline ? ' · Offline' : ''}</Text>
    </View>
    {node.cutoffPending && <View style={styles.warning}>
      <Text style={styles.warningText}>Turns off in {countdownLabel(node.cutoffCountdownSeconds)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Keep ${node.name} on for 30 minutes`} onPress={onExtend} style={styles.extend}>
        <Text style={styles.extendText}>Keep on for 30 minutes</Text>
      </Pressable>
    </View>}
    {detailed && <Disclosure title={`${node.name} details`}>
      <Text style={ui.body}>Today: {node.todayKwh.toFixed(2)} kWh</Text>
      <Text style={ui.muted}>{node.voltage.toFixed(1)} V · {node.current.toFixed(2)} A · {node.frequency.toFixed(1)} Hz</Text>
      <Text style={ui.muted}>Power factor {node.powerFactor.toFixed(2)}</Text>
      <Text style={ui.muted}>{node.hardware} · {node.code}</Text>
    </Disclosure>}
  </View>;
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  watts: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'], color: colors.text },
  warning: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 8 },
  warningText: { color: colors.amber, fontSize: 14, fontWeight: '600' },
  extend: { minHeight: 44, padding: 10, backgroundColor: colors.amberSoft, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  extendText: { color: colors.amber, fontWeight: '600', fontSize: 14 },
});
