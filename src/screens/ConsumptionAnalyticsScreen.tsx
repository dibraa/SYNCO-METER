import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { DualBarChart } from '../components/DualBarChart';

export const ConsumptionAnalyticsScreen: React.FC = () => {
  const {
    nodes,
    report,
    dailyLogs,
    hourlyDistribution,
    setActiveTab,
  } = useHems();

  const [filterPeriod, setFilterPeriod] = useState<'day' | 'month'>('day');

  const node1 = nodes[0];
  const node2 = nodes[1];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#111827" />
          </View>
          <View>
            <Text style={styles.brandTitle}>SYNCO METER</Text>
            <Text style={styles.brandSubtitle}>• 2 Nodes Active</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setActiveTab('settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day / Month Toggle Pills */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, filterPeriod === 'day' && styles.toggleBtnActive]}
            onPress={() => setFilterPeriod('day')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={15}
              color={filterPeriod === 'day' ? '#111827' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.toggleBtnText,
                filterPeriod === 'day' && styles.toggleBtnTextActive,
              ]}
            >
              Every Day
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, filterPeriod === 'month' && styles.toggleBtnActive]}
            onPress={() => setFilterPeriod('month')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calendar-month"
              size={15}
              color={filterPeriod === 'month' ? '#111827' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.toggleBtnText,
                filterPeriod === 'month' && styles.toggleBtnTextActive,
              ]}
            >
              Every Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Cycle & Est Cost Card */}
        <View style={styles.cycleCard}>
          <View style={styles.cycleHeaderRow}>
            <View>
              <Text style={styles.cycleLabel}>ACTIVE CYCLE</Text>
              <View style={styles.cycleValRow}>
                <Text style={styles.cycleKwh}>{report.totalKwh}</Text>
                <Text style={styles.cycleUnit}>kWh</Text>
              </View>
            </View>

            <View style={styles.costCol}>
              <Text style={styles.cycleLabel}>EST. COST</Text>
              <Text style={styles.costVal}>₱{report.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* Node Split Indicators */}
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: '#00C853' }]} />
              <Text style={styles.splitText}>Room 1: {node1.sharePercentage}%</Text>
            </View>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: '#34D399' }]} />
              <Text style={styles.splitText}>Room 2: {node2.sharePercentage}%</Text>
            </View>
          </View>

          {/* Occupancy Auto-Cut Savings banner */}
          <View style={styles.savingsBanner}>
            <View style={styles.savingsLeft}>
              <View style={styles.leafIconCircle}>
                <MaterialCommunityIcons name="leaf" size={16} color="#00C853" />
              </View>
              <View>
                <Text style={styles.savingsTitle}>Occupancy Auto-Cut Savings</Text>
                <Text style={styles.savingsSub}>
                  Avoided {report.autoSavedKwh} kWh standby waste
                </Text>
              </View>
            </View>
            <View style={styles.reclaimedBadge}>
              <Text style={styles.reclaimedText}>+₱{report.reclaimedCost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 24h Load Distribution Dual Bar Chart */}
        <DualBarChart data={hourlyDistribution} />

        {/* Plug Sub-Meters Section */}
        <View style={styles.subMetersHeader}>
          <Text style={styles.subMetersTitle}>PLUG SUB-METERS</Text>
          <View style={styles.subMetersBadge}>
            <Text style={styles.subMetersBadgeText}>2 Plugs Synced</Text>
          </View>
        </View>

        <View style={styles.subMetersRow}>
          {/* Room 1 Sub-Meter */}
          <View style={styles.subMeterCard}>
            <View style={styles.subMeterTop}>
              <MaterialCommunityIcons name="sofa-outline" size={18} color="#00C853" />
              <Text style={styles.percentBadgeText}>{node1.sharePercentage}%</Text>
            </View>
            <Text style={styles.subMeterName}>Room 1 Plug</Text>
            <Text style={styles.subMeterCode}>PZEM-01 • Living</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${node1.sharePercentage}%` }]} />
            </View>
            <Text style={styles.subMeterKwh}>{node1.monthKwh} <Text style={styles.kwhUnit}>kWh</Text></Text>
          </View>

          {/* Room 2 Sub-Meter */}
          <View style={styles.subMeterCard}>
            <View style={styles.subMeterTop}>
              <MaterialCommunityIcons name="bed-outline" size={18} color="#EA580C" />
              <Text style={styles.percentBadgeTextOrange}>{node2.sharePercentage}%</Text>
            </View>
            <Text style={styles.subMeterName}>Room 2 Plug</Text>
            <Text style={styles.subMeterCode}>PZEM-02 • Bed</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${node2.sharePercentage}%`, backgroundColor: '#F59E0B' },
                ]}
              />
            </View>
            <Text style={styles.subMeterKwh}>{node2.monthKwh} <Text style={styles.kwhUnit}>kWh</Text></Text>
          </View>
        </View>

        {/* Daily Consumption Section */}
        <View style={styles.dailyHeader}>
          <Text style={styles.dailyTitle}>Daily Consumption</Text>
          <Text style={styles.recentLogs}>Recent Logs</Text>
        </View>

        <View style={styles.logsCard}>
          {dailyLogs.map((log, index) => (
            <View
              key={index}
              style={[styles.logItem, index !== dailyLogs.length - 1 && styles.logItemBorder]}
            >
              <View style={styles.logLeft}>
                <View style={styles.logDot} />
                <View>
                  <Text style={styles.logDate}>{log.date}</Text>
                  <Text style={styles.logBreakdown}>{log.breakdown}</Text>
                </View>
              </View>

              <View style={styles.logRight}>
                <Text style={styles.logKwh}>{log.kwh} kWh</Text>
                <Text style={styles.logSaved}>-{log.savedKwh} kWh saved</Text>
              </View>
            </View>
          ))}
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 13,
  },
  toggleBtnActive: {
    backgroundColor: '#00C853',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleBtnTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cycleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cycleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cycleValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cycleKwh: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  cycleUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00C853',
  },
  costCol: {
    alignItems: 'flex-end',
  },
  costVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  savingsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  savingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leafIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  savingsSub: {
    fontSize: 11,
    color: '#15803D',
  },
  reclaimedBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reclaimedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  subMetersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  subMetersTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  subMetersBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subMetersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
  },
  subMetersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  subMeterCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  subMeterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  percentBadgeTextOrange: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  subMeterName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  subMeterCode: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#00C853',
    borderRadius: 3,
  },
  subMeterKwh: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  kwhUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  recentLogs: {
    fontSize: 11,
    color: '#6B7280',
  },
  logsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  logItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  logBreakdown: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logKwh: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  logSaved: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00C853',
    marginTop: 2,
  },
});
