import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { EfficiencyGauge } from '../components/EfficiencyGauge';

export const AuditReportsScreen: React.FC = () => {
  const {
    nodes,
    report,
    applyStandbyRule,
    ruleApplied,
    setActiveTab,
  } = useHems();

  const [selectedNodeFilter, setSelectedNodeFilter] = useState<'all' | 'node-1' | 'node-2'>('all');

  const node1 = nodes[0];
  const node2 = nodes[1];

  const handleExport = (type: string) => {
    Alert.alert(
      `Export ${type}`,
      `Generated verified ${type} for February 2025 PZEM-004T telemetry logs. Ready for capstone submission.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('home')}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Monthly Energy Audit</Text>
          <Text style={styles.headerSubtitle}>• Dual Node Active</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.calendarBtn}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => setActiveTab('profile')}
            accessibilityRole="button"
            accessibilityLabel="View Profile"
          >
            <MaterialCommunityIcons name="account-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector Title */}
        <View style={styles.monthRow}>
          <View>
            <Text style={styles.monthTitle}>{report.month}</Text>
            <Text style={styles.monthSub}>PZEM-004T verified telemetry & cutoff logs</Text>
          </View>
          <View style={styles.monthlyDropdown}>
            <Text style={styles.monthlyText}>Monthly ▾</Text>
          </View>
        </View>

        {/* Node Filter Tabs */}
        <View style={styles.nodeFilterRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedNodeFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedNodeFilter('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedNodeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Nodes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedNodeFilter === 'node-1' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedNodeFilter('node-1')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedNodeFilter === 'node-1' && styles.filterPillTextActive,
              ]}
            >
              Room 1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedNodeFilter === 'node-2' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedNodeFilter('node-2')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedNodeFilter === 'node-2' && styles.filterPillTextActive,
              ]}
            >
              Room 2
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Grid Consumption Card */}
        <View style={styles.consumptionCard}>
          <View style={styles.consumptionHeader}>
            <View style={styles.consumptionHeaderLeft}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#00C853" />
              <Text style={styles.consumptionLabel}>Total Grid Consumption</Text>
            </View>
            <MaterialCommunityIcons name="message-text-outline" size={16} color="#9CA3AF" />
          </View>

          <View style={styles.kwhValueRow}>
            <Text style={styles.kwhNumber}>{report.totalKwh}</Text>
            <Text style={styles.kwhUnit}>kWh</Text>
          </View>

          <View style={styles.benchmarkRow}>
            <Text style={styles.benchmarkText}>
              ↘ ~{Math.abs(report.benchmarkDiffPercent)}% under regional municipal benchmark
            </Text>
          </View>
        </View>

        {/* Two Mini Stat Tiles */}
        <View style={styles.tilesRow}>
          <View style={styles.statTile}>
            <Text style={styles.tileLabel}>Total Cost</Text>
            <Text style={styles.tileMainVal}>${report.totalCost.toFixed(2)}</Text>
            <Text style={styles.tileSubVal}>${report.tariffPerKwh.toFixed(3)} / kWh</Text>
          </View>

          <View style={styles.statTile}>
            <View style={styles.autoSavedHeader}>
              <View style={styles.savedDot} />
              <Text style={styles.tileLabel}>Auto Saved</Text>
            </View>
            <Text style={styles.tileMainVal}>
              {report.autoSavedKwh} <Text style={styles.smallKwh}>kWh</Text>
            </Text>
            <Text style={styles.tileReclaimed}>+${report.reclaimedCost.toFixed(2)} reclaimed</Text>
          </View>
        </View>

        {/* Efficiency Score Gauge */}
        <EfficiencyGauge
          score={report.efficiencyScore}
          selfPoweredPercent={report.selfPoweredPercent}
          gridDependencePercent={report.gridDependencePercent}
          hoursSevered={report.hoursSevered}
          relayCutoffsCount={report.relayCutoffsCount}
        />

        {/* Dual Hardware Nodes Section */}
        <View style={styles.nodesHeader}>
          <Text style={styles.nodesTitle}>DUAL HARDWARE NODES</Text>
          <View style={styles.nodesBadge}>
            <Text style={styles.nodesBadgeText}>2 PZEM-004T Synced</Text>
          </View>
        </View>

        {/* Node 1 Card */}
        <View style={styles.hardwareCard}>
          <View style={styles.hwTopRow}>
            <View style={styles.hwLeft}>
              <View style={[styles.hwIconWrap, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="sofa-outline" size={20} color="#00C853" />
              </View>
              <View>
                <View style={styles.hwTitleLine}>
                  <Text style={styles.hwName}>Room 1 Plug</Text>
                  <View style={styles.hwGreenDot} />
                </View>
                <Text style={styles.hwDetails}>Living Room • ID: {node1.code}</Text>
              </View>
            </View>

            <View style={styles.hwRight}>
              <Text style={styles.hwKwh}>{node1.monthKwh} kWh</Text>
              <Text style={styles.hwBilled}>${(node1.monthKwh * report.tariffPerKwh).toFixed(2)} billed</Text>
            </View>
          </View>

          <View style={styles.shareLine}>
            <Text style={styles.shareLabel}>Share of Load</Text>
            <Text style={styles.shareVal}>{node1.sharePercentage}%</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${node1.sharePercentage}%` }]} />
          </View>

          <View style={styles.hwBottomMetrics}>
            <Text style={styles.hwBottomText}>Peak Spike: {(node1.peakSpikeWatts / 1000).toFixed(2)} kW</Text>
            <Text style={styles.hwBottomText}>{node1.autoTrips} Auto-Trips</Text>
          </View>
        </View>

        {/* Node 2 Card */}
        <View style={styles.hardwareCard}>
          <View style={styles.hwTopRow}>
            <View style={styles.hwLeft}>
              <View style={[styles.hwIconWrap, { backgroundColor: '#FFEDD5' }]}>
                <MaterialCommunityIcons name="bed-outline" size={20} color="#EA580C" />
              </View>
              <View>
                <View style={styles.hwTitleLine}>
                  <Text style={styles.hwName}>Room 2 Plug</Text>
                  <View style={[styles.hwGreenDot, { backgroundColor: '#EA580C' }]} />
                </View>
                <Text style={styles.hwDetails}>Bedroom • ID: {node2.code}</Text>
              </View>
            </View>

            <View style={styles.hwRight}>
              <Text style={styles.hwKwh}>{node2.monthKwh} kWh</Text>
              <Text style={styles.hwBilled}>${(node2.monthKwh * report.tariffPerKwh).toFixed(2)} billed</Text>
            </View>
          </View>

          <View style={styles.shareLine}>
            <Text style={styles.shareLabel}>Share of Load</Text>
            <Text style={styles.shareVal}>{node2.sharePercentage}%</Text>
          </View>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${node2.sharePercentage}%`, backgroundColor: '#F59E0B' },
              ]}
            />
          </View>

          <View style={styles.hwBottomMetrics}>
            <Text style={styles.hwBottomText}>Peak Spike: {node2.peakSpikeWatts} W</Text>
            <Text style={styles.hwBottomText}>{node2.autoTrips} Auto-Trips</Text>
          </View>
        </View>

        {/* Standby Bleed Warning Card */}
        <View style={styles.bleedCard}>
          <View style={styles.bleedHeader}>
            <View style={styles.bleedHeaderLeft}>
              <View style={styles.bleedIconCircle}>
                <MaterialCommunityIcons name="power-sleep" size={18} color="#D97706" />
              </View>
              <Text style={styles.bleedTitle}>Room 1 Standby Bleed</Text>
            </View>
            <View style={styles.bleedBadge}>
              <Text style={styles.bleedBadgeText}>18W Idle</Text>
            </View>
          </View>

          <Text style={styles.bleedDescription}>
            Entertainment console maintains continuous 18W idle. Tightening vacant cutoff threshold from 15m to 10m saves ~$2.30/mo.
          </Text>

          <View style={styles.bleedActionRow}>
            <Text style={styles.savingsEstimate}>Estimated savings: $2.30/mo</Text>
            <TouchableOpacity
              style={[styles.applyRuleBtn, ruleApplied && styles.applyRuleBtnDone]}
              onPress={applyStandbyRule}
              activeOpacity={0.8}
            >
              <Text style={[styles.applyRuleText, ruleApplied && styles.applyRuleTextDone]}>
                {ruleApplied ? 'Rule Applied ✓' : 'Apply Rule →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Buttons */}
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => handleExport('PDF')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#111827" />
            <Text style={styles.exportBtnText}>Download PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => handleExport('CSV')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-delimited-outline" size={18} color="#111827" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#00C853',
    fontWeight: '600',
    marginTop: 2,
  },
  calendarBtn: {
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
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  monthSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  monthlyDropdown: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthlyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  nodeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#84CC16', // Lime green active pill
    borderColor: '#84CC16',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterPillTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  consumptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  consumptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consumptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consumptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  kwhValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  kwhNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  kwhUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00C853',
  },
  benchmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benchmarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C853',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  autoSavedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  savedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  tileMainVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  smallKwh: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  tileSubVal: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tileReclaimed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
    marginTop: 2,
  },
  nodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  nodesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  nodesBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nodesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C853',
  },
  hardwareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  hwTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hwLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hwIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hwName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  hwGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
  },
  hwDetails: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  hwRight: {
    alignItems: 'flex-end',
  },
  hwKwh: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  hwBilled: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  shareLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shareLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  shareVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  barBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: '#00C853',
    borderRadius: 3,
  },
  hwBottomMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  hwBottomText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  bleedCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  bleedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bleedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bleedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bleedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  bleedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bleedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  bleedDescription: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
    marginBottom: 12,
  },
  bleedActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsEstimate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
  },
  applyRuleBtn: {
    backgroundColor: '#00C853',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  applyRuleBtnDone: {
    backgroundColor: '#E8F5E9',
  },
  applyRuleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  applyRuleTextDone: {
    color: '#00C853',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
});
