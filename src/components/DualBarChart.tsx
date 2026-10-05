import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { HourlyDistribution } from '../types/hems';

interface DualBarChartProps {
  data: HourlyDistribution[];
}

export const DualBarChart: React.FC<DualBarChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 72, 450);
  const chartHeight = 150;
  const paddingBottom = 22;
  const barWidth = 10;
  const maxWatts = 2000;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>24h Load Distribution</Text>
          <Text style={styles.subtitle}>Presence-based energy telemetry</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00C853' }]} />
            <Text style={styles.legendText}>Load</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#A7F3D0' }]} />
            <Text style={styles.legendText}>Cut</Text>
          </View>
        </View>
      </View>

      {/* SVG Dual Bars */}
      <View style={styles.svgWrap}>
        <Svg width={chartWidth} height={chartHeight}>
          {data.map((item, idx) => {
            const availableHeight = chartHeight - paddingBottom - 10;
            const loadH = (item.loadWatts / maxWatts) * availableHeight;
            const cutH = (item.cutWatts / maxWatts) * availableHeight;

            const groupWidth = chartWidth / data.length;
            const x = idx * groupWidth + (groupWidth - barWidth * 2 - 4) / 2;

            const loadY = chartHeight - paddingBottom - loadH;
            const cutY = chartHeight - paddingBottom - cutH;

            return (
              <React.Fragment key={idx}>
                {/* Active Load Bar (Green) */}
                <Rect
                  x={x}
                  y={loadY}
                  width={barWidth}
                  height={loadH}
                  rx={4}
                  fill="#00C853"
                />

                {/* Auto-Cut Avoided Bar (Pale Mint) */}
                <Rect
                  x={x + barWidth + 3}
                  y={cutY}
                  width={barWidth}
                  height={cutH}
                  rx={4}
                  fill="#A7F3D0"
                />

                {/* X-Axis Time Label */}
                <SvgText
                  x={x + barWidth}
                  y={chartHeight - 4}
                  fill="#9CA3AF"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.time}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Peak & Cut Metrics Pill Row */}
      <View style={styles.bottomStatsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PEAK PULSE</Text>
          <View style={styles.statInline}>
            <Text style={styles.statVal}>1.84 kW</Text>
            <Text style={styles.statTime}>19:40</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AUTO-CUT DURATION</Text>
          <View style={styles.statInline}>
            <Text style={styles.statVal}>6h 15m</Text>
            <View style={styles.savedPill}>
              <Text style={styles.savedPillText}>Saved</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  savedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  savedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
});
