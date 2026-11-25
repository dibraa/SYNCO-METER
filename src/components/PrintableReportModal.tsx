import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHems } from '../context/HemsContext';
import {
  ReportPeriod,
  buildEnergyReportData,
  buildEnergyReportHtml,
  buildEnergyReportCsv,
} from '../utils/reportGenerator';
import {
  printEnergyReport,
  shareEnergyReportPdf,
  exportEnergyReportCsv,
} from '../services/reportService';
import { formatCost } from '../utils/consumption';
import { colors, radii, shadows, spacing, ui } from '../theme/theme';

interface PrintableReportModalProps {
  visible: boolean;
  initialPeriod?: ReportPeriod;
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  visible,
  initialPeriod = 'day',
  onClose,
}) => {
  const {
    nodes,
    consumptionRooms,
    report,
    todaySavedKwh,
    systemMode,
    isSupabaseConnected,
    isHardwareTelemetryActive,
  } = useHems();

  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const [busyAction, setBusyAction] = useState<'print' | 'pdf' | 'csv' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const reportData = useMemo(
    () =>
      buildEnergyReportData({
        nodes,
        consumptionRooms,
        report,
        todaySavedKwh,
        systemMode,
        isLive: isSupabaseConnected && isHardwareTelemetryActive,
        period,
      }),
    [
      nodes,
      consumptionRooms,
      report,
      todaySavedKwh,
      systemMode,
      isSupabaseConnected,
      isHardwareTelemetryActive,
      period,
    ]
  );

  const handlePrint = async () => {
    setFeedback(null);
    setBusyAction('print');
    try {
      const html = buildEnergyReportHtml(reportData);
      await printEnergyReport(html);
      setFeedback({ type: 'ok', text: 'Print dialog opened for your formatted energy report.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to open print dialog.';
      setFeedback({ type: 'err', text: msg });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSharePdf = async () => {
    setFeedback(null);
    setBusyAction('pdf');
    try {
      const html = buildEnergyReportHtml(reportData);
      await shareEnergyReportPdf(html);
      setFeedback({
        type: 'ok',
        text: Platform.OS === 'web' ? 'Use "Save as PDF" in the print dialog.' : 'PDF ready to share or save.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to generate PDF.';
      setFeedback({ type: 'err', text: msg });
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportCsv = async () => {
    setFeedback(null);
    setBusyAction('csv');
    try {
      const csv = buildEnergyReportCsv(reportData);
      const stamp = new Date().toISOString().slice(0, 10);
      await exportEnergyReportCsv(csv, `synco-meter-${period}-${stamp}.csv`);
      setFeedback({
        type: 'ok',
        text: Platform.OS === 'web' ? 'CSV report downloaded.' : 'CSV ready to share.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to export CSV.';
      setFeedback({ type: 'err', text: msg });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="printer-outline" size={22} color={colors.primaryText} />
              </View>
              <View style={ui.grow}>
                <Text style={styles.title}>Printable Energy Report</Text>
                <Text style={styles.subtitle}>{reportData.periodLabel}</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close report preview"
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Period Switcher */}
          <View style={styles.periodTrack}>
            {(['day', 'month'] as const).map((value) => {
              const active = period === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setPeriod(value);
                    setFeedback(null);
                  }}
                  style={[styles.periodBtn, active && styles.periodBtnActive]}
                >
                  <Text style={[styles.periodText, active && styles.periodTextActive]}>
                    {value === 'day' ? 'Today' : 'This Month'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Paper-like Report Preview Sheet */}
            <View style={styles.paperCard}>
              <View style={styles.paperHeader}>
                <View>
                  <Text style={styles.paperBrand}>SYNCO METER</Text>
                  <Text style={styles.paperMeta}>{reportData.dataSourceLabel}</Text>
                </View>
                <View style={ui.pill}>
                  <Text style={ui.pillText}>{reportData.systemMode}</Text>
                </View>
              </View>

              <Text style={styles.paperDate}>Generated {reportData.generatedAt}</Text>

              {/* 2x2 Summary KPIs */}
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Total Energy</Text>
                  <Text style={[styles.kpiValue, { color: colors.primaryText }]}>
                    {reportData.totalKwh.toFixed(2)} kWh
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Estimated Cost</Text>
                  <Text style={styles.kpiValue}>
                    {formatCost(reportData.totalKwh, reportData.tariffPerKwh)}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Standby Saved</Text>
                  <Text style={[styles.kpiValue, { color: colors.successText }]}>
                    {reportData.savedKwh.toFixed(2)} kWh
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Live Load</Text>
                  <Text style={styles.kpiValue}>
                    {reportData.totalActiveWatts.toLocaleString()} W
                  </Text>
                </View>
              </View>

              {/* Plug Breakdown Table */}
              <Text style={styles.tableHeading}>
                Smart Plugs ({reportData.activePlugCount}/{reportData.totalPlugCount} active)
              </Text>
              {reportData.plugs.length === 0 ? (
                <Text style={ui.muted}>No smart plugs configured.</Text>
              ) : (
                reportData.plugs.map((plug, idx) => (
                  <View
                    key={plug.id}
                    style={[
                      styles.plugRow,
                      idx < reportData.plugs.length - 1 && styles.plugRowBorder,
                    ]}
                  >
                    <View style={ui.grow}>
                      <Text style={styles.plugName}>{plug.name}</Text>
                      <Text style={styles.plugSub}>
                        {plug.location} · {plug.code} · {plug.activePowerWatts} W
                      </Text>
                    </View>
                    <View style={styles.plugRight}>
                      <Text style={styles.plugKwh}>
                        {plug.kwh.toFixed(2)} kWh ({plug.sharePercent}%)
                      </Text>
                      <Text style={styles.plugCost}>
                        {formatCost(plug.kwh, reportData.tariffPerKwh)}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <Text style={styles.tariffFootnote}>
                Tariff: {formatCost(1, reportData.tariffPerKwh)}/kWh · Avg Grid:{' '}
                {reportData.averageVoltage.toFixed(1)} V · PF{' '}
                {reportData.averagePowerFactor.toFixed(2)}
              </Text>
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedbackBanner,
                  feedback.type === 'ok' ? styles.feedbackOk : styles.feedbackErr,
                ]}
              >
                <MaterialCommunityIcons
                  name={feedback.type === 'ok' ? 'check-circle' : 'alert-circle'}
                  size={17}
                  color={feedback.type === 'ok' ? colors.success : colors.danger}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    { color: feedback.type === 'ok' ? colors.successText : colors.danger },
                  ]}
                >
                  {feedback.text}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Print report"
              onPress={handlePrint}
              disabled={busyAction !== null}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              {busyAction === 'print' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="printer" size={19} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>
                    {Platform.OS === 'web' ? 'Print / Save PDF' : 'Print Report'}
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.secondaryRow}>
              {Platform.OS !== 'web' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share PDF"
                  onPress={handleSharePdf}
                  disabled={busyAction !== null}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
                >
                  {busyAction === 'pdf' ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={18}
                        color={colors.primaryText}
                      />
                      <Text style={styles.secondaryBtnText}>Save / Share PDF</Text>
                    </>
                  )}
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Export CSV"
                onPress={handleExportCsv}
                disabled={busyAction !== null}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
              >
                {busyAction === 'csv' ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="file-delimited-outline"
                      size={18}
                      color={colors.primaryText}
                    />
                    <Text style={styles.secondaryBtnText}>Export CSV</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    maxHeight: '92%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTrack: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.surface,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  periodTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 12,
    gap: spacing.md,
  },
  paperCard: {
    backgroundColor: colors.canvas,
    borderRadius: radii.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperBrand: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.2,
  },
  paperMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  paperDate: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  tableHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  plugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  plugRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  plugName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  plugSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  plugRight: {
    alignItems: 'flex-end',
  },
  plugKwh: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  plugCost: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  tariffFootnote: {
    fontSize: 11,
    color: colors.muted,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radii.control,
  },
  feedbackOk: {
    backgroundColor: colors.successSoft,
  },
  feedbackErr: {
    backgroundColor: colors.dangerSoft,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footerActions: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radii.control,
    ...shadows.button,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    height: 44,
    borderRadius: radii.control,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
});
