import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CostEnergyCardProps {
  energyKwh: number;
  powerWatts: number;
  tariffRate: number;
  currencySymbol: string;
  relayState: boolean;
}

export const CostEnergyCard: React.FC<CostEnergyCardProps> = ({
  energyKwh,
  powerWatts,
  tariffRate,
  currencySymbol,
  relayState,
}) => {
  // Total accrued bill from recorded energy
  const totalCost = (energyKwh * tariffRate).toFixed(2);

  // Hourly burn rate: (Watts / 1000) * Tariff
  const hourlyCost = relayState
    ? ((powerWatts / 1000) * tariffRate).toFixed(2)
    : '0.00';

  // Projected 24h cost at current power level
  const projectedDailyCost = relayState
    ? (((powerWatts / 1000) * 24) * tariffRate).toFixed(2)
    : '0.00';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#34D399" />
          <Text style={styles.headerTitle}>ENERGY & COST ACCRUAL</Text>
        </View>
        <View style={styles.rateBadge}>
          <Text style={styles.rateBadgeText}>
            Tariff: {currencySymbol}{tariffRate.toFixed(2)}/kWh
          </Text>
        </View>
      </View>

      <View style={styles.mainMetricsRow}>
        {/* Cumulative Energy Column */}
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>CUMULATIVE ENERGY</Text>
          <View style={styles.digitalRegister}>
            <Text style={styles.registerValue}>{energyKwh.toFixed(3)}</Text>
            <Text style={styles.registerUnit}>kWh</Text>
          </View>
          <Text style={styles.subtext}>Physical PZEM Register</Text>
        </View>

        <View style={styles.divider} />

        {/* Total Cost Column */}
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>ACCRUED COST</Text>
          <View style={styles.digitalRegister}>
            <Text style={styles.costCurrency}>{currencySymbol}</Text>
            <Text style={styles.costValue}>{totalCost}</Text>
          </View>
          <Text style={styles.subtext}>Based on consumption</Text>
        </View>
      </View>

      {/* Burn Rate Footer Bar */}
      <View style={styles.footerBar}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Current Run-Rate</Text>
          <Text style={styles.footerValue}>
            {currencySymbol}{hourlyCost} <Text style={styles.unitSmall}>/ hr</Text>
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Projected 24h</Text>
          <Text style={styles.footerValue}>
            {currencySymbol}{projectedDailyCost} <Text style={styles.unitSmall}>/ day</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  rateBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  mainMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricColumn: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  digitalRegister: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  registerValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  registerUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  costCurrency: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34D399',
  },
  costValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  unitSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
