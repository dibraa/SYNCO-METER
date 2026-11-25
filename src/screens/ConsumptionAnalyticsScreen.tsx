import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Section } from '../components/Screen';
import { colors, radii, spacing, ui } from '../theme/theme';
import { useHems } from '../context/HemsContext';
import { EnergyAreaChart } from '../components/EnergyAreaChart';
import { TopConsumersCard } from '../components/TopConsumersCard';
import { DualBarChart } from '../components/DualBarChart';
import { combineHourly, formatCost } from '../utils/consumption';

export const ConsumptionAnalyticsScreen: React.FC = () => {
  const { consumptionRooms: rooms, nodes, report, todaySavedKwh, setActiveTab } = useHems();
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [roomId, setRoomId] = useState('all');

  const tariff = report.tariffPerKwh;
  const total = rooms.reduce(
    (sum, room) => sum + (period === 'day' ? room.todayKwh : room.monthKwh),
    0
  );
  const savedForPeriod = period === 'day' ? todaySavedKwh : report.autoSavedKwh;
  const selectedRoom = rooms.find((room) => room.roomId === roomId);
  const hours = useMemo(
    () => (selectedRoom ? selectedRoom.hourly : combineHourly(rooms)),
    [rooms, selectedRoom]
  );
  const date = rooms[0]?.date;

  const consumerItems = useMemo(
    () =>
      rooms.map((room, idx) => {
        const node = nodes.find((n) => n.id === room.roomId);
        return {
          id: room.roomId,
          name: room.name,
          location: room.location,
          kwh: period === 'day' ? room.todayKwh : room.monthKwh,
          activePowerWatts: node?.activePowerWatts,
          relayState: node?.relayState,
          icon: (idx === 0 ? 'sofa-outline' : 'bed-outline') as keyof typeof MaterialCommunityIcons.glyphMap,
        };
      }),
    [rooms, nodes, period]
  );

  return (
    <Screen title="Usage" subtitle={`${date ?? 'Today'} · Manila time`}>
      {/* Segmented Period Selector */}
      <View style={styles.periodTrack}>
        {(['day', 'month'] as const).map((value) => {
          const active = period === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              aria-selected={active}
              onPress={() => setPeriod(value)}
              style={[styles.periodBtn, active && styles.periodBtnActive]}
            >
              <Text style={[styles.periodText, active && styles.periodTextActive]}>
                {value === 'day' ? 'Today' : 'This Month'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Electricity Total Section (Inspo Screen 2) */}
      <Section title="Electricity Total" pill={formatCost(total, tariff)}>
        <EnergyAreaChart
          data={hours}
          usedKwh={total}
          savedKwh={savedForPeriod}
          tariffPerKwh={tariff}
        />
        <Text style={styles.footnote}>
          Estimated at {formatCost(1, tariff)}/kWh · Demo snapshot synced with room nodes
        </Text>
      </Section>

      {/* Top Consumers Ranked Section (Inspo Screen 3) */}
      <Section title="Top Consumers">
        <TopConsumersCard
          items={consumerItems}
          tariffPerKwh={tariff}
          ctaLabel="Manage all plugs"
          onCtaPress={() => setActiveTab('appliances')}
        />
      </Section>

      {/* Hourly Intensity Capsule Chart (Inspo Screen 3 Electricity Prices) */}
      <Section title="Hourly Load Intensity" pill={`${formatCost(1, tariff)}/kWh`}>
        <View style={ui.card}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {[
              { id: 'all', name: 'All rooms' },
              ...rooms.map((room) => ({ id: room.roomId, name: room.name })),
            ].map((option) => {
              const selected = roomId === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setRoomId(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  aria-selected={selected}
                  style={[styles.filterPill, selected && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <DualBarChart
            key={roomId}
            data={hours}
            roomName={selectedRoom?.name ?? 'All rooms'}
            tariffPerKwh={tariff}
          />
        </View>
      </Section>
    </Screen>
  );
};

const styles = StyleSheet.create({
  periodTrack: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    padding: 3,
    borderRadius: 14,
  },
  periodBtn: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  periodBtnActive: {
    backgroundColor: colors.surface,
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  periodTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 12,
    color: colors.muted,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  filters: {
    gap: spacing.sm,
    paddingBottom: 4,
  },
  filterPill: {
    minHeight: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  filterTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
});
