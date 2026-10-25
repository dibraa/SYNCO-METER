import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, ui } from '../theme/theme';

interface RadialGaugeProps { watts: number; maxWatts?: number; voltage: number; current: number; powerFactor: number }
export const RadialGauge = ({ watts, maxWatts = 3000, voltage, current, powerFactor }: RadialGaugeProps) => {
  const ratio = maxWatts > 0 ? Math.min(1, Math.max(0, watts / maxWatts)) : 0;
  const endAngle = Math.PI * (1 - ratio);
  const x = 120 + 100 * Math.cos(endAngle);
  const y = 115 - 100 * Math.sin(endAngle);
  return <View style={styles.container}>
    <Svg width="100%" height={130} viewBox="0 0 240 130" accessible={false}>
      <Path d="M 20 115 A 100 100 0 0 1 220 115" fill="none" stroke={colors.border} strokeWidth={12} strokeLinecap="round" />
      {ratio > 0 && <Path d={`M 20 115 A 100 100 0 0 1 ${x} ${y}`} fill="none" stroke={colors.green} strokeWidth={12} strokeLinecap="round" />}
    </Svg>
    <Text style={ui.number}>{watts.toLocaleString()} W</Text><Text style={ui.muted}>Demo meter · 0–{(maxWatts / 1000).toFixed(1)} kW</Text>
    <View style={styles.metrics}>{[['Voltage', `${voltage.toFixed(1)} V`], ['Current', `${current.toFixed(2)} A`], ['Power factor', powerFactor.toFixed(2)]].map(([label, value]) => <View key={label} style={styles.metric}><Text style={ui.muted}>{label}</Text><Text style={ui.body}>{value}</Text></View>)}</View>
  </View>;
};
const styles = StyleSheet.create({ container: { alignItems: 'center', gap: 8 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingTop: 12 }, metric: { alignItems: 'center', gap: 4 } });
