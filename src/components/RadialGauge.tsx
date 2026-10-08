import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface RadialGaugeProps {
  watts: number;
  maxWatts?: number;
  voltage: number;
  current: number;
  powerFactor: number;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  watts,
  maxWatts = 3000,
  voltage,
  current,
  powerFactor,
}) => {
  const size = 240;
  const strokeWidth = 14;
  const radius = 100;
  const cx = size / 2;
  const cy = 135;

  // Fade-in animation on mount
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.set(
      withTiming(1, {
        duration: 500,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  // Semicircle from -180 deg (left) to 0 deg (right)
  const clampedWatts = Math.min(Math.max(0, watts), maxWatts);
  const ratio = clampedWatts / maxWatts;

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

  const bgPath = describeArc(cx, cy, radius, -180, 0);
  const activeEndAngle = -180 + ratio * 180;
  const activePath = describeArc(cx, cy, radius, -180, Math.min(-0.1, activeEndAngle));

  const kwCurrent = (watts / 1000).toFixed(2);

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Daily Impact</Text>
          <Text style={styles.subtitle}>Live Household Grid Draw</Text>
        </View>
        <View style={styles.dropdownPill}>
          <Text style={styles.dropdownText}>Today ▾</Text>
        </View>
      </View>

      {/* SVG Semicircular Gauge */}
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={145}>
          {/* Background track */}
          <Path
            d={bgPath}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
          {/* Active green arc */}
          {watts > 0 && (
            <Path
              d={activePath}
              stroke="#00C853"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </Svg>

        {/* Center Text Readout */}
        <View style={styles.centerReadout}>
          <Text style={styles.readoutLabel}>Active Load</Text>
          <View style={styles.wattsRow}>
            <Text style={styles.wattsValue}>{watts.toLocaleString()}</Text>
            <Text style={styles.wattsUnit}>W</Text>
          </View>
          <View style={styles.kwBadge}>
            <Text style={styles.kwBadgeText}>{kwCurrent} kW Current</Text>
          </View>
        </View>

        {/* Min / Max Labels */}
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleText}>0 kW</Text>
          <Text style={styles.scaleText}>{(maxWatts / 1000).toFixed(1)} kW</Text>
        </View>
      </View>

      {/* 3-Column Sub-Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>VOLTAGE</Text>
          <Text style={styles.metricVal}>
            {voltage.toFixed(1)} <Text style={styles.metricUnit}>V</Text>
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>CURRENT</Text>
          <Text style={styles.metricVal}>
            {current.toFixed(2)} <Text style={styles.metricUnit}>A</Text>
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>POWER FACTOR</Text>
          <Text style={styles.metricVal}>
            {powerFactor.toFixed(2)} <Text style={styles.metricUnit}>cosφ</Text>
          </Text>
        </View>
      </View>
    </Animated.View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  dropdownPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
    marginBottom: 10,
  },
  centerReadout: {
    position: 'absolute',
    top: 35,
    alignItems: 'center',
  },
  readoutLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 2,
  },
  wattsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  wattsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  wattsUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00C853',
  },
  kwBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  kwBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 210,
    marginTop: -8,
  },
  scaleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 8,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
});
