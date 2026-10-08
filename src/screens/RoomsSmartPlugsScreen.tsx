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
import { AnimatedNumber } from '../components/AnimatedNumber';
import { PressableScale } from '../components/PressableScale';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const RoomsSmartPlugsScreen: React.FC = () => {
  const {
    nodes,
    toggleNodeRelay,
    extendCutoff,
    totalPowerWatts,
    averageVoltage,
    setActiveTab,
  } = useHems();

  const node1 = nodes[0];
  const node2 = nodes[1];

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Switch feedback animation
  const node1Scale = useSharedValue(1);
  const node2Scale = useSharedValue(1);

  useEffect(() => {
    node1Scale.set(
      withTiming(1.1, {
        duration: 150,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      })
    );
    setTimeout(() => {
      node1Scale.set(
        withTiming(1, {
          duration: 150,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        })
      );
    }, 150);
  }, [node1.relayState]);

  useEffect(() => {
    node2Scale.set(
      withTiming(1.1, {
        duration: 150,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      })
    );
    setTimeout(() => {
      node2Scale.set(
        withTiming(1, {
          duration: 150,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        })
      );
    }, 150);
  }, [node2.relayState]);

  const node1IconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: node1Scale.get() }],
  }));

  const node2IconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: node2Scale.get() }],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerUserWrap}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#00C853" />
          </View>
          <View>
            <Text style={styles.superTitle}>SMART POWER</Text>
            <Text style={styles.mainTitle}>SYNCO METER</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
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
        {/* Total Active Load Card */}
        <View style={styles.totalLoadCard}>
          <View style={styles.totalLoadLeft}>
            <View style={styles.totalIconWrap}>
              <MaterialCommunityIcons name="power-plug" size={22} color="#00C853" />
            </View>
            <View>
              <Text style={styles.totalLoadLabel}>Total Active Load</Text>
              <View style={styles.totalWattsRow}>
                <AnimatedNumber value={totalPowerWatts} style={styles.totalWattsVal} />
                <Text style={styles.totalWattsUnit}>W</Text>
              </View>
            </View>
          </View>

          <View style={styles.totalLoadRight}>
            <View style={styles.syncedBadge}>
              <View style={styles.syncDot} />
              <Text style={styles.syncedBadgeText}>2 Plugs Synced</Text>
            </View>
            <Text style={styles.gridVoltText}>{averageVoltage.toFixed(1)}V Grid</Text>
          </View>
        </View>

        {/* Room 1: Living Room Plug */}
        <View style={styles.roomCard}>
          <View style={styles.roomCardHeader}>
            <View style={styles.roomHeaderLeft}>
              <Animated.View style={[styles.roomIconWrap, { backgroundColor: '#E8F5E9' }, node1IconStyle]}>
                <MaterialCommunityIcons name="sofa-outline" size={22} color="#00C853" />
              </Animated.View>
              <View>
                <Text style={styles.roomName}>Room 1</Text>
                <Text style={styles.roomSub}>Living Room Plug</Text>
              </View>
            </View>
            <View style={styles.occupiedPill}>
              <View style={styles.occupiedDot} />
              <Text style={styles.occupiedPillText}>Occupied</Text>
            </View>
          </View>

          {/* Metrics 2-column */}
          <View style={styles.roomMetricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Active Draw</Text>
              <View style={styles.metricValRow}>
                <AnimatedNumber
                  value={node1.relayState ? node1.activePowerWatts : 0}
                  style={styles.metricNumber}
                />
                <Text style={styles.metricUnit}>W</Text>
              </View>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Today's Total</Text>
              <View style={styles.metricValRow}>
                <Text style={styles.metricNumber}>{node1.todayKwh}</Text>
                <Text style={styles.metricUnit}>kWh</Text>
              </View>
              <Text style={styles.metricTrend}>↘ -8.4% vs yesterday</Text>
            </View>
          </View>

          {/* Relay Control Row */}
          <View style={styles.plugControlRow}>
            <View style={styles.plugControlLeft}>
              <MaterialCommunityIcons
                name="power"
                size={18}
                color={node1.relayState ? '#00C853' : '#9CA3AF'}
              />
              <View>
                <Text style={styles.plugControlTitle}>Plug Power</Text>
                <Text style={styles.plugControlSub}>
                  {node1.relayState ? 'Online • Relay Closed' : 'Disconnected'}
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
        </View>

        {/* Room 2: Bedroom Plug */}
        <View style={styles.roomCard}>
          <View style={styles.roomCardHeader}>
            <View style={styles.roomHeaderLeft}>
              <Animated.View style={[styles.roomIconWrap, { backgroundColor: '#FFEDD5' }, node2IconStyle]}>
                <MaterialCommunityIcons name="bed-outline" size={22} color="#EA580C" />
              </Animated.View>
              <View>
                <Text style={styles.roomName}>Room 2</Text>
                <Text style={styles.roomSub}>Bedroom Plug</Text>
              </View>
            </View>
            <View style={styles.vacantPill}>
              <View style={styles.vacantDot} />
              <Text style={styles.vacantPillText}>Vacant</Text>
            </View>
          </View>

          {/* Auto-Cutoff Pending Alert Box */}
          {node2.cutoffPending && (
            <View style={styles.cutoffWarningBox}>
              <View style={styles.cutoffIconCircle}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#EA580C" />
              </View>
              <View style={styles.cutoffTextBox}>
                <Text style={styles.cutoffTitle}>Auto-Cutoff Pending</Text>
                <Text style={styles.cutoffSub}>No occupancy detected</Text>
              </View>
              <Text style={styles.cutoffTimer}>
                {formatCountdown(node2.cutoffCountdownSeconds)}
              </Text>
            </View>
          )}

          {/* Metrics 2-column */}
          <View style={styles.roomMetricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Active Draw</Text>
              <View style={styles.metricValRow}>
                <AnimatedNumber
                  value={node2.relayState ? node2.activePowerWatts : 0}
                  style={styles.metricNumber}
                />
                <Text style={styles.metricUnit}>W</Text>
              </View>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Today's Total</Text>
              <View style={styles.metricValRow}>
                <Text style={styles.metricNumber}>{node2.todayKwh}</Text>
                <Text style={styles.metricUnit}>kWh</Text>
              </View>
              <Text style={styles.metricTrendSub}>Standard daily cycle</Text>
            </View>
          </View>

          {/* Relay Control Row */}
          <View style={styles.plugControlRow}>
            <View style={styles.plugControlLeft}>
              <MaterialCommunityIcons
                name="power"
                size={18}
                color={node2.relayState ? '#F59E0B' : '#9CA3AF'}
              />
              <View>
                <Text style={styles.plugControlTitle}>Plug Power</Text>
                <Text style={styles.plugControlSub}>
                  {node2.cutoffPending
                    ? `Cutoff in ${formatCountdown(node2.cutoffCountdownSeconds)}`
                    : node2.relayState
                    ? 'Online'
                    : 'Disconnected'}
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

          {/* Keep ON for 30m Button */}
          {node2.cutoffPending && (
            <PressableScale
              style={styles.keepOnButton}
              onPress={() => extendCutoff('node-2', 30)}
            >
              <MaterialCommunityIcons name="clock-fast" size={16} color="#00C853" />
              <Text style={styles.keepOnText}>Keep ON for 30m</Text>
            </PressableScale>
          )}
        </View>

        {/* Automation Settings Navigation */}
        <PressableScale style={styles.automationSettingsBtn}>
          <View style={styles.autoSettingsLeft}>
            <MaterialCommunityIcons name="tune-vertical" size={20} color="#111827" />
            <Text style={styles.autoSettingsTitle}>Automation Settings</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </PressableScale>
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
  headerUserWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  superTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
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
  totalLoadCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  totalLoadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLoadLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalWattsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  totalWattsVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  totalWattsUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00C853',
  },
  totalLoadRight: {
    alignItems: 'flex-end',
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  syncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00C853',
  },
  syncedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
  },
  gridVoltText: {
    fontSize: 11,
    color: '#6B7280',
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  roomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  roomSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  occupiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  occupiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00C853',
  },
  occupiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  vacantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  vacantDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
  },
  vacantPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  cutoffWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  cutoffIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cutoffTextBox: {
    flex: 1,
  },
  cutoffTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
  },
  cutoffSub: {
    fontSize: 10,
    color: '#C2410C',
  },
  cutoffTimer: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  roomMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  metricTrend: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
    marginTop: 2,
  },
  metricTrendSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  plugControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  plugControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plugControlTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  plugControlSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  keepOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  keepOnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00C853',
  },
  automationSettingsBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  autoSettingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoSettingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});
