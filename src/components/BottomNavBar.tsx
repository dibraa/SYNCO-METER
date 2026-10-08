import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabType } from '../types/hems';
import { useHems } from '../context/HemsContext';
import { PressableScale } from './PressableScale';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab } = useHems();

  const tabs: Array<{ id: TabType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'usage', label: 'Usage', icon: 'chart-bar' },
    { id: 'appliances', label: 'Appliances', icon: 'power-socket-eu' },
    { id: 'alerts', label: 'Alerts', icon: 'bell-outline' },
    { id: 'settings', label: 'Settings', icon: 'cog-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <PressableScale
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
            scaleTo={0.95}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isActive ? '#00C853' : '#9CA3AF'}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrap: {
    padding: 4,
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: '#E8F5E9',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
  },
  labelActive: {
    color: '#00C853',
    fontWeight: '700',
  },
});
