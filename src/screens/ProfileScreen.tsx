import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Section, SettingRow } from '../components/Screen';
import { useHems } from '../context/HemsContext';
import { colors, radii, spacing, ui } from '../theme/theme';
import {
  getSupabase,
  isSupabaseConfigured,
  getLoadedConfig,
  onSupabaseConfigChange,
} from '../services/supabaseClient';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

export const ProfileScreen = () => {
  const { signOut, report } = useHems();
  const [notifications, setNotifications] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const [userEmail, setUserEmail] = useState<string>('guest@syncometer.local');
  const [userName, setUserName] = useState<string>('Demo User');
  const [isCloudLinked, setIsCloudLinked] = useState<boolean>(isSupabaseConfigured());
  const [deviceId, setDeviceId] = useState<string>(getLoadedConfig().deviceId);

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabase();
      if (supabase && isSupabaseConfigured()) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            setUserEmail(user.email || 'user@example.com');
            const fullName =
              user.user_metadata?.full_name || user.email?.split('@')[0] || 'Homeowner';
            setUserName(fullName);
          }
        } catch {
          // Fall back to default
        }
      }
    }

    loadUser();

    const unsub = onSupabaseConfigChange((cfg) => {
      setIsCloudLinked(isSupabaseConfigured());
      setDeviceId(cfg.deviceId);
      loadUser();
    });

    return () => unsub();
  }, []);

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <Screen title="Settings" subtitle="Account, telemetry & preferences">
      {/* Profile Identity Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'SM'}</Text>
        </View>
        <View style={ui.grow}>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {userEmail}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isCloudLinked ? colors.successSoft : colors.primarySoft },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: isCloudLinked ? colors.successText : colors.primaryText },
            ]}
          >
            {isCloudLinked ? 'Cloud' : 'Demo'}
          </Text>
        </View>
      </View>

      {/* Connection Settings */}
      <Section title="Connection">
        <View style={styles.groupedCard}>
          <SettingRow
            label="Backend Status"
            value={isCloudLinked ? 'Connected to Supabase Realtime' : 'Offline simulation mode'}
            icon="cloud-check-outline"
            iconBg={isCloudLinked ? colors.successSoft : colors.primarySoft}
            iconColor={isCloudLinked ? colors.successText : colors.primaryText}
          >
            <View
              style={[
                styles.badge,
                { backgroundColor: isCloudLinked ? colors.successSoft : colors.warningSoft },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isCloudLinked ? colors.successText : colors.warningText },
                ]}
              >
                {isCloudLinked ? 'Linked' : 'Offline'}
              </Text>
            </View>
          </SettingRow>

          <View style={ui.divider} />

          <SettingRow
            label="Target Smart Meter"
            value={deviceId || 'ESP32-PZEM-DEV-01'}
            icon="chip"
            iconBg={colors.surfaceMuted}
            iconColor={colors.textSecondary}
          />

          <View style={styles.cardFooterAction}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfigModalVisible(true)}
              style={({ pressed }) => [ui.softButton, pressed && { opacity: 0.8 }]}
            >
              <MaterialCommunityIcons name="cog-outline" size={18} color={colors.primaryText} />
              <Text style={ui.softButtonText}>Configure connection</Text>
            </Pressable>
          </View>
        </View>
      </Section>

      {/* System Preferences */}
      <Section title="Preferences">
        <View style={styles.groupedCard}>
          <SettingRow
            label="Notifications"
            value="Overload & standby cutoff alerts"
            icon="bell-ring-outline"
            iconBg={colors.primarySoft}
            iconColor={colors.primaryText}
          >
            <Switch
              hitSlop={12}
              value={notifications}
              onValueChange={setNotifications}
              accessibilityLabel="Notifications"
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              {...({ activeThumbColor: '#FFFFFF' } as object)}
            />
          </SettingRow>

          <View style={ui.divider} />

          <SettingRow
            label="Electricity Tariff"
            value={`₱${report.tariffPerKwh.toFixed(2)}/kWh · Meralco Residential`}
            icon="cash-multiple"
            iconBg={colors.successSoft}
            iconColor={colors.successText}
          />

          <View style={ui.divider} />

          <SettingRow
            label="Cutoff reminders"
            icon="timer-outline"
            iconBg={colors.warningSoft}
            iconColor={colors.warningText}
            unavailable
          />
        </View>
      </Section>

      {/* Account & Security */}
      <Section title="Account & Security">
        <View style={styles.groupedCard}>
          <SettingRow
            label="Edit profile"
            icon="account-edit-outline"
            iconBg={colors.surfaceMuted}
            iconColor={colors.textSecondary}
            unavailable
          />
          <View style={ui.divider} />
          <SettingRow
            label="Change password"
            icon="lock-outline"
            iconBg={colors.surfaceMuted}
            iconColor={colors.textSecondary}
            unavailable
          />
          <View style={ui.divider} />
          <SettingRow
            label="Two-factor authentication"
            icon="shield-check-outline"
            iconBg={colors.surfaceMuted}
            iconColor={colors.textSecondary}
            unavailable
          />
        </View>
      </Section>

      {/* Sign Out */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirmSignOut(true)}
        style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
      >
        <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={[ui.muted, { textAlign: 'center', marginTop: -4 }]}>
        SYNCO METER · IoT Smart Meter & Standby Reduction
      </Text>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={confirmSignOut}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmSignOut(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text style={ui.heading}>Sign out of SYNCO METER?</Text>
            <Text style={ui.body}>
              You will return to the login screen and your active cloud session will be cleared.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirmSignOut(false);
                signOut();
              }}
              style={({ pressed }) => [styles.dangerModalBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={ui.actionText}>Sign out</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmSignOut(false)}
              style={({ pressed }) => [styles.cancelModalBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSaveSuccess={(cfg) => {
          setIsCloudLinked(Boolean(cfg.url && cfg.anonKey));
          setDeviceId(cfg.deviceId);
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    ...ui.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupedCard: {
    ...ui.card,
    paddingVertical: 8,
    gap: 2,
  },
  cardFooterAction: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  signOutBtn: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
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
