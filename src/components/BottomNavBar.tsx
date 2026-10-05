import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabType } from '../types/hems';
import { useHems } from '../context/HemsContext';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab } = useHems();

  const tabs: Array<{ id: TabType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'rooms', label: 'Rooms', icon: 'power-socket-eu' },
    { id: 'analytics', label: 'Analytics', icon: 'chart-bar' },
    { id: 'reports', label: 'Reports', icon: 'file-document-outline' },
    { id: 'profile', label: 'Profile', icon: 'account-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
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
          </TouchableOpacity>
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
    color: '#9CA3AF',
    marginTop: 3,
  },
  labelActive: {
    color: '#00C853',
    fontWeight: '700',
  },
});
