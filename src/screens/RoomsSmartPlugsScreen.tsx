import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { PlugInput, SmartNode, SystemMode } from '../types/hems';
import { Screen, Section, SettingRow } from '../components/Screen';
import { RoomSummary } from '../components/RoomSummary';
import { PlugEditorModal } from '../components/PlugEditorModal';
import { colors, radii, spacing, ui } from '../theme/theme';

const MODES: { id: SystemMode; label: string; hint: string }[] = [
  { id: 'Auto', label: 'Auto', hint: 'Cuts vacant plugs automatically' },
  { id: 'Eco', label: 'Eco', hint: 'Tighter standby thresholds' },
  { id: 'Manual', label: 'Manual', hint: 'Full manual relay control' },
];

export const RoomsSmartPlugsScreen = () => {
  const {
    nodes,
    totalPowerWatts,
    toggleNodeRelay,
    extendCutoff,
    addPlug,
    renamePlug,
    deletePlug,
    systemMode,
    setSystemMode,
  } = useHems();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPlug, setEditingPlug] = useState<SmartNode | null>(null);
  const [pendingDeletePlug, setPendingDeletePlug] = useState<SmartNode | null>(null);

  const activeCount = nodes.filter((node) => node.relayState).length;
  const activeModeObj = MODES.find((m) => m.id === systemMode) ?? MODES[0];

  const openAddModal = () => {
    setEditingPlug(null);
    setEditorVisible(true);
  };

  const openEditModal = (plug: SmartNode) => {
    setEditingPlug(plug);
    setEditorVisible(true);
  };

  const handleSavePlug = async (input: PlugInput, existingId?: string) => {
    if (existingId) {
      await renamePlug(existingId, input);
    } else {
      await addPlug(input);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeletePlug) return;
    const id = pendingDeletePlug.id;
    setPendingDeletePlug(null);
    await deletePlug(id);
  };

  return (
    <Screen
      title="Smart Plugs"
      subtitle="Live load & room relay controls"
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add smart plug"
          onPress={openAddModal}
          style={({ pressed }) => [styles.addHeaderBtn, pressed && { opacity: 0.82 }]}
        >
          <MaterialCommunityIcons name="plus" size={17} color="#FFFFFF" />
          <Text style={styles.addHeaderText}>Add Plug</Text>
        </Pressable>
      }
    >
      {/* Active Load & System Mode Card */}
      <View style={ui.card}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}>
            <MaterialCommunityIcons name="power-plug-outline" size={22} color={colors.primary} />
          </View>
          <View style={ui.grow}>
            <Text style={styles.summaryTitle}>
              {activeCount} of {nodes.length} plugs active
            </Text>
            <Text style={ui.muted}>{activeModeObj.hint}</Text>
          </View>
          <View style={ui.pill}>
            <Text style={ui.pillText}>{totalPowerWatts.toLocaleString()} W</Text>
          </View>
        </View>

        <View style={styles.modeTrack}>
          {MODES.map((mode) => {
            const selected = systemMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                aria-selected={selected}
                onPress={() => setSystemMode(mode.id)}
                style={[styles.modeBtn, selected && styles.modeBtnActive]}
              >
                <Text style={[styles.modeText, selected && styles.modeTextActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Connected Rooms */}
      <Section title="Connected Rooms" actionLabel="+ Add Plug" onAction={openAddModal}>
        {nodes.map((node) => (
          <RoomSummary
            key={node.id}
            node={node}
            detailed
            onToggle={() => toggleNodeRelay(node.id)}
            onExtend={() => extendCutoff(node.id, 30)}
            onEdit={() => openEditModal(node)}
            onDelete={() => setPendingDeletePlug(node)}
          />
        ))}
        {!nodes.length ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="power-socket-eu"
                size={28}
                color={colors.primaryText}
              />
            </View>
            <Text style={ui.heading}>No smart plugs yet</Text>
            <Text style={[ui.muted, { textAlign: 'center' }]}>
              Add an ESP32 + PZEM-004T plug to start monitoring power and controlling relays.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={openAddModal}
              style={({ pressed }) => [ui.action, { width: '100%' }, pressed && { opacity: 0.85 }]}
            >
              <MaterialCommunityIcons name="plus" size={19} color="#FFFFFF" />
              <Text style={ui.actionText}>Add Your First Plug</Text>
            </Pressable>
          </View>
        ) : null}
      </Section>

      {/* Automation Settings */}
      <View style={ui.card}>
        <SettingRow
          label="Automation schedules"
          value="Vacancy timers & overnight cutoffs"
          icon="clock-check-outline"
          unavailable
        />
      </View>

      {/* Add / Rename Plug Modal */}
      <PlugEditorModal
        visible={editorVisible}
        editingPlug={editingPlug}
        existingCodes={nodes.map((n) => n.code)}
        nextIndex={nodes.length + 1}
        onClose={() => setEditorVisible(false)}
        onSave={handleSavePlug}
        onDelete={deletePlug}
      />

      {/* Delete Plug Confirmation Modal */}
      <Modal
        visible={Boolean(pendingDeletePlug)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeletePlug(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text style={ui.heading}>Delete "{pendingDeletePlug?.name}"?</Text>
            <Text style={ui.body}>
              This removes the plug from your dashboard, consumption analytics, and printable
              reports.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm delete plug"
              onPress={handleConfirmDelete}
              style={({ pressed }) => [styles.dangerModalBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={ui.actionText}>Delete Plug</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPendingDeletePlug(null)}
              style={({ pressed }) => [styles.cancelModalBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: radii.pill,
  },
  addHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modeTrack: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    padding: 3,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: colors.surface,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  modeTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  emptyCard: {
    ...ui.card,
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    ...ui.card,
    width: '100%',
    maxWidth: 400,
    padding: 22,
    gap: 14,
  },
  dangerModalBtn: {
    minHeight: 46,
    borderRadius: radii.control,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtn: {
    minHeight: 46,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
