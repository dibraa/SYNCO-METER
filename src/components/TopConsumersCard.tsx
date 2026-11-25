import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, primitives, radii, spacing, ui } from '../theme/theme';
import { formatCost } from '../utils/consumption';

export interface ConsumerItem {
  id: string;
  name: string;
  location: string;
  kwh: number;
  activePowerWatts?: number;
  relayState?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface TopConsumersCardProps {
  items: ConsumerItem[];
  tariffPerKwh: number;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

const RANK_COLORS = [primitives.amber500, primitives.green300, primitives.blue500];

export const TopConsumersCard: React.FC<TopConsumersCardProps> = ({
  items,
  tariffPerKwh,
  ctaLabel = 'Manage all plugs',
  onCtaPress,
}) => {
  const sorted = [...items].sort((a, b) => b.kwh - a.kwh);
  const totalKwh = sorted.reduce((sum, item) => sum + item.kwh, 0);

  return (
    <View style={ui.card}>
      {sorted.length === 0 ? (
        <Text style={ui.muted}>No consumer records available yet.</Text>
      ) : (
        sorted.map((item, idx) => {
          const share = totalKwh > 0 ? Math.round((item.kwh / totalKwh) * 100) : 0;
          const rankColor = RANK_COLORS[idx % RANK_COLORS.length];
          const iconName =
            item.icon ||
            (idx === 0 ? 'sofa-outline' : idx === 1 ? 'bed-outline' : 'power-socket-eu');

          return (
            <View key={item.id}>
              <View style={styles.row}>
                {/* Icon + numbered circular rank badge matching Inspo Screen 3 */}
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name={iconName} size={22} color={colors.text} />
                  <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                    <Text style={styles.rankText}>{idx + 1}</Text>
                  </View>
                </View>

                {/* Name + kWh & share + thin progress bar */}
                <View style={ui.grow}>
                  <View style={styles.titleRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.activePowerWatts !== undefined && item.relayState !== undefined ? (
                      <Text style={styles.liveMeta}>
                        {item.relayState ? `${item.activePowerWatts} W` : 'Off'}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.subtitle}>
                    {item.kwh.toFixed(2)} kWh · {share}% of total
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(8, share)}%`,
                          backgroundColor: rankColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Right soft-blue cost pill */}
                <View style={ui.pill}>
                  <Text style={ui.pillText}>{formatCost(item.kwh, tariffPerKwh)}</Text>
                </View>
              </View>

              {idx < sorted.length - 1 ? <View style={styles.rowDivider} /> : null}
            </View>
          );
        })
      )}

      {onCtaPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCtaPress}
          style={({ pressed }) => [ui.softButton, pressed && styles.pressed]}
        >
          <Text style={ui.softButtonText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  liveMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    marginTop: 7,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: radii.pill,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
});
