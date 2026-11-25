import React from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SmartNode } from '../types/hems';
import { Disclosure } from './Screen';
import { colors, radii, ui } from '../theme/theme';

export const countdownLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function RoomSummary({
  node,
  detailed = false,
  onToggle,
  onExtend,
  onEdit,
  onDelete,
}: {
  node: SmartNode;
  detailed?: boolean;
  onToggle: () => void;
  onExtend: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
    node.icon ||
    (node.id === 'node-1'
      ? 'sofa-outline'
      : node.id === 'node-2'
      ? 'bed-outline'
      : 'power-socket-eu');

  const iconBg = !node.relayState
    ? colors.surfaceMuted
    : node.cutoffPending
    ? colors.warningSoft
    : colors.primarySoft;

  const iconColor = !node.relayState
    ? colors.subtle
    : node.cutoffPending
    ? colors.warningText
    : colors.primaryText;

  return (
    <View style={ui.card}>
      <View style={ui.row}>
        <View style={[styles.iconTile, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={ui.grow}>
          <Text style={styles.name}>{node.name}</Text>
          <Text style={styles.location}>{node.location}</Text>
        </View>

        <Switch
          hitSlop={12}
          value={node.relayState}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
          {...({ activeThumbColor: '#FFFFFF' } as object)}
          accessibilityLabel={`${node.name} power`}
        />
      </View>

      <View style={styles.statusRow}>
        <View style={styles.wattPill}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={15}
            color={node.relayState ? colors.primary : colors.subtle}
          />
          <Text style={[styles.watts, !node.relayState && styles.wattsOff]}>
            {node.relayState ? `${node.activePowerWatts.toLocaleString()} W` : '0 W'}
          </Text>
        </View>

        <View style={styles.chips}>
          <View
            style={[
              styles.stateChip,
              {
                backgroundColor:
                  node.occupancy === 'Occupied' ? colors.successSoft : colors.warningSoft,
              },
            ]}
          >
            <View
              style={[
                styles.stateDot,
                {
                  backgroundColor:
                    node.occupancy === 'Occupied' ? colors.success : colors.warning,
                },
              ]}
            />
            <Text
              style={[
                styles.stateText,
                {
                  color:
                    node.occupancy === 'Occupied' ? colors.successText : colors.warningText,
                },
              ]}
            >
              {node.occupancy}
            </Text>
          </View>

          <View style={styles.stateChipNeutral}>
            <Text style={styles.stateTextNeutral}>
              {node.relayState ? 'On' : 'Off'}
              {!node.isOnline ? ' · Offline' : ''}
            </Text>
          </View>
        </View>
      </View>

      {node.cutoffPending ? (
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <MaterialCommunityIcons
              name="timer-sand"
              size={18}
              color={colors.warningText}
            />
            <Text style={styles.warningText}>
              Vacant auto-cutoff in {countdownLabel(node.cutoffCountdownSeconds)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Keep ${node.name} on for 30 minutes`}
            onPress={onExtend}
            style={({ pressed }) => [styles.extendBtn, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons
              name="clock-plus-outline"
              size={16}
              color={colors.warningText}
            />
            <Text style={styles.extendText}>Keep on for 30 minutes</Text>
          </Pressable>
        </View>
      ) : null}

      {onEdit || onDelete ? (
        <View style={styles.manageRow}>
          {onEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Rename ${node.name}`}
              onPress={onEdit}
              style={({ pressed }) => [styles.editChip, pressed && { opacity: 0.78 }]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.primaryText} />
              <Text style={styles.editChipText}>Rename</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${node.name}`}
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteChip, pressed && { opacity: 0.78 }]}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.danger} />
              <Text style={styles.deleteChipText}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {detailed ? (
        <Disclosure title="Electrical telemetry & device info">
          <View style={styles.specGrid}>
            <View style={styles.specCell}>
              <Text style={styles.specLabel}>Today</Text>
              <Text style={styles.specVal}>{node.todayKwh.toFixed(2)} kWh</Text>
            </View>
            <View style={styles.specCell}>
              <Text style={styles.specLabel}>Voltage</Text>
              <Text style={styles.specVal}>{node.voltage.toFixed(1)} V</Text>
            </View>
            <View style={styles.specCell}>
              <Text style={styles.specLabel}>Current</Text>
              <Text style={styles.specVal}>{node.current.toFixed(2)} A</Text>
            </View>
            <View style={styles.specCell}>
              <Text style={styles.specLabel}>Power Factor</Text>
              <Text style={styles.specVal}>{node.powerFactor.toFixed(2)}</Text>
            </View>
          </View>
          <Text style={styles.hardwareLine}>
            {node.hardware} · {node.frequency.toFixed(1)} Hz · ID {node.code}
          </Text>
        </Disclosure>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  location: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  wattPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watts: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: colors.text,
    letterSpacing: -0.3,
  },
  wattsOff: {
    color: colors.subtle,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stateChipNeutral: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  stateTextNeutral: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  warningBox: {
    backgroundColor: colors.amberSoft,
    borderRadius: radii.control,
    padding: 12,
    gap: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningText: {
    color: colors.warningText,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  extendBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: colors.warningSoft,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  extendText: {
    color: colors.warningText,
    fontWeight: '700',
    fontSize: 13,
  },
  manageRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  editChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  deleteChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  deleteChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.canvas,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  specLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  specVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  hardwareLine: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
