import React, { useState } from 'react';
import { View, Text, Switch, Pressable, Modal, StyleSheet } from 'react-native';
import { Screen, Section, SettingRow } from '../components/Screen';
import { useHems } from '../context/HemsContext';
import { colors, ui } from '../theme/theme';

export const ProfileScreen = () => {
  const { signOut, report } = useHems();
  const [notifications, setNotifications] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  return <Screen title="Settings" subtitle="Account and preferences">
    <Section title="Account"><View style={ui.card}>
      <SettingRow label="Demo profile" value="Juan Dela Cruz · juan@example.com" />
      <View style={ui.divider} /><SettingRow label="Edit profile" unavailable />
    </View></Section>
    <Section title="Preferences"><View style={ui.card}>
      <SettingRow label="Notifications" value="Demo preference only"><Switch hitSlop={12} value={notifications} onValueChange={setNotifications} accessibilityLabel="Notifications" trackColor={{ false: colors.border, true: colors.green }} thumbColor="#FFFFFF" /></SettingRow>
      <View style={ui.divider} /><SettingRow label="Tariff rate" value={`₱${report.tariffPerKwh.toFixed(2)}/kWh · editing unavailable`} unavailable />
      <View style={ui.divider} /><SettingRow label="Cutoff reminders" unavailable />
    </View></Section>
    <Section title="Security"><View style={ui.card}>
      <SettingRow label="Change password" unavailable /><View style={ui.divider} />
      <SettingRow label="Two-factor authentication" unavailable /><View style={ui.divider} />
      <SettingRow label="Biometric login" unavailable />
    </View></Section>
    <View style={ui.card}><SettingRow label="Delete account" unavailable /></View>
    <Pressable accessibilityRole="button" onPress={() => setConfirmSignOut(true)} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>
    <Text style={[ui.muted, { textAlign: 'center' }]}>SYNCO METER · Demo version</Text>
    <Modal visible={confirmSignOut} transparent animationType="none" onRequestClose={() => setConfirmSignOut(false)}>
      <View style={styles.backdrop}><View style={styles.dialog} accessibilityViewIsModal>
        <Text style={ui.heading}>Sign out of the demo?</Text><Text style={ui.body}>You’ll return to the sign-in screen.</Text>
        <Pressable accessibilityRole="button" onPress={() => { setConfirmSignOut(false); signOut(); }} style={ui.action}><Text style={ui.actionText}>Sign out</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setConfirmSignOut(false)} style={styles.signOut}><Text style={styles.signOutText}>Cancel</Text></Pressable>
      </View></View>
    </Modal>
  </Screen>;
};
const styles = StyleSheet.create({
  signOut: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: colors.surface },
  signOutText: { fontSize: 15, fontWeight: '600', color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(23,43,34,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { ...ui.card, width: '100%', maxWidth: 400, gap: 16 },
});
