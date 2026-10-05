import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PowerGaugeProps {
  powerWatts: number;
  maxWatts?: number;
  relayState: boolean;
}

export const PowerGauge: React.FC<PowerGaugeProps> = ({
  powerWatts,
  maxWatts = 3000,
  relayState,
}) => {
  const size = 260;
  const strokeWidth = 18;
  const center = size / 2;
  const radius = center - strokeWidth - 6;

  // Arc angle from -210° to 30° (240 degrees sweep)
  const startAngle = -215;
  const endAngle = 35;
  const totalAngle = endAngle - startAngle;

  // Clamp power between 0 and maxWatts
  const clampedPower = Math.min(Math.max(0, powerWatts), maxWatts);
  const percentage = clampedPower / maxWatts;
  const currentAngle = startAngle + totalAngle * (relayState ? percentage : 0);

  // Helper to calculate arc coordinates
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const arcSweep = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, arcSweep, 0, end.x, end.y].join(' ');
  };

  const bgPath = describeArc(center, center, radius, startAngle, endAngle);
  const activePath = describeArc(
    center,
    center,
    radius,
    startAngle,
    Math.max(startAngle + 0.1, currentAngle)
  );

  // Determine dynamic status color
  let gaugeColor = '#10B981'; // Green
  let statusText = 'NORMAL LOAD';
  if (!relayState) {
    gaugeColor = '#64748B'; // Muted grey
    statusText = 'LOAD CUT-OFF';
  } else if (powerWatts > maxWatts * 0.9) {
    gaugeColor = '#EF4444'; // Red Overload
    statusText = 'OVERLOAD WARNING';
  } else if (powerWatts > maxWatts * 0.6) {
    gaugeColor = '#F59E0B'; // Amber High
    statusText = 'HIGH LOAD';
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="50%" stopColor="#38BDF8" />
            <Stop offset="80%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#EF4444" />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Path
          d={bgPath}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Active Value Arc */}
        <Path
          d={activePath}
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Decorative inner glow circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius - 22}
          fill="#0F172A"
          stroke="#1E293B"
          strokeWidth={1}
        />
      </Svg>

      {/* Center Digital Display */}
      <View style={styles.centerContent}>
        <Text style={[styles.statusBadge, { color: gaugeColor }]}>{statusText}</Text>
        <Text style={styles.valueText}>
          {relayState ? Math.round(powerWatts).toLocaleString() : '0'}
        </Text>
        <Text style={styles.unitText}>WATTS (W)</Text>
        <Text style={styles.percentText}>
          {relayState ? `${Math.round(percentage * 100)}% of ${maxWatts}W limit` : 'Relay Disconnected'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  percentText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
});
