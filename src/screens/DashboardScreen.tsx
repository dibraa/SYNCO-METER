import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTelemetry } from '../context/TelemetryContext';
import { PowerGauge } from '../components/PowerGauge';
import { MetricGrid } from '../components/MetricCard';
import { RelayControlCard } from '../components/RelayControlCard';
import { CostEnergyCard } from '../components/CostEnergyCard';
import { ApplianceSelector } from '../components/ApplianceSelector';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

export const DashboardScreen: React.FC = () => {
  const {
    reading,
    history,
    sourceMode,
    appliancePreset,
    setAppliancePreset,
    relayState,
    toggleRelay,
    tariffRate,
    currencySymbol,
    overloadLimitWatts,
    isOverloaded,
    isConnected,
  } = useTelemetry();

  const [configModalVisible, setConfigModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/LOGO.jpg')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="SYNCO METER Logo"
            />
            <Text style={styles.brandTitle}>SYNCO METER</Text>
          </View>
          <Text style={styles.brandSubtitle}>IoT Energy & Load Management</Text>
        </View>

        <View style={styles.topRightWrap}>
          {/* Source Mode Pill */}
          <TouchableOpacity
            style={[
              styles.modePill,
              sourceMode === 'MOCK' ? styles.modePillMock : styles.modePillCloud,
            ]}
            onPress={() => setConfigModalVisible(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.pulseDot,
                { backgroundColor: sourceMode === 'MOCK' ? '#38BDF8' : '#34D399' },
              ]}
            />
            <Text
              style={[
                styles.modePillText,
                { color: sourceMode === 'MOCK' ? '#38BDF8' : '#34D399' },
              ]}
            >
              {sourceMode === 'MOCK' ? 'MOCK SIM' : 'SUPABASE'}
            </Text>
          </TouchableOpacity>

          {/* Config Settings Button */}
          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => setConfigModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Info Strip */}
        <View style={styles.deviceStrip}>
          <View style={styles.deviceStripLeft}>
            <MaterialCommunityIcons name="memory" size={16} color="#64748B" />
            <Text style={styles.deviceText}>ESP32 + PZEM-004T v3.0</Text>
          </View>
          <Text style={styles.timestampText}>
            Updated: {new Date(reading.timestamp).toLocaleTimeString()}
          </Text>
        </View>

        {/* 1. Hero Power Radial Gauge */}
        <PowerGauge
          powerWatts={reading.power}
          maxWatts={overloadLimitWatts}
          relayState={relayState}
        />

        {/* 2. AC Load Contactor / Relay Switch */}
        <RelayControlCard
          relayState={relayState}
          onToggle={toggleRelay}
          isOverloaded={isOverloaded}
          powerWatts={reading.power}
          overloadLimitWatts={overloadLimitWatts}
        />

        {/* 3. Stage 1: Load Profile Simulator (when in Mock mode) */}
        {sourceMode === 'MOCK' && (
          <ApplianceSelector
            currentPreset={appliancePreset}
            onSelectPreset={setAppliancePreset}
            disabled={!relayState}
          />
        )}

        {/* 4. PZEM Electrical Telemetry Metrics (V, I, F, PF) */}
        <MetricGrid
          voltage={reading.voltage}
          current={reading.current}
          frequency={reading.frequency}
          powerFactor={reading.powerFactor}
          relayState={relayState}
        />

        {/* 5. Cumulative Energy & Accrued Cost */}
        <CostEnergyCard
          energyKwh={reading.energy}
          powerWatts={reading.power}
          tariffRate={tariffRate}
          currencySymbol={currencySymbol}
          relayState={relayState}
        />

        {/* 6. 24-Hour Load Analytics & Standby Curve */}
        <AnalyticsChart history={history} currencySymbol={currencySymbol} />

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Capstone Design: IoT Smart Meter with Standby Power Reduction & Load Contactor
          </Text>
        </View>
      </ScrollView>

      {/* Cloud & Settings Modal */}
      <SupabaseConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  topRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  modePillMock: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modePillCloud: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gearButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  deviceStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  deviceStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  timestampText: {
    fontSize: 10,
    color: '#475569',
  },
  footerNote: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
});
