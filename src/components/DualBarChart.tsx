import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { HourlyDistribution } from '../types/hems';

interface DualBarChartProps {
  data: HourlyDistribution[];
}

export const DualBarChart: React.FC<DualBarChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 64, 450);
  const chartHeight = 140;
  const paddingBottom = 24;
  const paddingTop = 8;
  const maxWatts = 2000;

  const totalLoad = data.reduce((sum, d) => sum + d.loadWatts, 0);
  const avgLoad = totalLoad / data.length;
  const peakItem = data.reduce((max, d) => (d.loadWatts > max.loadWatts ? d : max), data[0]);
  const peakThreshold = avgLoad * 1.3;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>24h Consumption</Text>
        <Text style={styles.subtitle}>Peak: {peakItem.time} ({peakItem.loadWatts}W)</Text>
      </View>

      <View style={styles.svgWrap}>
        <Svg width={chartWidth} height={chartHeight}>
          {data.map((item, idx) => {
            const availableHeight = chartHeight - paddingBottom - paddingTop;
            const barHeight = (item.loadWatts / maxWatts) * availableHeight;
            const groupWidth = chartWidth / data.length;
            const barWidth = Math.max(6, groupWidth - 6);
            const x = idx * groupWidth + (groupWidth - barWidth) / 2;
            const y = chartHeight - paddingBottom - barHeight;
            const isHigh = item.loadWatts > peakThreshold;

            return (
              <React.Fragment key={idx}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill={isHigh ? '#F59E0B' : '#00C853'}
                />
                {idx % 4 === 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={chartHeight - 6}
                    fill="#9CA3AF"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {item.time.split(':')[0]}h
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryVal}>{(totalLoad / 1000).toFixed(1)} kWh</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryVal}>{Math.round(avgLoad)}W</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Peak</Text>
          <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>{peakItem.loadWatts}W</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
});
