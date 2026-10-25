import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useHems } from '../context/HemsContext';
import { Screen, Section } from '../components/Screen';
import { RoomSummary } from '../components/RoomSummary';
import { RadialGauge } from '../components/RadialGauge';
import { colors, ui } from '../theme/theme';
import { formatCost } from '../utils/consumption';

export const LiveDashboardScreen = () => {
  const { nodes, consumptionRooms, report, totalPowerWatts, totalCurrentAmps, averageVoltage,
    averagePowerFactor, toggleNodeRelay, extendCutoff, setActiveTab } = useHems();
  const today = consumptionRooms.reduce((sum, room) => sum + room.todayKwh, 0);
  return <Screen title="SYNCO METER" subtitle="Your home at a glance" brand>
    <View style={styles.today}>
      <Text style={ui.heading}>Today’s energy</Text>
      <View style={ui.wrap}>
        <View style={styles.metric}><Text style={styles.energy}>{today.toFixed(2)} <Text style={styles.unit}>kWh</Text></Text><Text style={ui.muted}>Consumed today</Text></View>
        <View style={styles.metric}><Text style={styles.cost}>{formatCost(today, report.tariffPerKwh)}</Text><Text style={ui.muted}>Estimated cost</Text></View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setActiveTab('usage')} style={styles.link}><Text style={styles.linkText}>View usage →</Text></Pressable>
    </View>
    <Section title="Your rooms">
      {nodes.map(node => <RoomSummary key={node.id} node={node} onToggle={() => toggleNodeRelay(node.id)} onExtend={() => extendCutoff(node.id, 30)} />)}
      {!nodes.length && <Text style={ui.muted}>No rooms added yet.</Text>}
    </Section>
    <View style={ui.card}>
      <RadialGauge watts={totalPowerWatts} maxWatts={3000} voltage={averageVoltage} current={totalCurrentAmps} powerFactor={averagePowerFactor} />
    </View>
  </Screen>;
};
const styles = StyleSheet.create({
  today: { ...ui.card, backgroundColor: colors.greenSoft, borderColor: '#CCDFD1' },
  metric: { flex: 1, minWidth: 130, gap: 4 },
  energy: { fontSize: 34, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 16, fontWeight: '500' },
  cost: { fontSize: 28, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { color: colors.green, fontSize: 15, fontWeight: '600' },
});

