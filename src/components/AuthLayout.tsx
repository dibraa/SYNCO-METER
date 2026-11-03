import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [simulatedWatts, setSimulatedWatts] = useState(847);

  // Simulate live wattage fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedWatts((prev) => {
        const noise = (Math.random() - 0.5) * 40;
        return Math.max(700, Math.min(1000, Math.round(prev + noise)));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation for the gauge dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const gaugeSize = 80;
  const strokeWidth = 6;
  const center = gaugeSize / 2;
  const radius = center - strokeWidth - 3;
  const percentage = simulatedWatts / 3000;

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const arcSweep = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, arcSweep, 0, end.x, end.y].join(' ');
  };

  const startAngle = -215;
  const endAngle = 35;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + totalAngle * percentage;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* Brand Panel — Top 40% */}
      <Animated.View
        style={[
          styles.brandPanel,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.brandContent}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/LOGO.jpg')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="SYNCO METER Logo"
            />
            <Text style={styles.brandTitle}>SYNCO METER</Text>
          </View>
          <Text style={styles.brandSubtitle}>IoT Energy & Load Management</Text>

          {/* Live Gauge — compact */}
          <View style={styles.gaugeContainer}>
            <Svg width={gaugeSize} height={gaugeSize} viewBox={`0 0 ${gaugeSize} ${gaugeSize}`}>
              <Defs>
                <LinearGradient id="authGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#00C853" />
                  <Stop offset="100%" stopColor="#34D399" />
                </LinearGradient>
              </Defs>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#E5E7EB"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="url(#authGaugeGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${2 * Math.PI * radius}`}
                strokeDashoffset={`${2 * Math.PI * radius * (1 - percentage)}`}
                transform={`rotate(${startAngle + 90} ${center} ${center})`}
              />
            </Svg>
            <View style={styles.gaugeCenter}>
              <Text style={styles.gaugeValue}>{simulatedWatts}</Text>
              <Text style={styles.gaugeUnit}>W</Text>
            </View>
          </View>

          <Text
            style={styles.liveLabel}
            accessibilityLabel="Live demo data"
          >
            LIVE DEMO DATA
          </Text>
        </View>
      </Animated.View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
      </View>

      {/* Form Panel — Bottom 60% */}
      <Animated.View
        style={[
          styles.formPanel,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {children}
      </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandPanel: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandContent: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 12,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  gaugeUnit: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  liveLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00C853',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  formPanel: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
});
