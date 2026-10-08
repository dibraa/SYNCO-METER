import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';

export const AlertsScreen: React.FC = () => {
  const { nodes, totalPowerWatts, setActiveTab } = useHems();

  const node1 = nodes[0];
  const node2 = nodes[1];

  const alerts: Array<{
    id: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    time: string;
    type: 'warning' | 'info' | 'success';
  }> = [];

  // Overload alert
  if (totalPowerWatts > 2500) {
    alerts.push({
      id: 'overload',
      icon: 'alert-decagram',
      iconColor: '#EF4444',
      iconBg: 'rgba(239, 68, 68, 0.08)',
      title: 'High Consumption Warning',
      description: `Current load ${totalPowerWatts}W exceeds recommended threshold. Consider turning off non-essential appliances.`,
      time: 'Now',
      type: 'warning',
    });
  }

  // Auto-cutoff pending
  if (node2.cutoffPending) {
    alerts.push({
      id: 'cutoff',
      icon: 'clock-outline',
      iconColor: '#EA580C',
      iconBg: '#FFEDD5',
      title: 'Auto-Cutoff Pending',
      description: `Room 2 will power off in ${Math.ceil(node2.cutoffCountdownSeconds / 60)} minutes due to no occupancy detected.`,
      time: 'Active',
      type: 'info',
    });
  }

  // Standby bleed
  if (node1.standbyBleedWatts && node1.standbyBleedWatts > 0) {
    alerts.push({
      id: 'standby',
      icon: 'power-sleep',
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
      title: 'Standby Power Detected',
      description: `Room 1 is drawing ${node1.standbyBleedWatts}W in standby mode. Tighten cutoff threshold to save energy.`,
      time: 'Ongoing',
      type: 'info',
    });
  }

  // Success: energy saved
  alerts.push({
    id: 'saved',
    icon: 'leaf',
    iconColor: '#00C853',
    iconBg: '#E8F5E9',
    title: 'Energy Saved Today',
    description: `Auto-cutoff has prevented standby waste. You're consuming less than usual.`,
    time: 'Today',
    type: 'success',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>{alerts.length} active</Text>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color="#00C853" />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySub}>No active alerts. Your system is running efficiently.</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={[styles.alertIconWrap, { backgroundColor: alert.iconBg }]}>
                <MaterialCommunityIcons name={alert.icon} size={20} color={alert.iconColor} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
                <Text style={styles.alertDescription}>{alert.description}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  alertTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  alertDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});
