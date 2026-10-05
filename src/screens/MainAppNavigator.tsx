import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useHems } from '../context/HemsContext';
import { LiveDashboardScreen } from './LiveDashboardScreen';
import { RoomsSmartPlugsScreen } from './RoomsSmartPlugsScreen';
import { ConsumptionAnalyticsScreen } from './ConsumptionAnalyticsScreen';
import { AuditReportsScreen } from './AuditReportsScreen';
import { ProfileScreen } from './ProfileScreen';
import { BottomNavBar } from '../components/BottomNavBar';

export const MainAppNavigator: React.FC = () => {
  const { activeTab } = useHems();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <LiveDashboardScreen />;
      case 'rooms':
        return <RoomsSmartPlugsScreen />;
      case 'analytics':
        return <ConsumptionAnalyticsScreen />;
      case 'reports':
        return <AuditReportsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <LiveDashboardScreen />;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mobileFrame}>
        <View style={styles.screenContainer}>{renderScreen()}</View>
        <BottomNavBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  screenContainer: {
    flex: 1,
  },
});
