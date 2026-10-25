import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { TabType } from '../types/hems';
import { colors } from '../theme/theme';
import { getActiveAlerts } from '../utils/alerts';

const tabs: { id: TabType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'usage', label: 'Usage', icon: 'chart-bar' },
  { id: 'appliances', label: 'Appliances', icon: 'power-socket-eu' },
  { id: 'alerts', label: 'Alerts', icon: 'bell-outline' },
  { id: 'settings', label: 'Settings', icon: 'cog-outline' },
];

export const BottomNavBar = () => {
  const { activeTab, setActiveTab, nodes, totalPowerWatts } = useHems();
  const alertCount = getActiveAlerts(nodes, totalPowerWatts).length;

  return (
    <View style={styles.bar}>
      {tabs.map(tab => {
        const isAlertTab = tab.id === 'alerts';
        const isSelected = activeTab === tab.id;
        const showAlertBadge = isAlertTab && alertCount > 0;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={showAlertBadge ? `${tab.label}, ${alertCount} notifications` : tab.label}
            accessibilityState={{ selected: isSelected }}
            aria-selected={isSelected}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tab}
          >
            <View style={[styles.icon, isSelected && styles.active]}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isSelected ? colors.green : colors.muted}
              />
              {showAlertBadge && (
                <View style={styles.badge} accessibilityLabel={`${alertCount} notifications`}>
                  <Text style={styles.badgeText}>{alertCount > 99 ? '99+' : alertCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isSelected && { color: colors.green, fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingVertical: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tab: { flex: 1, minHeight: 52, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 4 },
  icon: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, position: 'relative' },
  active: { backgroundColor: colors.greenSoft },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  label: { color: colors.muted, fontSize: 11, textAlign: 'center', maxWidth: '100%', flexShrink: 1 },
});
