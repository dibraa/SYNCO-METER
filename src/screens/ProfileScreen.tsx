import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Section, SettingRow } from '../components/Screen';
import { useHems } from '../context/HemsContext';
import { colors, ui } from '../theme/theme';
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
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserEmail(user.email || 'user@example.com');
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Homeowner';
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

  return (
    <Screen title="Settings" subtitle="Account and cloud preferences">
      {/* Account Info */}
      <Section title="Account">
        <View style={ui.card}>
          <SettingRow
            label={isCloudLinked ? 'Account' : 'Guest / Demo Profile'}
            value={`${userName} · ${userEmail}`}
          />
          <View style={ui.divider} />
          <SettingRow label="Edit profile" unavailable />
        </View>
      </Section>

      {/* Cloud & Supabase Section */}
      <Section title="Connection settings">
        <View style={ui.card}>
          <SettingRow
            label="Backend Status"
            value={isCloudLinked ? `Connected` : 'Offline / Demo Simulation Mode'}
          >
            <View
              style={[
                styles.badge,
                { backgroundColor: isCloudLinked ? colors.greenSoft : colors.amberSoft },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isCloudLinked ? colors.green : colors.amber },
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
          />

          <View style={ui.divider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => setConfigModalVisible(true)}
            style={styles.configureButton}
          >
            <MaterialCommunityIcons name="cloud-cog-outline" size={20} color={colors.green} />
            <Text style={styles.configureText}>Configure connection</Text>
          </Pressable>
        </View>
      </Section>

      {/* System Preferences */}
      <Section title="Preferences">
        <View style={ui.card}>
          <SettingRow label="Notifications" value="System & Cutoff Alerts">
            <Switch
              hitSlop={12}
              value={notifications}
              onValueChange={setNotifications}
              accessibilityLabel="Notifications"
              trackColor={{ false: colors.border, true: colors.green }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
          <View style={ui.divider} />
          <SettingRow
            label="Tariff rate"
            value={`₱${report.tariffPerKwh.toFixed(2)}/kWh · Meralco Residential`}
          />
          <View style={ui.divider} />
          <SettingRow label="Cutoff reminders" unavailable />
        </View>
      </Section>

      {/* Security */}
      <Section title="Security">
        <View style={ui.card}>
          <SettingRow label="Change password" unavailable />
          <View style={ui.divider} />
          <SettingRow label="Two-factor authentication" unavailable />
        </View>
      </Section>

      {/* Sign Out */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirmSignOut(true)}
        style={styles.signOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={[ui.muted, { textAlign: 'center' }]}>
        SYNCO METER · IoT Smart Meter & Standby Reduction Capstone
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
              You will return to the login screen and your cloud session will be cleared.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirmSignOut(false);
                signOut();
              }}
              style={ui.action}
            >
              <Text style={ui.actionText}>Sign out</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmSignOut(false)}
              style={styles.signOut}
            >
              <Text style={styles.signOutText}>Cancel</Text>
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
  signOut: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surface,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,43,34,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    ...ui.card,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  configureText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.green,
  },
});
