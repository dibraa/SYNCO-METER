import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EfficiencyGaugeProps {
  score: number; // e.g. 88
  selfPoweredPercent: number; // 88
  gridDependencePercent: number; // 12
  hoursSevered: number; // 44.5
  relayCutoffsCount: number; // 63
}

export const EfficiencyGauge: React.FC<EfficiencyGaugeProps> = ({
  score = 88,
  selfPoweredPercent = 88,
  gridDependencePercent = 12,
  hoursSevered = 44.5,
  relayCutoffsCount = 63,
}) => {
  const size = 180;
  const strokeWidth = 14;
  const radius = 72;
  const cx = size / 2;
  const cy = 95;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, startA);
    const end = polarToCartesian(x, y, r, endA);
    return ['M', start.x, start.y, 'A', r, r, 0, 0, 1, end.x, end.y].join(' ');
  };

  const bgPath = describeArc(cx, cy, radius, -190, 10);
  const ratio = score / 100;
  const activeEndAngle = -190 + ratio * 200;
  const activePath = describeArc(cx, cy, radius, -190, activeEndAngle);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Efficiency Score</Text>
          <Text style={styles.subtitle}>Occupancy cutoffs & phantom elimination</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+12 pts vs last Mo</Text>
        </View>
      </View>

      {/* SVG Radial Arc */}
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={120}>
          <Path
            d={bgPath}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={activePath}
            stroke="#00C853"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <View style={styles.centerReadout}>
          <Text style={styles.ecoText}>Eco Conservation</Text>
          <Text style={styles.scoreText}>{score}%</Text>
        </View>
      </View>

      {/* Sub-line */}
      <View style={styles.subRatioRow}>
        <Text style={styles.ratioText}>
          Self-Powered <Text style={styles.ratioBold}>{selfPoweredPercent}%</Text>
        </Text>
        <Text style={styles.ratioDot}>•</Text>
        <Text style={styles.ratioText}>
          Grid Dependence <Text style={styles.ratioBold}>{gridDependencePercent}%</Text>
        </Text>
      </View>

      {/* Two Metric Summary Boxes */}
      <View style={styles.statTilesRow}>
        <View style={styles.statTile}>
          <View style={styles.statTileHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lightning-bolt-outline" size={16} color="#00C853" />
            </View>
            <Text style={styles.tileVal}>{hoursSevered}</Text>
          </View>
          <Text style={styles.tileLabel}>HRS</Text>
          <Text style={styles.tileSub}>Severed on absence</Text>
        </View>

        <View style={styles.statTile}>
          <View style={styles.statTileHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="content-cut" size={16} color="#00C853" />
            </View>
            <Text style={styles.tileVal}>{relayCutoffsCount}</Text>
          </View>
          <Text style={styles.tileLabel}>CUTS</Text>
          <Text style={styles.tileSub}>Relay cutoffs logged</Text>
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
    marginBottom: 12,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 8,
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
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 6,
  },
  centerReadout: {
    position: 'absolute',
    top: 48,
    alignItems: 'center',
  },
  ecoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },
  subRatioRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
  },
  ratioText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratioBold: {
    fontWeight: '700',
    color: '#111827',
  },
  ratioDot: {
    color: '#9CA3AF',
  },
  statTilesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  tileSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
