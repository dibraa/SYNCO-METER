import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, primitives, radii } from '../theme/theme';

interface RadialGaugeProps {
  watts: number;
  maxWatts?: number;
  voltage: number;
  current: number;
  powerFactor: number;
  isLive?: boolean;
}

export const RadialGauge = ({
  watts,
  maxWatts = 3000,
  voltage,
  current,
  powerFactor,
  isLive = false,
}: RadialGaugeProps) => {
  const ratio = maxWatts > 0 ? Math.min(1, Math.max(0, watts / maxWatts)) : 0;
  const endAngle = Math.PI * (1 - ratio);
  const x = 120 + 96 * Math.cos(endAngle);
  const y = 114 - 96 * Math.sin(endAngle);

  const isWarning = ratio >= 0.7 && ratio < 0.85;
  const isDanger = ratio >= 0.85;
  const startStop = isDanger
    ? primitives.orange500
    : isWarning
    ? primitives.amber500
    : primitives.blue400;
  const endStop = isDanger
    ? primitives.red600
    : isWarning
    ? primitives.orange500
    : primitives.blue600;

  return (
    <View style={styles.container}>
      <View style={styles.gaugeWrap}>
        <Svg width="100%" height={126} viewBox="0 0 240 126" accessible={false}>
          <Defs>
            <LinearGradient id="meterArcGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={startStop} />
              <Stop offset="100%" stopColor={endStop} />
            </LinearGradient>
          </Defs>
          <Path
            d="M 24 114 A 96 96 0 0 1 216 114"
            fill="none"
            stroke={colors.surfaceMuted}
            strokeWidth={13}
            strokeLinecap="round"
          />
          {ratio > 0 ? (
            <Path
              d={`M 24 114 A 96 96 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`}
              fill="none"
              stroke="url(#meterArcGrad)"
              strokeWidth={13}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
        <View style={styles.centerReadout}>
          <Text style={styles.watts}>{watts.toLocaleString()} W</Text>
          <Text style={styles.subReadout}>
            {(watts / 1000).toFixed(2)} kW · {isLive ? 'Live PZEM' : '0–3.0 kW'}
          </Text>
        </View>
      </View>

      <View style={styles.metrics}>
        {[
          { label: 'Voltage', value: `${voltage.toFixed(1)} V` },
          { label: 'Current', value: `${current.toFixed(2)} A` },
          { label: 'Power Factor', value: powerFactor.toFixed(2) },
        ].map((item) => (
          <View key={item.label} style={styles.metricChip}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  gaugeWrap: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  centerReadout: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
  },
  watts: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  subReadout: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  metrics: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    paddingTop: 6,
  },
  metricChip: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radii.control,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
