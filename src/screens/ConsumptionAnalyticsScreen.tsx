import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Section } from '../components/Screen';
import { colors, radii, spacing, ui } from '../theme/theme';
import { useHems } from '../context/HemsContext';
import { EnergyAreaChart } from '../components/EnergyAreaChart';
import { TopConsumersCard } from '../components/TopConsumersCard';
import { DualBarChart } from '../components/DualBarChart';
import { PrintableReportModal } from '../components/PrintableReportModal';
import { combineHourly, formatCost } from '../utils/consumption';

export const ConsumptionAnalyticsScreen: React.FC = () => {
  const { consumptionRooms: rooms, nodes, report, todaySavedKwh, setActiveTab } = useHems();
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [roomId, setRoomId] = useState('all');
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Reset selected room filter if that plug was deleted
  useEffect(() => {
    if (roomId !== 'all' && !rooms.some((r) => r.roomId === roomId)) {
      setRoomId('all');
    }
  }, [roomId, rooms]);

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
          icon: (node?.icon ||
            (idx === 0
              ? 'sofa-outline'
              : idx === 1
              ? 'bed-outline'
              : 'power-socket-eu')) as keyof typeof MaterialCommunityIcons.glyphMap,
        };
      }),
    [rooms, nodes, period]
  );

  return (
    <Screen
      title="Usage"
      subtitle={`${date ?? 'Today'} · Manila time`}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open printable report"
          onPress={() => setReportModalVisible(true)}
          style={({ pressed }) => [styles.reportHeaderBtn, pressed && { opacity: 0.8 }]}
        >
          <MaterialCommunityIcons name="printer-outline" size={16} color={colors.primaryText} />
          <Text style={styles.reportHeaderText}>Report</Text>
        </Pressable>
      }
    >
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

      {/* Electricity Total Section */}
      <Section title="Electricity Total" pill={formatCost(total, tariff)}>
        <EnergyAreaChart
          data={hours}
          usedKwh={total}
          savedKwh={savedForPeriod}
          tariffPerKwh={tariff}
        />
        <Text style={styles.footnote}>
          Estimated at {formatCost(1, tariff)}/kWh · Synced with active smart plugs
        </Text>
      </Section>

      {/* Top Consumers Ranked Section */}
      <Section title="Top Consumers">
        <TopConsumersCard
          items={consumerItems}
          tariffPerKwh={tariff}
          ctaLabel="Manage all plugs"
          onCtaPress={() => setActiveTab('appliances')}
        />
      </Section>

      {/* Hourly Intensity Capsule Chart */}
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

      {/* Printable Energy Audit Report Card */}
      <Section title="Energy Audit Report">
        <View style={ui.card}>
          <View style={ui.row}>
            <View style={styles.reportCardIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
            </View>
            <View style={ui.grow}>
              <Text style={styles.reportCardTitle}>Printable Report &amp; CSV Export</Text>
              <Text style={ui.muted}>
                Preview, print, save as PDF, or export a spreadsheet of your plug telemetry and
                costs.
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setReportModalVisible(true)}
            style={({ pressed }) => [ui.softButton, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons name="printer" size={18} color={colors.primaryText} />
            <Text style={ui.softButtonText}>Preview &amp; Print Report</Text>
          </Pressable>
        </View>
      </Section>

      <PrintableReportModal
        visible={reportModalVisible}
        initialPeriod={period}
        onClose={() => setReportModalVisible(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  reportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 11,
    minHeight: 36,
    borderRadius: radii.pill,
  },
  reportHeaderText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
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
  reportCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
