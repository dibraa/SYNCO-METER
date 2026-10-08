import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useHems } from '../context/HemsContext';
import { LiveDashboardScreen } from './LiveDashboardScreen';
import { RoomsSmartPlugsScreen } from './RoomsSmartPlugsScreen';
import { ConsumptionAnalyticsScreen } from './ConsumptionAnalyticsScreen';
import { AlertsScreen } from './AlertsScreen';
import { ProfileScreen } from './ProfileScreen';
import { BottomNavBar } from '../components/BottomNavBar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const MainAppNavigator: React.FC = () => {
  const { activeTab } = useHems();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.set(
      withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      })
    );
  }, [activeTab]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <LiveDashboardScreen />;
      case 'usage':
        return <ConsumptionAnalyticsScreen />;
      case 'appliances':
        return <RoomsSmartPlugsScreen />;
      case 'alerts':
        return <AlertsScreen />;
      case 'settings':
        return <ProfileScreen />;
      default:
        return <LiveDashboardScreen />;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mobileFrame}>
        <Animated.View style={[styles.screenContainer, screenStyle]}>
          {renderScreen()}
        </Animated.View>
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
