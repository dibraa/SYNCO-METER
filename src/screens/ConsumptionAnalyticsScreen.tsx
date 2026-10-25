import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { colors } from '../theme/theme';
import { useHems } from '../context/HemsContext';
import { DualBarChart } from '../components/DualBarChart';
import { combineHourly, formatCost } from '../utils/consumption';

export const ConsumptionAnalyticsScreen: React.FC = () => {
  const { consumptionRooms: rooms, report } = useHems();
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [roomId, setRoomId] = useState('all');
  const tariff = report.tariffPerKwh;
  const total = rooms.reduce((sum, room) => sum + (period === 'day' ? room.todayKwh : room.monthKwh), 0);
  const selectedRoom = rooms.find(room => room.roomId === roomId);
  const hours = useMemo(() => selectedRoom ? selectedRoom.hourly : combineHourly(rooms), [rooms, selectedRoom]);
  const date = rooms[0]?.date;

  return (
    <Screen title="Usage" subtitle="Consumption and estimated cost">
      <View>
        <View style={styles.demoRow}><Text style={styles.muted}>{date ?? 'No records'} · Manila time · Demo snapshot</Text></View>
        <View style={styles.periods}>
          {(['day', 'month'] as const).map(value => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: period === value }} aria-selected={period === value}
              onPress={() => setPeriod(value)} style={[styles.period, period === value && styles.periodActive]}>
              <Text style={styles.periodText}>{value === 'day' ? 'Today' : 'This month'}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>{period === 'day' ? 'Today’s consumption' : 'This month’s consumption'}</Text>
          <View style={styles.totals}>
            <Text style={styles.total}>{total.toFixed(2)} <Text style={styles.unit}>kWh</Text></Text>
            <View><Text style={styles.muted}>Estimated cost</Text><Text style={styles.cost}>{formatCost(total, tariff)}</Text></View>
          </View>
          <View style={styles.shares}>
            {rooms.map(room => {
              const energy = period === 'day' ? room.todayKwh : room.monthKwh;
              return <Text key={room.roomId} style={styles.muted}>{room.name}: {total ? Math.round(energy / total * 100) : 0}%</Text>;
            })}
          </View>
          <Text style={styles.note}>Estimated at {formatCost(1, tariff)}/kWh</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Today’s consumption</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {[{ id: 'all', name: 'All rooms' }, ...rooms.map(room => ({ id: room.roomId, name: room.name }))].map(option => (
              <Pressable key={option.id} onPress={() => setRoomId(option.id)} accessibilityRole="button"
                accessibilityState={{ selected: roomId === option.id }} aria-selected={roomId === option.id}
                style={[styles.filter, roomId === option.id && styles.filterActive]}>
                <Text style={[styles.filterText, roomId === option.id && styles.filterTextActive]}>{option.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <DualBarChart key={roomId} data={hours} roomName={selectedRoom?.name ?? 'All rooms'} />
        </View>

        <Text style={styles.sectionTitle}>Room consumption</Text>
        {rooms.length === 0 && <Text style={styles.muted}>No room records yet.</Text>}
        {rooms.map(room => (
          <View key={room.roomId} style={styles.card}>
            <Text style={styles.title}>{room.name}</Text>
            <Text style={styles.subtitle}>{room.location}</Text>
            <View style={styles.roomTotals}>
              <View style={styles.roomPeriod}><Text style={styles.muted}>Today</Text><Text style={styles.roomEnergy}>{room.todayKwh.toFixed(2)} kWh</Text><Text style={styles.roomCost}>{formatCost(room.todayKwh, tariff)}</Text></View>
              <View style={styles.roomPeriod}><Text style={styles.muted}>This month</Text><Text style={styles.roomEnergy}>{room.monthKwh.toFixed(2)} kWh</Text><Text style={styles.roomCost}>{formatCost(room.monthKwh, tariff)}</Text></View>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  muted: { fontSize: 12, color: colors.muted },
  periods: { flexDirection: 'row', backgroundColor: colors.border, padding: 3, borderRadius: 14, marginBottom: 16 },
  period: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 11 },
  periodActive: { backgroundColor: colors.greenSoft },
  periodText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  totals: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 14 },
  total: { fontSize: 30, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 16, color: colors.green },
  cost: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4, fontVariant: ['tabular-nums'] },
  shares: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  note: { fontSize: 12, color: colors.muted, marginTop: 12 },
  filters: { gap: 8, paddingTop: 14 },
  filter: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  filterTextActive: { color: colors.green },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  roomTotals: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.neutral },
  roomPeriod: { flex: 1, minWidth: 110, gap: 5 },
  roomEnergy: { fontSize: 18, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  roomCost: { fontSize: 14, fontWeight: '600', color: colors.green, fontVariant: ['tabular-nums'] },
  footnote: { fontSize: 12, color: colors.muted, lineHeight: 17 },
});
