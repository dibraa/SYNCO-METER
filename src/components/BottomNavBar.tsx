import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import { TabType } from '../types/hems';
import { colors } from '../theme/theme';
import { getActiveAlerts } from '../utils/alerts';

interface TabConfig {
  id: TabType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { id: 'usage', label: 'Usage', icon: 'lightning-bolt-outline', activeIcon: 'lightning-bolt' },
  { id: 'appliances', label: 'Plugs', icon: 'view-grid-outline', activeIcon: 'view-grid' },
  { id: 'alerts', label: 'Alerts', icon: 'bell-outline', activeIcon: 'bell' },
  { id: 'settings', label: 'More', icon: 'dots-horizontal-circle-outline', activeIcon: 'dots-horizontal-circle' },
];

export const BottomNavBar = () => {
  const { activeTab, setActiveTab, nodes, totalPowerWatts, prototypeAlerts } = useHems();
  const alertCount = getActiveAlerts(nodes, totalPowerWatts, prototypeAlerts).length;

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isAlertTab = tab.id === 'alerts';
        const isSelected = activeTab === tab.id;
        const showAlertBadge = isAlertTab && alertCount > 0;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={
              showAlertBadge ? `${tab.label}, ${alertCount} notifications` : tab.label
            }
            accessibilityState={{ selected: isSelected }}
            aria-selected={isSelected}
            onPress={() => setActiveTab(tab.id)}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={isSelected ? tab.activeIcon : tab.icon}
                size={24}
                color={isSelected ? colors.primary : colors.subtle}
              />
              {showAlertBadge && (
                <View style={styles.badge} accessibilityLabel={`${alertCount} notifications`}>
                  <Text style={styles.badgeText}>{alertCount > 99 ? '99+' : alertCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isSelected && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabPressed: {
    opacity: 0.72,
  },
  iconWrap: {
    width: 34,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.dangerBright,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  label: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
