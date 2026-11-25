import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  G,
} from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, primitives, radii, ui } from '../theme/theme';
import { HourlyEnergy, formatCost, formatHour12, hourLabel } from '../utils/consumption';

interface EnergyAreaChartProps {
  data: HourlyEnergy[];
  usedKwh: number;
  savedKwh: number;
  tariffPerKwh: number;
  compact?: boolean;
}

const CHART_W = 320;
const CHART_H = 148;
const PAD_LEFT = 28;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

function buildSmoothPaths(points: { x: number; y: number }[], baselineY: number) {
  if (!points.length) return { line: '', area: '' };
  if (points.length === 1) {
    const p = points[0];
    return {
      line: `M ${p.x} ${p.y}`,
      area: `M ${p.x} ${baselineY} L ${p.x} ${p.y} L ${p.x} ${baselineY} Z`,
    };
  }

  let line = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = Math.min(baselineY, Math.max(PAD_TOP, p1.y + (p2.y - p0.y) / 6));
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = Math.min(baselineY, Math.max(PAD_TOP, p2.y - (p3.y - p1.y) / 6));

    line += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;
  return { line, area };
}

export const EnergyAreaChart: React.FC<EnergyAreaChartProps> = ({
  data,
  usedKwh,
  savedKwh,
  tariffPerKwh,
  compact = false,
}) => {
  const recorded = useMemo(() => data.filter((item) => item.energyKwh !== null), [data]);
  const defaultHour = recorded.length ? recorded[recorded.length - 1].hour : 0;
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const activeHour = selectedHour ?? defaultHour;

  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = (compact ? 124 : CHART_H) - PAD_TOP - PAD_BOTTOM;
  const totalH = compact ? 124 : CHART_H;
  const baselineY = PAD_TOP + plotH;

  const maxKwh = useMemo(() => {
    const peak = Math.max(0.2, ...recorded.map((d) => d.energyKwh ?? 0));
    return Math.ceil(peak * 10) / 10;
  }, [recorded]);

  const points = useMemo(() => {
    return recorded.map((item) => {
      const x = PAD_LEFT + (item.hour / 23) * plotW;
      const ratio = (item.energyKwh ?? 0) / maxKwh;
      const y = baselineY - ratio * plotH;
      return { ...item, x, y };
    });
  }, [recorded, plotW, maxKwh, baselineY, plotH]);

  const { line, area } = useMemo(() => buildSmoothPaths(points, baselineY), [points, baselineY]);
  const activePoint = points.find((p) => p.hour === activeHour) ?? points[points.length - 1];

  const netKwh = Math.max(0, usedKwh - savedKwh);
  const yTicks = [maxKwh, +(maxKwh / 2).toFixed(2), 0];
  const xLabels = [0, 4, 8, 12, 16, 20, 23];

  const handleSelectHour = (hour: number) => {
    setSelectedHour((prev) => (prev === hour ? null : hour));
  };

  return (
    <View style={ui.card}>
      {/* Formula KPI Row matching Inspo Screen 2 */}
      <View style={styles.formulaRow}>
        <View style={styles.formulaLeadIcon}>
          <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.primary} />
        </View>
        <View style={styles.formulaBlock}>
          <Text style={[styles.formulaVal, { color: colors.primary }]}>
            {usedKwh.toFixed(2)} <Text style={styles.formulaUnit}>kWh</Text>
          </Text>
          <Text style={styles.formulaLabel}>Consumed</Text>
        </View>

        <Text style={styles.operator}>−</Text>

        <View style={styles.formulaBlock}>
          <Text style={[styles.formulaVal, { color: colors.success }]}>
            {savedKwh.toFixed(2)} <Text style={styles.formulaUnit}>kWh</Text>
          </Text>
          <Text style={styles.formulaLabel}>Auto-Saved</Text>
        </View>

        <Text style={styles.operator}>=</Text>

        <View style={styles.formulaBlock}>
          <Text style={[styles.formulaVal, { color: colors.text }]}>
            {netKwh.toFixed(2)} <Text style={styles.formulaUnit}>kWh</Text>
          </Text>
          <Text style={styles.formulaLabel}>Net Impact</Text>
        </View>
      </View>

      {/* Active Point Readout Pill */}
      {activePoint ? (
        <View style={styles.readoutRow} accessibilityLiveRegion="polite">
          <View style={styles.readoutDot} />
          <Text style={styles.readoutText}>
            {hourLabel(activePoint.hour)} · {(activePoint.energyKwh ?? 0).toFixed(2)} kWh (
            {formatCost(activePoint.energyKwh ?? 0, tariffPerKwh)})
            {activePoint.partial ? ' · live hour' : ''}
          </Text>
        </View>
      ) : null}

      {/* Smooth Spline Area Chart */}
      <View style={styles.chartWrap}>
        <View style={styles.yAxisOverlay} pointerEvents="none">
          {yTicks.map((tick, idx) => (
            <Text key={idx} style={styles.yTick}>
              {tick === 0 ? '0' : tick.toFixed(1)}
            </Text>
          ))}
        </View>

        <Svg width="100%" height={totalH} viewBox={`0 0 ${CHART_W} ${totalH}`}>
          <Defs>
            <LinearGradient id="energyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={primitives.blue500} stopOpacity="0.28" />
              <Stop offset="70%" stopColor={primitives.blue400} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={primitives.blue300} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Horizontal dashed gridlines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = PAD_TOP + plotH * ratio;
            return (
              <Line
                key={idx}
                x1={PAD_LEFT}
                y1={y}
                x2={CHART_W - PAD_RIGHT}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray={ratio === 1 ? undefined : '3 4'}
              />
            );
          })}

          {/* Area Fill + Smooth Line */}
          {area ? <Path d={area} fill="url(#energyAreaGrad)" /> : null}
          {line ? (
            <Path
              d={line}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Active vertical guide & glowing marker */}
          {activePoint ? (
            <G>
              <Line
                x1={activePoint.x}
                y1={PAD_TOP - 4}
                x2={activePoint.x}
                y2={baselineY}
                stroke={primitives.slate300}
                strokeWidth={1}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={7}
                fill={primitives.blue100}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4.2}
                fill={colors.primary}
                stroke={primitives.white}
                strokeWidth={2}
              />
            </G>
          ) : null}
        </Svg>

        {/* Interactive X-axis hour tap targets */}
        <View style={styles.xAxisRow}>
          {xLabels.map((h) => {
            const hasPoint = points.some((p) => p.hour === h);
            const isSelected = activePoint?.hour === h;
            return (
              <Pressable
                key={h}
                accessibilityRole="button"
                accessibilityLabel={`Inspect ${formatHour12(h, false)}`}
                disabled={!hasPoint}
                onPress={() => hasPoint && handleSelectHour(h)}
                style={styles.xTickBtn}
              >
                <Text
                  style={[
                    styles.xTick,
                    isSelected && styles.xTickActive,
                    !hasPoint && styles.xTickFuture,
                  ]}
                >
                  {`${h}:00`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  formulaLeadIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaBlock: {
    flex: 1,
    minWidth: 0,
  },
  formulaVal: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  formulaUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  formulaLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  operator: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.subtle,
    paddingHorizontal: 1,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.sm,
  },
  readoutDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  readoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  chartWrap: {
    position: 'relative',
    marginTop: 2,
  },
  yAxisOverlay: {
    position: 'absolute',
    left: 0,
    top: PAD_TOP - 6,
    bottom: PAD_BOTTOM + 20,
    width: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  yTick: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.subtle,
    fontVariant: ['tabular-nums'],
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 4,
    marginTop: -6,
  },
  xTickBtn: {
    minHeight: 28,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xTick: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  xTickActive: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  xTickFuture: {
    color: colors.subtle,
    opacity: 0.65,
  },
});
