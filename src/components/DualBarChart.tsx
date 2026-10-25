import React, { useState } from 'react';
import { colors } from '../theme/theme';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { HourlyEnergy, hourLabel, formatHour12, sumEnergy } from '../utils/consumption';

interface DualBarChartProps { data: HourlyEnergy[]; roomName: string }

export const DualBarChart: React.FC<DualBarChartProps> = ({ data, roomName }) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [focusedHour, setFocusedHour] = useState<number | null>(null);
  const activeHour = selectedHour ?? hoveredHour ?? focusedHour;
  const selected = data.find(item => item.hour === activeHour);
  const recorded = data.filter(item => item.energyKwh !== null);
  const total = sumEnergy(data);
  const peak = recorded.reduce<HourlyEnergy | undefined>((best, item) =>
    !best || (item.energyKwh ?? 0) > (best.energyKwh ?? 0) ? item : best, undefined);
  const maxKwh = Math.max(0.01, ...recorded.map(item => item.energyKwh ?? 0));
  const describe = (item: HourlyEnergy) =>
    `${roomName} · ${hourLabel(item.hour)}–${hourLabel(item.hour + 1)} · ${
      item.energyKwh === null ? 'Not yet recorded' : `${item.energyKwh.toFixed(2)} kWh${item.partial ? ' (partial)' : ''}`}`;

  return (
    <View>
      <View style={styles.detail} accessibilityLiveRegion="polite" testID="hour-detail">
        <Text style={styles.detailText}>{selected ? describe(selected) : 'Tap a bar to select an hour to see consumption'}</Text>
      </View>
      <Text style={styles.axis}>Energy (kWh) · scale 0–{maxKwh.toFixed(2)}</Text>
      {data.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.plot}
          accessibilityLabel="Hourly energy chart, scroll horizontally for more hours">
          {data.map(item => {
            const active = item.hour === activeHour;
            return (
              <Pressable key={item.hour} accessibilityRole="button"
                accessibilityLabel={describe(item)} accessibilityState={{ selected: active }} aria-selected={active}
                onHoverIn={() => setHoveredHour(item.hour)}
                onHoverOut={() => setHoveredHour(null)}
                onFocus={() => { if (Platform.OS === 'web') setFocusedHour(item.hour); }}
                onBlur={() => setFocusedHour(null)}
                onPress={() => {
                  setSelectedHour(previous => previous === item.hour ? null : item.hour);
                }}
                style={[styles.slot, active && styles.activeSlot]}>
                <View style={styles.barArea}>
                  <View style={[styles.bar, {
                    height: item.energyKwh === null ? 3 : Math.max(3, item.energyKwh / maxKwh * 124),
                    backgroundColor: active ? colors.text : item.energyKwh === null ? colors.border : colors.green,
                  }]} />
                </View>
                <Text style={[styles.hour, active && styles.activeText]}>{formatHour12(item.hour, false)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : <Text style={styles.empty}>No consumption records yet.</Text>}
      <Text style={styles.hint}>Scroll horizontally for all 24 hours. Tap a bar to select an hour to see consumption.</Text>
      <View style={styles.summary}>
        <View style={styles.stat}><Text style={styles.label}>Total today</Text><Text style={styles.value}>{total.toFixed(2)} kWh</Text></View>
        <View style={styles.stat}><Text style={styles.label}>Avg. recorded hour</Text><Text style={styles.value}>{(recorded.length ? total / recorded.length : 0).toFixed(2)} kWh</Text></View>
        <View style={styles.stat}><Text style={styles.label}>Peak hour</Text><Text style={styles.value}>{peak && (peak.energyKwh ?? 0) > 0 ? hourLabel(peak.hour) : '—'}</Text><Text style={styles.label}>{(peak?.energyKwh ?? 0).toFixed(2)} kWh</Text></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  detail: { backgroundColor: colors.greenSoft, borderRadius: 10, padding: 12, minHeight: 66, justifyContent: 'center', marginTop: 12 },
  detailText: { color: colors.green, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  axis: { fontSize: 12, color: colors.muted, marginTop: 16, marginBottom: 4 },
  plot: { paddingBottom: 10 },
  slot: { width: 50, padding: 2, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: 'transparent' },
  activeSlot: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  barArea: { height: 132, width: '100%', justifyContent: 'flex-end', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  bar: { width: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  hour: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8 },
  activeText: { color: colors.green, fontWeight: '700' },
  hint: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 4 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderTopColor: colors.neutral, marginTop: 14, paddingTop: 14 },
  stat: { flex: 1, minWidth: 90, gap: 4 },
  label: { fontSize: 12, color: colors.muted },
  value: { fontSize: 14, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  empty: { paddingVertical: 24, color: colors.muted },
});
