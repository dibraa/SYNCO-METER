import React from 'react';
import { View } from 'react-native';
import { useHems } from '../context/HemsContext';
import { LiveDashboardScreen } from './LiveDashboardScreen';
import { RoomsSmartPlugsScreen } from './RoomsSmartPlugsScreen';
import { ConsumptionAnalyticsScreen } from './ConsumptionAnalyticsScreen';
import { AlertsScreen } from './AlertsScreen';
import { ProfileScreen } from './ProfileScreen';
import { BottomNavBar } from '../components/BottomNavBar';

export const MainAppNavigator = () => {
  const { activeTab } = useHems();
  const screens = { home: LiveDashboardScreen, usage: ConsumptionAnalyticsScreen, appliances: RoomsSmartPlugsScreen, alerts: AlertsScreen, settings: ProfileScreen };
  const ActiveScreen = screens[activeTab];
  return <View style={{ flex: 1 }}><View style={{ flex: 1 }}><ActiveScreen /></View><BottomNavBar /></View>;
};
