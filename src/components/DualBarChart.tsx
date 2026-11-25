import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { colors, primitives, radii } from '../theme/theme';
import { HourlyEnergy, hourLabel, sumEnergy } from '../utils/consumption';

interface DualBarChartProps {
  data: HourlyEnergy[];
  roomName: string;
  tariffPerKwh?: number;
}

function getIntensityColor(value: number | null, maxVal: number): string {
  if (value === null) return colors.border;
  const ratio = maxVal > 0 ? value / maxVal : 0;
  if (ratio >= 0.85) return primitives.red600;
  if (ratio >= 0.68) return primitives.orange500;
  if (ratio >= 0.48) return primitives.amber500;
  if (ratio >= 0.28) return primitives.green300;
  return primitives.green400;
}

export const DualBarChart: React.FC<DualBarChartProps> = ({
  data,
  roomName,
  tariffPerKwh = 12,
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [focusedHour, setFocusedHour] = useState<number | null>(null);

  const recorded = data.filter((item) => item.energyKwh !== null);
  const total = sumEnergy(data);

  const peak = recorded.reduce<HourlyEnergy | undefined>(
    (best, item) => (!best || (item.energyKwh ?? 0) > (best.energyKwh ?? 0) ? item : best),
    undefined
  );
  const low = recorded.reduce<HourlyEnergy | undefined>(
    (best, item) => (!best || (item.energyKwh ?? 0) < (best.energyKwh ?? 0) ? item : best),
    undefined
  );

  const activeHour = selectedHour ?? hoveredHour ?? focusedHour ?? peak?.hour ?? null;
  const selected = data.find((item) => item.hour === activeHour);
  const maxKwh = Math.max(0.01, ...recorded.map((item) => item.energyKwh ?? 0));

  const describe = (item: HourlyEnergy) =>
    `${roomName} · ${hourLabel(item.hour)}–${hourLabel(item.hour + 1)} · ${
      item.energyKwh === null
        ? 'Not yet recorded'
        : `${item.energyKwh.toFixed(2)} kWh${item.partial ? ' (partial)' : ''}`
    }`;

  const activeCost =
    selected && selected.energyKwh !== null
      ? `₱${(selected.energyKwh * tariffPerKwh).toFixed(2)}`
      : '—';
  const activeColor = selected
    ? getIntensityColor(selected.energyKwh, maxKwh)
    : colors.primaryText;

  return (
    <View>
      {/* Selected Hour Headline matching Inspo Screen 3 Electricity Prices card */}
      <View style={styles.headlineWrap} accessibilityLiveRegion="polite" testID="hour-detail">
        <View style={styles.headlineTop}>
          <Text style={[styles.headlineValue, { color: activeColor }]}>
            {selected && selected.energyKwh !== null
              ? `${selected.energyKwh.toFixed(2)} kWh`
              : 'No data'}
          </Text>
          {selected && selected.energyKwh !== null ? (
            <View style={styles.costTag}>
              <Text style={styles.costTagText}>{activeCost}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.headlineSub}>
          {selected
            ? `${roomName} · ${hourLabel(selected.hour)} – ${hourLabel(selected.hour + 1)}${
                selected.partial ? ' (current)' : ''
              }`
            : 'Tap any bar to inspect hourly consumption'}
        </Text>
      </View>

      {/* Scrollable Capsule Bar Plot */}
      {data.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plot}
          accessibilityLabel="Hourly energy intensity chart, scroll horizontally for all 24 hours"
        >
          {data.map((item) => {
            const active = item.hour === activeHour;
            const isPeak = peak && item.hour === peak.hour && (item.energyKwh ?? 0) > 0;
            const isLow =
              low &&
              peak &&
              low.hour !== peak.hour &&
              item.hour === low.hour &&
              item.energyKwh !== null;

            const barHeight =
              item.energyKwh === null
                ? 8
                : Math.max(18, Math.round((item.energyKwh / maxKwh) * 108));
            const barColor = getIntensityColor(item.energyKwh, maxKwh);
            const badgeText =
              item.energyKwh !== null ? Math.round(item.energyKwh * 100).toString() : '';

            return (
              <Pressable
                key={item.hour}
                accessibilityRole="button"
                accessibilityLabel={describe(item)}
                accessibilityState={{ selected: active }}
                aria-selected={active}
                onHoverIn={() => setHoveredHour(item.hour)}
                onHoverOut={() => setHoveredHour(null)}
                onFocus={() => {
                  if (Platform.OS === 'web') setFocusedHour(item.hour);
                }}
                onBlur={() => setFocusedHour(null)}
                onPress={() =>
                  setSelectedHour((previous) => (previous === item.hour ? null : item.hour))
                }
                style={[styles.slot, active && styles.activeSlot]}
              >
                <View style={styles.barArea}>
                  {isPeak ? (
                    <View style={[styles.calloutBadge, { backgroundColor: primitives.red600 }]}>
                      <Text style={styles.calloutText}>{badgeText}</Text>
                    </View>
                  ) : isLow ? (
                    <View style={[styles.calloutBadge, { backgroundColor: primitives.green400 }]}>
                      <Text style={styles.calloutText}>{badgeText}</Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.capsuleBar,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                        opacity: active ? 1 : item.energyKwh === null ? 0.45 : 0.9,
                      },
                      active && styles.capsuleBarActive,
                    ]}
                  />
                </View>
                <Text style={[styles.hour, active && styles.activeText]}>
                  {item.hour}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No consumption records yet.</Text>
      )}

      {/* Legend & Summary Footer */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: primitives.green400 }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: primitives.amber500 }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: primitives.red600 }]} />
          <Text style={styles.legendText}>Peak</Text>
        </View>
        <Text style={styles.legendHint}>Badges = Wh×10</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.stat}>
          <Text style={styles.label}>Total today</Text>
          <Text style={styles.value}>{total.toFixed(2)} kWh</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.label}>Avg / hour</Text>
          <Text style={styles.value}>
            {(recorded.length ? total / recorded.length : 0).toFixed(2)} kWh
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.label}>Peak hour</Text>
          <Text style={styles.value}>
            {peak && (peak.energyKwh ?? 0) > 0 ? hourLabel(peak.hour) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headlineWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  headlineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headlineValue: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  costTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  costTagText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headlineSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  plot: {
    paddingTop: 10,
    paddingBottom: 6,
    gap: 4,
  },
  slot: {
    width: 32,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeSlot: {
    backgroundColor: colors.primaryTint,
  },
  barArea: {
    height: 142,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  calloutBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  capsuleBar: {
    width: 8,
    borderRadius: radii.pill,
  },
  capsuleBarActive: {
    width: 10,
  },
  hour: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  activeText: {
    color: colors.text,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  legendHint: {
    marginLeft: 'auto',
    fontSize: 11,
    color: colors.subtle,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 12,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    minWidth: 85,
    gap: 3,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    paddingVertical: 24,
    color: colors.muted,
  },
});
