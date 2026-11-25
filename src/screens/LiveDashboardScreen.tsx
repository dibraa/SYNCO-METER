import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { Screen, Section } from '../components/Screen';
import { SmartHomeHero } from '../components/SmartHomeHero';
import { EnergyAreaChart } from '../components/EnergyAreaChart';
import { TopConsumersCard } from '../components/TopConsumersCard';
import { RoomSummary, countdownLabel } from '../components/RoomSummary';
import { RadialGauge } from '../components/RadialGauge';
import { colors, spacing, ui } from '../theme/theme';
import { combineHourly, formatCost } from '../utils/consumption';

export const LiveDashboardScreen = () => {
  const {
    nodes,
    consumptionRooms,
    report,
    totalPowerWatts,
    totalCurrentAmps,
    averageVoltage,
    averagePowerFactor,
    todaySavedKwh,
    toggleNodeRelay,
    extendCutoff,
    setActiveTab,
    isSupabaseConnected,
    isHardwareTelemetryActive,
  } = useHems();

  const today = consumptionRooms.reduce((sum, room) => sum + room.todayKwh, 0);
  const todayCostFormatted = formatCost(today, report.tariffPerKwh);
  const combinedHours = useMemo(() => combineHourly(consumptionRooms), [consumptionRooms]);

  const node1 = nodes[0];
  const node2 = nodes[1];
  const isLive = isSupabaseConnected && isHardwareTelemetryActive;

  const consumerItems = useMemo(
    () =>
      nodes.map((node, index) => ({
        id: node.id,
        name: node.name,
        location: node.location,
        kwh: consumptionRooms.find((r) => r.roomId === node.id)?.todayKwh ?? node.todayKwh,
        activePowerWatts: node.activePowerWatts,
        relayState: node.relayState,
        icon: (index === 0 ? 'sofa-outline' : 'bed-outline') as keyof typeof MaterialCommunityIcons.glyphMap,
      })),
    [nodes, consumptionRooms]
  );

  return (
    <Screen immersive>
      {/* Immersive Electric-Sky Smart Home Hero */}
      <SmartHomeHero
        totalPowerWatts={totalPowerWatts}
        todayKwh={today}
        savedKwh={todaySavedKwh}
        nodes={nodes}
        isLive={isLive}
        onStatusPress={() => setActiveTab('usage')}
      />

      <View style={styles.body}>
        {/* 2x2 Quick Status Metric Grid (Inspo Screen 1) */}
        <View style={styles.tileGrid}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveTab('usage')}
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.primary} />
            </View>
            <View style={ui.grow}>
              <Text style={styles.tileTitle} numberOfLines={1}>
                Electricity
              </Text>
              <Text style={styles.tileMeta} numberOfLines={1}>
                {totalPowerWatts.toLocaleString()}W · {averageVoltage.toFixed(0)}V
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveTab('usage')}
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.successSoft }]}>
              <MaterialCommunityIcons name="leaf" size={20} color={colors.success} />
            </View>
            <View style={ui.grow}>
              <Text style={styles.tileTitle} numberOfLines={1}>
                Est. Cost
              </Text>
              <Text style={styles.tileMeta} numberOfLines={1}>
                {todayCostFormatted} · Today
              </Text>
            </View>
          </Pressable>

          {node1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab('appliances')}
              style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: colors.primarySoft }]}>
                <MaterialCommunityIcons name="sofa-outline" size={20} color={colors.primaryText} />
              </View>
              <View style={ui.grow}>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {node1.name}
                </Text>
                <Text style={styles.tileMeta} numberOfLines={1}>
                  {node1.relayState ? `${node1.activePowerWatts}W · ${node1.occupancy}` : 'Off'}
                </Text>
              </View>
            </Pressable>
          ) : null}

          {node2 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab('appliances')}
              style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.tileIconWrap,
                  {
                    backgroundColor: node2.cutoffPending
                      ? colors.warningSoft
                      : colors.surfaceMuted,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={node2.cutoffPending ? 'timer-sand' : 'bed-outline'}
                  size={20}
                  color={node2.cutoffPending ? colors.warningText : colors.textSecondary}
                />
              </View>
              <View style={ui.grow}>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {node2.name}
                </Text>
                <Text
                  style={[
                    styles.tileMeta,
                    node2.cutoffPending && { color: colors.warningText, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {node2.cutoffPending
                    ? `Off in ${countdownLabel(node2.cutoffCountdownSeconds)}`
                    : node2.relayState
                    ? `${node2.activePowerWatts}W · On`
                    : 'Off'}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        {/* Electricity Total Smooth Area Chart */}
        <Section title="Electricity Total" pill={todayCostFormatted}>
          <EnergyAreaChart
            data={combinedHours}
            usedKwh={today}
            savedKwh={todaySavedKwh}
            tariffPerKwh={report.tariffPerKwh}
            compact
          />
        </Section>

        {/* Top Consumers Ranked Card */}
        <Section title="Top Consumers" actionLabel="View usage" onAction={() => setActiveTab('usage')}>
          <TopConsumersCard
            items={consumerItems}
            tariffPerKwh={report.tariffPerKwh}
            ctaLabel="Manage all plugs"
            onCtaPress={() => setActiveTab('appliances')}
          />
        </Section>

        {/* Quick Room Controls (Retains direct relay toggle & 30m extend on Home) */}
        <Section title="Room Controls">
          {nodes.map((node) => (
            <RoomSummary
              key={node.id}
              node={node}
              onToggle={() => toggleNodeRelay(node.id)}
              onExtend={() => extendCutoff(node.id, 30)}
            />
          ))}
          {!nodes.length && <Text style={ui.muted}>No rooms added yet.</Text>}
        </Section>

        {/* Live Meter Gauge Card */}
        <Section title="Live Meter" pill={`${totalPowerWatts.toLocaleString()} W`}>
          <View style={ui.card}>
            <RadialGauge
              watts={totalPowerWatts}
              maxWatts={3000}
              voltage={averageVoltage}
              current={totalCurrentAmps}
              powerFactor={averagePowerFactor}
              isLive={isLive}
            />
          </View>
        </Section>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    marginTop: -22,
    gap: spacing.xl,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTile: {
    ...ui.tile,
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 62,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  tileMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.82,
  },
});
