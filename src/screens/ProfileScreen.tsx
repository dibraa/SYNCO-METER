import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';

type SettingRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isDanger?: boolean;
  rightElement?: React.ReactNode;
};

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor = '#6B7280',
  label,
  value,
  onPress,
  showChevron = true,
  isDanger = false,
  rightElement,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={!onPress && !rightElement}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconWrap, isDanger && styles.settingIconDanger]}>
          <MaterialCommunityIcons name={icon} size={20} color={isDanger ? '#EF4444' : iconColor} />
        </View>
        <Text style={[styles.settingLabel, isDanger && styles.settingLabelDanger]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {rightElement ? (
          rightElement
        ) : (
          <>
            {value ? <Text style={styles.settingValue}>{value}</Text> : null}
            {showChevron ? (
              <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
            ) : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  const { todayTotalKwh, todayEstimatedCost, todaySavedKwh, setActiveTab, signOut } = useHems();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('Juan Dela Cruz');
  const [editedEmail, setEditedEmail] = useState('juan@example.com');
  const [editedPhone, setEditedPhone] = useState('+63 912 345 6789');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = () => {
    setSignOutModalVisible(false);
    signOut();
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(false);
    signOut();
  };

  const handleSaveProfile = () => {
    setEditModalVisible(false);
    // TODO: Save profile changes
  };

  const userInitials = 'JD';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setActiveTab('home')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Juan Dela Cruz</Text>
              <Text style={styles.userEmail}>juan@example.com</Text>
              <View style={styles.userBadge}>
                <MaterialCommunityIcons name="leaf" size={12} color="#00C853" />
                <Text style={styles.userBadgeText}>Eco Member</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#00C853" />
            </TouchableOpacity>
          </View>

          {/* Energy Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>This Month</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayTotalKwh}</Text>
                <Text style={styles.statLabel}>kWh Used</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${todayEstimatedCost}</Text>
                <Text style={styles.statLabel}>Est. Cost</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#00C853' }]}>
                  {todaySavedKwh}
                </Text>
                <Text style={styles.statLabel}>kWh Saved</Text>
              </View>
            </View>
          </View>

          {/* Personal Info */}
          <SectionCard title="Personal Information">
            <SettingRow
              icon="account-outline"
              iconColor="#00C853"
              label="Full Name"
              value="Juan Dela Cruz"
              onPress={() => setEditModalVisible(true)}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="email-outline"
              iconColor="#00C853"
              label="Email"
              value="juan@example.com"
              onPress={() => setEditModalVisible(true)}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="phone-outline"
              iconColor="#00C853"
              label="Phone"
              value="+63 912 345 6789"
              onPress={() => setEditModalVisible(true)}
            />
          </SectionCard>

          {/* Security */}
          <SectionCard title="Security">
            <SettingRow
              icon="lock-outline"
              iconColor="#3B82F6"
              label="Change Password"
              value="Last changed 30 days ago"
              onPress={() => {}}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="shield-check-outline"
              iconColor="#3B82F6"
              label="Two-Factor Auth"
              value="Disabled"
              onPress={() => {}}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="fingerprint"
              iconColor="#3B82F6"
              label="Biometric Login"
              value="Enabled"
              onPress={() => {}}
            />
          </SectionCard>

          {/* Preferences */}
          <SectionCard title="Preferences">
            <SettingRow
              icon="bell-outline"
              iconColor="#F59E0B"
              label="Notifications"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E7EB', true: '#00C853' }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Toggle notifications"
                />
              }
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="currency-usd"
              iconColor="#F59E0B"
              label="Tariff Rate"
              value="12.00 PHP/kWh"
              onPress={() => {}}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="clock-outline"
              iconColor="#F59E0B"
              label="Cutoff Reminder"
              value="30 min before"
              onPress={() => {}}
            />
          </SectionCard>

          {/* Danger Zone */}
          <SectionCard title="Danger Zone">
            <SettingRow
              icon="logout"
              iconColor="#EF4444"
              label="Sign Out"
              showChevron={false}
              onPress={() => setSignOutModalVisible(true)}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="delete-outline"
              iconColor="#EF4444"
              label="Delete Account"
              isDanger
              showChevron={false}
              onPress={() => setDeleteModalVisible(true)}
            />
          </SectionCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>SYNCO METER v1.0.0</Text>
            <Text style={styles.footerSub}>Capstone Project 2025</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                accessibilityLabel="Full name"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={editedPhone}
                onChangeText={setEditedPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                accessibilityLabel="Phone number"
              />
            </View>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveProfile}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text style={styles.modalSaveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.deleteIconWrap}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.deleteTitle}>Delete Account?</Text>
            <Text style={styles.deleteMessage}>
              This action is permanent and cannot be undone. All your data, settings, and energy
              history will be permanently deleted.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleDeleteAccount}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.deleteIconWrap}>
              <MaterialCommunityIcons name="logout" size={48} color="#EF4444" />
            </View>
            <Text style={styles.deleteTitle}>Sign Out?</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to sign out of your SYNCO METER account?
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setSignOutModalVisible(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleSignOut}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Confirm Sign Out"
              >
                <Text style={styles.deleteConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  content: {},
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00C853',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionContent: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  settingLabelDanger: {
    color: '#EF4444',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#111827',
  },
  modalSaveButton: {
    backgroundColor: '#00C853',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
  deleteConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
