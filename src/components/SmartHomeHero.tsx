import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SmartNode } from '../types/hems';
import { colors, primitives, radii, spacing } from '../theme/theme';

interface SmartHomeHeroProps {
  totalPowerWatts: number;
  todayKwh: number;
  savedKwh: number;
  nodes: SmartNode[];
  isLive: boolean;
  onStatusPress?: () => void;
}

export const SmartHomeHero: React.FC<SmartHomeHeroProps> = ({
  totalPowerWatts,
  todayKwh,
  savedKwh,
  nodes,
  isLive,
  onStatusPress,
}) => {
  const node1 = nodes[0];
  const node2 = nodes[1];
  const hasLoad = totalPowerWatts > 0;
  const node1On = Boolean(node1?.relayState);
  const node2On = Boolean(node2?.relayState);
  const node2Pending = Boolean(node2?.cutoffPending);

  return (
    <View style={styles.heroContainer}>
      {/* Base Sky Fill + Architectural 3D Home Artwork */}
      <View style={styles.artworkBox}>
        <Image
          source={require('../../assets/hero-home.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Smart home energy flow illustration"
        />

        {/* Top rich electric-sky contrast scrim + bottom seamless canvas fade + live energy conduits */}
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox="0 0 400 356"
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="heroTopSky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.heroTop} stopOpacity="1" />
              <Stop offset="42%" stopColor="#1E88FF" stopOpacity="0.92" />
              <Stop offset="66%" stopColor="#58AEFF" stopOpacity="0.25" />
              <Stop offset="82%" stopColor="#58AEFF" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="heroBottomFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.canvas} stopOpacity="0.0" />
              <Stop offset="100%" stopColor={colors.canvas} stopOpacity="1.0" />
            </LinearGradient>
          </Defs>

          {/* Top sky contrast scrim */}
          <Rect x="0" y="0" width="400" height="218" fill="url(#heroTopSky)" />

          {/* Bottom soft dissolve into page canvas */}
          <Rect x="0" y="304" width="400" height="52" fill="url(#heroBottomFade)" />

          {/* Live SVG Energy-Flow Conduits anchored to the wall meter box (x≈212, y≈264) */}
          {/* Grid feed into wall meter box */}
          <Path
            d="M 212 280 L 212 304 L 248 318"
            fill="none"
            stroke={hasLoad ? primitives.blue500 : primitives.slate300}
            strokeWidth={hasLoad ? 3 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={hasLoad ? undefined : '4 4'}
          />
          <Circle
            cx={212}
            cy={264}
            r={5.5}
            fill={hasLoad ? primitives.blue500 : primitives.slate400}
            stroke={primitives.white}
            strokeWidth={2}
          />

          {/* Room 1 (Living Room, left wing) conduit */}
          <Path
            d="M 206 268 L 154 286 L 128 273"
            fill="none"
            stroke={node1On ? primitives.green500 : primitives.slate300}
            strokeWidth={node1On ? 2.5 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={node1On ? undefined : '3 4'}
          />
          <Circle
            cx={128}
            cy={273}
            r={4}
            fill={node1On ? primitives.green500 : primitives.slate300}
            stroke={primitives.white}
            strokeWidth={1.5}
          />

          {/* Room 2 (Bedroom, right wing) conduit */}
          <Path
            d="M 218 264 L 280 245"
            fill="none"
            stroke={
              !node2On
                ? primitives.slate300
                : node2Pending
                ? primitives.amber500
                : primitives.blue400
            }
            strokeWidth={node2On ? 2.5 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={node2On ? undefined : '3 4'}
          />
          <Circle
            cx={280}
            cy={245}
            r={4}
            fill={
              !node2On
                ? primitives.slate300
                : node2Pending
                ? primitives.amber500
                : primitives.blue400
            }
            stroke={primitives.white}
            strokeWidth={1.5}
          />
        </Svg>

        {/* Top Bar Overlay */}
        <View style={styles.overlayContent}>
          <View style={styles.topRow}>
            <View style={styles.brandGroup}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Energy
              </Text>
              <Text style={styles.brandSub}>SYNCO METER</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLive ? 'Live telemetry connected' : 'Demo telemetry mode'}
              onPress={onStatusPress}
              style={({ pressed }) => [styles.glassPill, pressed && { opacity: 0.82 }]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: isLive ? '#4ADE80' : '#FFFFFF' },
                ]}
              />
              <Text style={styles.glassPillText}>{isLive ? 'Live' : 'Today'}</Text>
              <MaterialCommunityIcons
                name={isLive ? 'access-point' : 'calendar-today'}
                size={14}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* 3-Column KPI Strip with Vertical Guide Hairlines (Inspo Screen 1) */}
          <View style={styles.kpiStrip}>
            <View style={styles.kpiCol}>
              <View style={styles.kpiLine} />
              <View style={styles.kpiTextWrap}>
                <Text style={styles.kpiVal}>{(totalPowerWatts / 1000).toFixed(2)} kW</Text>
                <Text style={styles.kpiLabel}>Live Load</Text>
              </View>
            </View>

            <View style={styles.kpiCol}>
              <View style={styles.kpiLine} />
              <View style={styles.kpiTextWrap}>
                <Text style={styles.kpiVal}>{todayKwh.toFixed(2)} kWh</Text>
                <Text style={styles.kpiLabel}>Today</Text>
              </View>
            </View>

            <View style={styles.kpiCol}>
              <View style={styles.kpiLine} />
              <View style={styles.kpiTextWrap}>
                <Text style={styles.kpiVal}>{savedKwh.toFixed(2)} kWh</Text>
                <Text style={styles.kpiLabel}>Saved</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    backgroundColor: colors.heroTop,
  },
  artworkBox: {
    width: '100%',
    height: 356,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.heroTop,
  },
  heroImage: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    width: '100%',
    height: 306,
  },
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandGroup: {
    gap: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.heroText,
    letterSpacing: -0.6,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.heroTextMuted,
    letterSpacing: 1.1,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.heroGlass,
    borderWidth: 1,
    borderColor: colors.heroGlassBorder,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.control,
    minHeight: 38,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  glassPillText: {
    color: colors.heroText,
    fontSize: 13,
    fontWeight: '700',
  },
  kpiStrip: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 8,
  },
  kpiCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  kpiLine: {
    width: 1,
    height: 52,
    backgroundColor: colors.heroDivider,
    marginTop: 2,
  },
  kpiTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.heroText,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.heroTextMuted,
    marginTop: 1,
  },
});
