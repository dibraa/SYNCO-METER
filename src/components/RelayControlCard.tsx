import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';

interface RelayControlCardProps {
  relayState: boolean;
  onToggle: () => Promise<void>;
  isOverloaded: boolean;
  powerWatts: number;
  overloadLimitWatts: number;
}

export const RelayControlCard: React.FC<RelayControlCardProps> = ({
  relayState,
  onToggle,
  isOverloaded,
  powerWatts,
  overloadLimitWatts,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isOverloaded && styles.overloadContainer]}>
      {/* Overload Alert Banner */}
      {isOverloaded && (
        <View style={styles.alertBanner}>
          <MaterialCommunityIcons name="alert-decagram" size={20} color="#EF4444" />
          <Text style={styles.alertText}>
            OVERLOAD HAZARD! {Math.round(powerWatts)}W exceeds safety limit ({overloadLimitWatts}W). Auto-trip standby ready.
          </Text>
        </View>
      )}

      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name="toggle-switch-outline"
              size={22}
              color={relayState ? '#10B981' : '#64748B'}
            />
            <Text style={styles.title}>AC LOAD CONTACTOR</Text>
          </View>
          <Text style={styles.subtitle}>
            {relayState
              ? 'Circuit Closed: Power supplied to connected appliances'
              : 'Circuit Open: Power completely severed (Standby cut-off)'}
          </Text>
          <View style={styles.statusPillRow}>
            <View
              style={[
                styles.statusIndicatorDot,
                { backgroundColor: relayState ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: relayState ? '#10B981' : '#EF4444' },
              ]}
            >
              {relayState ? 'ENERGIZED / ONLINE' : 'DE-ENERGIZED / TRIPPED'}
            </Text>
          </View>
        </View>

        {/* Tactile Big Power Button */}
        <PressableScale
          style={[
            styles.switchButton,
            relayState ? styles.buttonActive : styles.buttonInactive,
          ]}
          onPress={handlePress}
          scaleTo={0.95}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="power"
                size={32}
                color={relayState ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.switchButtonText,
                  relayState ? styles.btnTextActive : styles.btnTextInactive,
                ]}
              >
                {relayState ? 'TURN OFF' : 'TURN ON'}
              </Text>
            </>
          )}
        </PressableScale>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overloadContainer: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#2A1719',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  switchButton: {
    width: 90,
    height: 90,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonActive: {
    backgroundColor: '#EF4444', // Red for "Kill / Turn OFF"
  },
  buttonInactive: {
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#10B981', // Green for "Energize / Turn ON"
  },
  switchButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  btnTextActive: {
    color: '#FFFFFF',
  },
  btnTextInactive: {
    color: '#10B981',
  },
});
