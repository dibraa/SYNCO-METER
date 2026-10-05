import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HistoryPoint {
  hour: string;
  powerWatts: number;
  energyKwh: number;
  cost: number;
}

interface AnalyticsChartProps {
  history: HistoryPoint[];
  currencySymbol: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  history,
  currencySymbol,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 68, 500);
  const chartHeight = 150;
  const paddingBottom = 24;
  const paddingTop = 12;

  // Find max power to scale graph
  const maxPower = Math.max(...history.map((h) => h.powerWatts), 2000);
  const totalKwh = history.reduce((sum, h) => sum + h.energyKwh, 0);
  const totalCost = history.reduce((sum, h) => sum + h.cost, 0);
  const peakPoint = history.reduce((max, h) => (h.powerWatts > max.powerWatts ? h : max), history[0]);

  const barWidth = Math.max(6, (chartWidth / history.length) - 4);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={20} color="#818CF8" />
          <Text style={styles.title}>24-HOUR CONSUMPTION PROFILE</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Peak: {peakPoint?.hour} ({peakPoint?.powerWatts}W)</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Load profile curve showing typical residential peak and standby power intervals:
      </Text>

      {/* SVG Bar Chart */}
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="barGradNormal" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0284C7" />
            </LinearGradient>
            <LinearGradient id="barGradPeak" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
          </Defs>

          {/* Reference baseline grid line */}
          <Line
            x1="0"
            y1={chartHeight - paddingBottom}
            x2={chartWidth}
            y2={chartHeight - paddingBottom}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Bars */}
          {history.map((item, idx) => {
            const availableHeight = chartHeight - paddingBottom - paddingTop;
            const barHeight = (item.powerWatts / maxPower) * availableHeight;
            const x = idx * (chartWidth / history.length) + 2;
            const y = chartHeight - paddingBottom - barHeight;
            const isPeak = item.powerWatts === peakPoint.powerWatts;

            return (
              <React.Fragment key={idx}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill={isPeak ? 'url(#barGradPeak)' : 'url(#barGradNormal)'}
                />
                {/* Show label every 4 hours */}
                {idx % 4 === 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={chartHeight - 6}
                    fill="#64748B"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {item.hour.split(':')[0]}h
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Summary Footer */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>24h Energy</Text>
          <Text style={styles.statVal}>{totalKwh.toFixed(2)} kWh</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>24h Cost</Text>
          <Text style={styles.statVal}>{currencySymbol}{totalCost.toFixed(2)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Standby Baseline</Text>
          <Text style={styles.statVal}>~80-150W</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
});
