import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlugIconName, PlugInput, SmartNode } from '../types/hems';
import { colors, radii, shadows } from '../theme/theme';

const ICON_OPTIONS: { id: PlugIconName; label: string }[] = [
  { id: 'sofa-outline', label: 'Living' },
  { id: 'bed-outline', label: 'Bedroom' },
  { id: 'air-conditioner', label: 'AC' },
  { id: 'fridge-outline', label: 'Kitchen' },
  { id: 'television', label: 'Media' },
  { id: 'desk-lamp', label: 'Office' },
  { id: 'power-socket-eu', label: 'Plug' },
];

interface PlugEditorModalProps {
  visible: boolean;
  editingPlug: SmartNode | null;
  existingCodes: string[];
  nextIndex: number;
  onClose: () => void;
  onSave: (input: PlugInput, existingId?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const PlugEditorModal: React.FC<PlugEditorModalProps> = ({
  visible,
  editingPlug,
  existingCodes,
  nextIndex,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [code, setCode] = useState('');
  const [icon, setIcon] = useState<PlugIconName>('power-socket-eu');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isEditing = Boolean(editingPlug);

  useEffect(() => {
    if (!visible) return;
    setError('');
    setConfirmingDelete(false);
    setIsSaving(false);

    if (editingPlug) {
      setName(editingPlug.name);
      setLocation(editingPlug.location);
      setCode(editingPlug.code);
      setIcon(editingPlug.icon || 'power-socket-eu');
    } else {
      const padded = String(nextIndex).padStart(2, '0');
      setName('');
      setLocation('');
      setCode(`ESP32-PZEM-DEV-${padded}`);
      setIcon('power-socket-eu');
    }
  }, [visible, editingPlug, nextIndex]);

  const handleSave = async () => {
    setError('');
    const cleanName = name.trim();
    const cleanLocation = location.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError('Plug name is required.');
      return;
    }
    if (!cleanLocation) {
      setError('Room or location is required.');
      return;
    }
    if (!cleanCode) {
      setError('Hardware device ID is required.');
      return;
    }

    const otherCodes = existingCodes
      .filter((c) => !editingPlug || c.toUpperCase() !== editingPlug.code.toUpperCase())
      .map((c) => c.toUpperCase());

    if (otherCodes.includes(cleanCode)) {
      setError(`Device ID "${cleanCode}" is already used by another plug.`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        {
          name: cleanName,
          location: cleanLocation,
          code: cleanCode,
          icon,
        },
        editingPlug?.id
      );
      onClose();
    } catch {
      setError('Could not save plug changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingPlug || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(editingPlug.id);
      onClose();
    } catch {
      setError('Could not delete plug. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons
                  name={isEditing ? 'pencil-outline' : 'plus-circle-outline'}
                  size={22}
                  color={colors.primaryText}
                />
              </View>
              <View>
                <Text style={styles.title}>
                  {isEditing ? 'Rename & Edit Plug' : 'Add Smart Plug'}
                </Text>
                <Text style={styles.subtitle}>
                  {isEditing
                    ? 'Update label, room, icon, or device ID'
                    : 'Connect a new ESP32 + PZEM-004T node'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close plug editor"
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <MaterialCommunityIcons name="alert-circle" size={17} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Plug Name */}
            <Text style={styles.fieldLabel}>Plug Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kitchen Plug or Main AC"
              placeholderTextColor={colors.subtle}
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError('');
              }}
              accessibilityLabel="Plug name"
            />

            {/* Room / Location */}
            <Text style={styles.fieldLabel}>Room / Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kitchen, Living Room, Home Office"
              placeholderTextColor={colors.subtle}
              value={location}
              onChangeText={(t) => {
                setLocation(t);
                if (error) setError('');
              }}
              accessibilityLabel="Room or location"
            />

            {/* Device ID */}
            <Text style={styles.fieldLabel}>Hardware Device ID</Text>
            <TextInput
              style={styles.input}
              placeholder="ESP32-PZEM-DEV-03"
              placeholderTextColor={colors.subtle}
              value={code}
              onChangeText={(t) => {
                setCode(t);
                if (error) setError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Hardware device ID"
            />
            <Text style={styles.hint}>Matches device_id_str in Supabase public.devices</Text>

            {/* Icon Picker */}
            <Text style={styles.fieldLabel}>Room / Appliance Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((opt) => {
                const selected = icon === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setIcon(opt.id)}
                    style={[styles.iconChip, selected && styles.iconChipSelected]}
                  >
                    <MaterialCommunityIcons
                      name={opt.id}
                      size={18}
                      color={selected ? colors.primaryText : colors.textSecondary}
                    />
                    <Text style={[styles.iconChipText, selected && styles.iconChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Primary Save Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save plug changes' : 'Add plug'}
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.saveBtn,
                isSaving && { opacity: 0.7 },
                pressed && { opacity: 0.85 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={isEditing ? 'check' : 'plus'}
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Add Smart Plug'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Inline Delete Section in Edit Mode */}
            {isEditing && onDelete ? (
              <View style={styles.deleteSection}>
                {!confirmingDelete ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete plug"
                    onPress={() => setConfirmingDelete(true)}
                    style={({ pressed }) => [styles.deleteOutlineBtn, pressed && { opacity: 0.75 }]}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={colors.danger}
                    />
                    <Text style={styles.deleteOutlineText}>Delete Plug</Text>
                  </Pressable>
                ) : (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmTitle}>Delete "{editingPlug?.name}"?</Text>
                    <Text style={styles.confirmSub}>
                      This removes the smart plug from your dashboard, analytics, and reports.
                    </Text>
                    <View style={styles.confirmRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setConfirmingDelete(false)}
                        style={styles.cancelBtn}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleConfirmDelete}
                        disabled={isSaving}
                        style={styles.confirmDeleteBtn}
                      >
                        <Text style={styles.confirmDeleteText}>Confirm Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: '92%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.control,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.canvas,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    height: 48,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  iconChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  iconChipTextSelected: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    height: 50,
    marginTop: 22,
    ...shadows.button,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  deleteOutlineBtn: {
    minHeight: 46,
    borderRadius: radii.control,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  confirmBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.control,
    padding: 14,
    gap: 8,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
  },
  confirmSub: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  confirmDeleteBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
