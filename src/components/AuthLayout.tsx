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
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '../theme/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [simulatedWatts, setSimulatedWatts] = useState(847);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedWatts((prev) => {
        const noise = (Math.random() - 0.5) * 40;
        return Math.max(700, Math.min(1000, Math.round(prev + noise)));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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
        {/* Electric-Sky Brand Hero */}
        <View style={styles.heroWrap}>
          <Svg
            style={StyleSheet.absoluteFill}
            viewBox="0 0 400 240"
            preserveAspectRatio="none"
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id="authSkyGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.heroTop} stopOpacity="1" />
                <Stop offset="62%" stopColor={colors.heroMid} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.canvas} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="400" height="240" fill="url(#authSkyGrad)" />
          </Svg>

          <Animated.View
            style={[
              styles.brandContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoFrame}>
              <Image
                source={require('../../assets/LOGO.jpg')}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="SYNCO METER Logo"
              />
            </View>
            <Text style={styles.brandTitle}>SYNCO METER</Text>
            <Text style={styles.brandSubtitle}>Smart Home Energy & Load Control</Text>

            <View style={styles.liveChip} accessibilityLabel={`Live demo ${simulatedWatts} watts`}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFFFFF" />
              <Text style={styles.liveChipValue}>{simulatedWatts} W</Text>
              <Text style={styles.liveChipMeta}>· Live Demo</Text>
            </View>
          </Animated.View>
        </View>

        {/* Elevated White Form Card */}
        <Animated.View
          style={[
            styles.formCardWrap,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.formCard}>{children}</View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroWrap: {
    width: '100%',
    paddingTop: 32,
    paddingBottom: 46,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brandContent: {
    alignItems: 'center',
  },
  logoFrame: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.tile,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.heroText,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.heroTextMuted,
    marginTop: 4,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    backgroundColor: colors.heroGlass,
    borderWidth: 1,
    borderColor: colors.heroGlassBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  liveChipValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  liveChipMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.heroTextMuted,
  },
  formCardWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: -22,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
});
