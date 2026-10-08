import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { RadialGauge } from '../components/RadialGauge';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { PressableScale } from '../components/PressableScale';
import { SystemMode } from '../types/hems';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const LiveDashboardScreen: React.FC = () => {
  const {
    nodes,
    toggleNodeRelay,
    totalPowerWatts,
    totalCurrentAmps,
    averageVoltage,
    averagePowerFactor,
    todayTotalKwh,
    todayEstimatedCost,
    todaySavedKwh,
    systemMode,
    setSystemMode,
    setActiveTab,
  } = useHems();

  const node1 = nodes[0];
  const node2 = nodes[1];

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modes: SystemMode[] = ['Auto', 'Eco', 'Manual'];

  // Progress bar animation for daily energy consumption
  const dailyTargetKwh = 10;
  const progressRatio = Math.min(todayTotalKwh / dailyTargetKwh, 1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.set(
      withTiming(progressRatio, {
        duration: 500,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      })
    );
  }, [progressRatio]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.get() * 100}%`,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#00C853" />
          </View>
          <View>
            <Text style={styles.brandTitle}>SYNCO METER</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.brandSubtitle}>Grid Connected • 2 Nodes</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setActiveTab('profile')}
            accessibilityRole="button"
            accessibilityLabel="View Profile"
          >
            <MaterialCommunityIcons name="account-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Daily Impact Semicircular Radial Gauge */}
        <RadialGauge
          watts={totalPowerWatts}
          maxWatts={3000}
          voltage={averageVoltage}
          current={totalCurrentAmps}
          powerFactor={averagePowerFactor}
        />

        {/* 2. Radar Automation Status Card */}
        <View style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <View style={styles.radarHeaderLeft}>
              <MaterialCommunityIcons name="radar" size={18} color="#00C853" />
              <Text style={styles.radarTitle}>Radar Automation</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.radarNodesRow}>
            {/* Room 1 */}
            <View style={styles.radarNodeBox}>
              <Text style={styles.radarNodeName}>Room 1 Plug</Text>
              <View style={styles.occupiedBadge}>
                <Text style={styles.occupiedBadgeText}>Occupied</Text>
              </View>
            </View>

            {/* Room 2 */}
            <View style={styles.radarNodeBox}>
              <Text style={styles.radarNodeName}>Room 2 Plug</Text>
              <View style={styles.vacantBadge}>
                <Text style={styles.vacantBadgeText}>
                  {node2.cutoffPending
                    ? `Vacant • Off in ${Math.ceil(node2.cutoffCountdownSeconds / 60)}m`
                    : 'Vacant • Off'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Smart Nodes Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Smart Nodes</Text>
          <Text style={styles.sectionSub}>2 Monitored</Text>
        </View>

        {/* Room 1 Plug Row */}
        <View style={styles.nodeItemCard}>
          <View style={styles.nodeItemLeft}>
            <View style={[styles.nodeIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="power-socket-eu" size={20} color="#00C853" />
            </View>
            <View>
              <View style={styles.nodeTitleLine}>
                <Text style={styles.nodeName}>Room 1 Plug</Text>
                <View style={styles.miniOccupiedBadge}>
                  <Text style={styles.miniBadgeText}>Occupied</Text>
                </View>
              </View>
              <Text style={styles.nodeSubMetrics}>
                {node1.relayState ? `${node1.activePowerWatts} W` : '0 W'} • ~{node1.voltage.toFixed(0)}V
              </Text>
            </View>
          </View>
          <Switch
            value={node1.relayState}
            onValueChange={() => toggleNodeRelay('node-1')}
            trackColor={{ false: '#E5E7EB', true: '#00C853' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Room 2 Plug Row */}
        <View style={styles.nodeItemCard}>
          <View style={styles.nodeItemLeft}>
            <View style={[styles.nodeIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="power-socket-eu" size={20} color="#F59E0B" />
            </View>
            <View>
              <View style={styles.nodeTitleLine}>
                <Text style={styles.nodeName}>Room 2 Plug</Text>
                {node2.cutoffPending ? (
                  <View style={styles.miniCutoffBadge}>
                    <Text style={styles.miniCutoffText}>
                      Cutoff in {formatCountdown(node2.cutoffCountdownSeconds)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.miniVacantBadge}>
                    <Text style={styles.miniVacantText}>Vacant</Text>
                  </View>
                )}
              </View>
              <Text style={styles.nodeSubMetrics}>
                {node2.relayState ? `${node2.activePowerWatts} W` : '0 W'} • Vacant
              </Text>
            </View>
          </View>
          <Switch
            value={node2.relayState}
            onValueChange={() => toggleNodeRelay('node-2')}
            trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 4. Today's Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            <View style={styles.ecoSavedPill}>
              <Text style={styles.ecoSavedText}>18% Eco-Saved</Text>
            </View>
          </View>

          <View style={styles.summaryMetricsRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Energy</Text>
              <Text style={styles.summaryVal}>{todayTotalKwh} <Text style={styles.summaryUnit}>kWh</Text></Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Est. Cost</Text>
              <Text style={styles.summaryVal}>${todayEstimatedCost}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Saved Draw</Text>
              <Text style={[styles.summaryVal, { color: '#00C853' }]}>
                {todaySavedKwh} <Text style={styles.summaryUnit}>kWh</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Daily Energy Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Energy Target</Text>
            <Text style={styles.progressValue}>
              {todayTotalKwh.toFixed(1)} / {dailyTargetKwh} kWh
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>

        {/* 6. System Mode Selector Pills */}
        <View style={styles.modesRow}>
          {modes.map((m) => {
            const isSelected = systemMode === m;
            return (
              <PressableScale
                key={m}
                style={[styles.modeButton, isSelected && styles.modeButtonActive]}
                onPress={() => setSystemMode(m)}
              >
                <MaterialCommunityIcons
                  name={m === 'Auto' ? 'flash-auto' : m === 'Eco' ? 'leaf' : 'tune'}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#4B5563'}
                />
                <Text style={[styles.modeButtonText, isSelected && styles.modeButtonTextActive]}>
                  {m}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  activePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  radarNodesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radarNodeBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
  },
  radarNodeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  occupiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  occupiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
  },
  vacantBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  vacantBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  nodeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  nodeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  nodeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  miniOccupiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00C853',
  },
  miniCutoffBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniCutoffText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  miniVacantBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniVacantText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
  },
  nodeSubMetrics: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  ecoSavedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ecoSavedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeButtonActive: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C853',
    borderRadius: 4,
  },
});
