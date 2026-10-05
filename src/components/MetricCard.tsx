import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MetricItemProps {
  label: string;
  value: string | number;
  unit: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  secondaryText?: string;
}

export const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  unit,
  icon,
  iconColor,
  secondaryText,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {secondaryText ? <Text style={styles.secondaryText}>{secondaryText}</Text> : null}
    </View>
  );
};

interface MetricGridProps {
  voltage: number;
  current: number;
  frequency: number;
  powerFactor: number;
  relayState: boolean;
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  voltage,
  current,
  frequency,
  powerFactor,
  relayState,
}) => {
  const pfQuality =
    powerFactor > 0.9
      ? 'Good (Resistive)'
      : powerFactor > 0.75
      ? 'Moderate (Inductive)'
      : 'Low Efficiency';

  return (
    <View style={styles.gridContainer}>
      <MetricItem
        label="VOLTAGE"
        value={voltage.toFixed(1)}
        unit="V"
        icon="flash"
        iconColor="#38BDF8"
        secondaryText="AC Nominal 220V"
      />
      <MetricItem
        label="CURRENT"
        value={relayState ? current.toFixed(2) : '0.00'}
        unit="A"
        icon="sine-wave"
        iconColor="#F59E0B"
        secondaryText={relayState ? 'Load Current' : 'Disconnected'}
      />
      <MetricItem
        label="FREQUENCY"
        value={frequency.toFixed(1)}
        unit="Hz"
        icon="wave"
        iconColor="#A855F7"
        secondaryText="Grid Nominal 60Hz"
      />
      <MetricItem
        label="POWER FACTOR"
        value={relayState ? powerFactor.toFixed(2) : '0.00'}
        unit="PF"
        icon="chart-bell-curve"
        iconColor="#10B981"
        secondaryText={relayState ? pfQuality : 'No load'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  secondaryText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
});
