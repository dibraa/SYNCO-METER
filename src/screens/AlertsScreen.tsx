import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { Screen, Section } from '../components/Screen';
import { getActiveAlerts } from '../utils/alerts';
import { colors, radii, spacing, ui } from '../theme/theme';

export const AlertsScreen = () => {
  const { nodes, totalPowerWatts, todaySavedKwh, setActiveTab, extendCutoff, prototypeAlerts } =
    useHems();
  const alerts = getActiveAlerts(nodes, totalPowerWatts, prototypeAlerts);

  return (
    <Screen
      title="Alerts"
      subtitle={`${alerts.length} active ${alerts.length === 1 ? 'notice' : 'notices'}`}
      headerRight={
        <View
          style={[
            styles.countPill,
            { backgroundColor: alerts.length > 0 ? colors.warningSoft : colors.successSoft },
          ]}
        >
          <Text
            style={[
              styles.countPillText,
              { color: alerts.length > 0 ? colors.warningText : colors.successText },
            ]}
          >
            {alerts.length > 0 ? `${alerts.length} Active` : 'All Clear'}
          </Text>
        </View>
      }
    >
      <Section title="Needs Attention">
        {alerts.length ? (
          alerts.map((alert) => {
            const isCutoff = alert.id.endsWith('-cutoff');
            const nodeId = isCutoff ? alert.id.replace('-cutoff', '') : null;
            const badgeBg = alert.urgent ? colors.dangerSoft : colors.warningSoft;
            const iconColor = alert.urgent ? colors.danger : colors.warningText;
            const iconName: keyof typeof MaterialCommunityIcons.glyphMap = alert.urgent
              ? 'alert-octagon-outline'
              : isCutoff
              ? 'timer-sand'
              : 'power-sleep';

            return (
              <View key={alert.id} style={ui.card}>
                <View style={styles.alertRow}>
                  <View style={[styles.iconBox, { backgroundColor: badgeBg }]}>
                    <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={ui.grow}>
                    <Text style={[styles.alertTitle, { color: alert.urgent ? colors.danger : colors.text }]}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {isCutoff && nodeId ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => extendCutoff(nodeId, 30)}
                      style={({ pressed }) => [styles.amberAction, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={styles.amberActionText}>Keep on 30m</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setActiveTab('appliances')}
                    style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.primaryActionText}>Manage plugs</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={16}
                      color={colors.primaryText}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.clearCard}>
            <View style={styles.clearIcon}>
              <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.success} />
            </View>
            <Text style={ui.heading}>All systems clear</Text>
            <Text style={ui.muted}>No overloads or standby notices detected right now.</Text>
          </View>
        )}
      </Section>

      <Section title="Standby Reduction">
        <View style={styles.savingsCard}>
          <View style={styles.savingsIcon}>
            <MaterialCommunityIcons name="leaf" size={22} color={colors.success} />
          </View>
          <View style={ui.grow}>
            <Text style={styles.savingsValue}>{todaySavedKwh.toFixed(2)} kWh saved today</Text>
            <Text style={styles.savingsNote}>
              Illustrative standby reduction estimate from automated room cutoffs.
            </Text>
          </View>
        </View>
      </Section>
    </Screen>
  );
};

const styles = StyleSheet.create({
  countPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  amberAction: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amberActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warningText,
  },
  primaryAction: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  clearCard: {
    ...ui.card,
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  clearIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  savingsCard: {
    ...ui.card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderColor: '#BBF7D0',
  },
  savingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.successText,
    fontVariant: ['tabular-nums'],
  },
  savingsNote: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
