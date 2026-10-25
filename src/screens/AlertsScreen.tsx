import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useHems } from '../context/HemsContext';
import { Screen, Section } from '../components/Screen';
import { getActiveAlerts } from '../utils/alerts';
import { colors, ui } from '../theme/theme';

export const AlertsScreen = () => {
  const { nodes, totalPowerWatts, todaySavedKwh, setActiveTab } = useHems();
  const alerts = getActiveAlerts(nodes, totalPowerWatts);
  return <Screen title="Alerts" subtitle={`${alerts.length} active ${alerts.length === 1 ? 'notice' : 'notices'}`}>
    <Section title="Needs attention">
      {alerts.length ? alerts.map(alert => <View key={alert.id} style={ui.card}>
        <Text style={[ui.heading, { color: alert.urgent ? colors.danger : colors.amber }]}>{alert.title}</Text>
        <Text style={ui.body}>{alert.description}</Text>
        <Pressable accessibilityRole="button" onPress={() => setActiveTab('appliances')} style={styles.link}><Text style={styles.linkText}>Manage appliances →</Text></Pressable>
      </View>) : <View style={ui.card}><Text style={ui.heading}>All clear</Text><Text style={ui.muted}>No active notices for your rooms.</Text></View>}
    </Section>
    <Section title="Demo summary"><View style={ui.card}><Text style={ui.body}>{todaySavedKwh.toFixed(2)} kWh saved today</Text><Text style={ui.muted}>Illustrative standby savings, not a measured result.</Text></View></Section>
  </Screen>;
};
const styles = StyleSheet.create({ link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }, linkText: { fontSize: 14, color: colors.green, fontWeight: '600' } });
