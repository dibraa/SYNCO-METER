import { HemsReport, SmartNode, SystemMode } from '../types/hems';
import {
  RoomConsumption,
  HourlyEnergy,
  combineHourly,
  formatCost,
  hourLabel,
} from './consumption';

export type ReportPeriod = 'day' | 'month';

export interface PlugReportRow {
  id: string;
  name: string;
  location: string;
  code: string;
  hardware: string;
  status: string;
  occupancy: string;
  activePowerWatts: number;
  voltage: number;
  current: number;
  powerFactor: number;
  kwh: number;
  cost: number;
  sharePercent: number;
}

export interface EnergyReportData {
  title: string;
  period: ReportPeriod;
  periodLabel: string;
  generatedAt: string;
  systemMode: SystemMode;
  dataSourceLabel: string;
  tariffPerKwh: number;
  totalKwh: number;
  totalCost: number;
  savedKwh: number;
  savedCost: number;
  netKwh: number;
  totalActiveWatts: number;
  averageVoltage: number;
  averagePowerFactor: number;
  activePlugCount: number;
  totalPlugCount: number;
  plugs: PlugReportRow[];
  hourly: HourlyEnergy[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildEnergyReportData(params: {
  nodes: SmartNode[];
  consumptionRooms: RoomConsumption[];
  report: HemsReport;
  todaySavedKwh: number;
  systemMode: SystemMode;
  isLive: boolean;
  period: ReportPeriod;
  generatedAt?: Date;
}): EnergyReportData {
  const {
    nodes,
    consumptionRooms,
    report,
    todaySavedKwh,
    systemMode,
    isLive,
    period,
    generatedAt = new Date(),
  } = params;

  const tariff = report.tariffPerKwh;
  const rawPlugs = nodes.map((node) => {
    const room = consumptionRooms.find((r) => r.roomId === node.id);
    const kwh =
      period === 'day'
        ? room?.todayKwh ?? node.todayKwh
        : room?.monthKwh ?? node.monthKwh;
    return { node, kwh };
  });

  const totalKwh = +rawPlugs.reduce((sum, item) => sum + item.kwh, 0).toFixed(2);
  const totalCost = +(totalKwh * tariff).toFixed(2);
  const savedKwh = period === 'day' ? todaySavedKwh : report.autoSavedKwh;
  const savedCost = +(savedKwh * tariff).toFixed(2);
  const netKwh = +Math.max(0, totalKwh - savedKwh).toFixed(2);

  const plugs: PlugReportRow[] = rawPlugs.map(({ node, kwh }) => ({
    id: node.id,
    name: node.name,
    location: node.location,
    code: node.code,
    hardware: node.hardware,
    status: node.relayState ? 'On' : 'Off',
    occupancy: node.occupancy,
    activePowerWatts: node.relayState ? node.activePowerWatts : 0,
    voltage: node.voltage,
    current: node.relayState ? node.current : 0,
    powerFactor: node.powerFactor,
    kwh: +kwh.toFixed(2),
    cost: +(kwh * tariff).toFixed(2),
    sharePercent: totalKwh > 0 ? Math.round((kwh / totalKwh) * 100) : 0,
  }));

  const totalActiveWatts = plugs.reduce((sum, p) => sum + p.activePowerWatts, 0);
  const averageVoltage = nodes.length > 0 ? nodes[0].voltage : 228.4;
  const averagePowerFactor =
    nodes.length > 0
      ? +(nodes.reduce((sum, n) => sum + n.powerFactor, 0) / nodes.length).toFixed(2)
      : 0.96;

  const formattedDate = generatedAt.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    title: 'SYNCO METER — Energy Consumption & Load Audit Report',
    period,
    periodLabel: period === 'day' ? 'Daily Summary (Today)' : `Monthly Audit (${report.month})`,
    generatedAt: formattedDate,
    systemMode,
    dataSourceLabel: isLive ? 'Live ESP32 + PZEM-004T Telemetry' : 'Demo Snapshot Telemetry',
    tariffPerKwh: tariff,
    totalKwh,
    totalCost,
    savedKwh: +savedKwh.toFixed(2),
    savedCost,
    netKwh,
    totalActiveWatts,
    averageVoltage,
    averagePowerFactor,
    activePlugCount: nodes.filter((n) => n.relayState).length,
    totalPlugCount: nodes.length,
    plugs,
    hourly: combineHourly(consumptionRooms),
  };
}

export function buildEnergyReportHtml(data: EnergyReportData): string {
  const plugRowsHtml = data.plugs.length
    ? data.plugs
        .map(
          (plug) => `
      <tr>
        <td>
          <strong>${escapeHtml(plug.name)}</strong><br/>
          <span class="sub">${escapeHtml(plug.location)} · ${escapeHtml(plug.code)}</span>
        </td>
        <td><span class="badge ${plug.status === 'On' ? 'badge-on' : 'badge-off'}">${plug.status}</span></td>
        <td class="num">${plug.activePowerWatts.toLocaleString()} W</td>
        <td class="num">${plug.voltage.toFixed(1)} V / ${plug.current.toFixed(2)} A</td>
        <td class="num">${plug.powerFactor.toFixed(2)}</td>
        <td class="num"><strong>${plug.kwh.toFixed(2)} kWh</strong> (${plug.sharePercent}%)</td>
        <td class="num"><strong>${escapeHtml(formatCost(plug.kwh, data.tariffPerKwh))}</strong></td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="7" class="empty">No smart plugs configured.</td></tr>`;

  const recordedHours = data.hourly.filter((h) => h.energyKwh !== null);
  const hourlyRowsHtml = recordedHours.length
    ? recordedHours
        .map(
          (h) => `
      <tr>
        <td>${escapeHtml(hourLabel(h.hour))} – ${escapeHtml(hourLabel(h.hour + 1))}${h.partial ? ' (current)' : ''}</td>
        <td class="num">${(h.energyKwh ?? 0).toFixed(3)} kWh</td>
        <td class="num">${escapeHtml(formatCost(h.energyKwh ?? 0, data.tariffPerKwh))}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="empty">No hourly telemetry recorded yet.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0070F3;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .brand { font-size: 22px; font-weight: 800; color: #0070F3; letter-spacing: -0.3px; }
    .brand-sub { font-size: 12px; color: #64748B; margin-top: 2px; }
    .meta { text-align: right; font-size: 12px; color: #475569; }
    .meta strong { color: #0F172A; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 22px;
    }
    .kpi {
      background: #F3F5F8;
      border: 1px solid #E6EBF2;
      border-radius: 10px;
      padding: 12px;
    }
    .kpi-label { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #0F172A; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .kpi-sub { font-size: 11px; color: #475569; margin-top: 2px; }
    .kpi-blue .kpi-val { color: #0066D6; }
    .kpi-green .kpi-val { color: #15803D; }
    h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin: 22px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #E6EBF2;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #64748B;
      background: #F8FAFC;
      padding: 9px 10px;
      border-bottom: 1px solid #E6EBF2;
    }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid #F1F5F9;
      vertical-align: top;
    }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sub { font-size: 11px; color: #64748B; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-on { background: #DCFCE7; color: #15803D; }
    .badge-off { background: #F1F5F9; color: #64748B; }
    .empty { text-align: center; color: #64748B; padding: 18px; }
    .footer {
      margin-top: 26px;
      padding-top: 12px;
      border-top: 1px solid #E6EBF2;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748B;
    }
    @media print {
      body { padding: 0; }
      .kpi, th, .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">SYNCO METER</div>
      <div class="brand-sub">IoT Smart Meter &amp; Standby Power Reduction Report</div>
    </div>
    <div class="meta">
      <div><strong>${escapeHtml(data.periodLabel)}</strong></div>
      <div>Generated: ${escapeHtml(data.generatedAt)}</div>
      <div>Mode: ${escapeHtml(data.systemMode)} · ${escapeHtml(data.dataSourceLabel)}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi kpi-blue">
      <div class="kpi-label">Total Energy</div>
      <div class="kpi-val">${data.totalKwh.toFixed(2)} kWh</div>
      <div class="kpi-sub">Tariff ${escapeHtml(formatCost(1, data.tariffPerKwh))}/kWh</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Estimated Cost</div>
      <div class="kpi-val">${escapeHtml(formatCost(data.totalKwh, data.tariffPerKwh))}</div>
      <div class="kpi-sub">Net: ${data.netKwh.toFixed(2)} kWh</div>
    </div>
    <div class="kpi kpi-green">
      <div class="kpi-label">Standby Saved</div>
      <div class="kpi-val">${data.savedKwh.toFixed(2)} kWh</div>
      <div class="kpi-sub">Reclaimed ${escapeHtml(formatCost(data.savedKwh, data.tariffPerKwh))}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Live Grid Load</div>
      <div class="kpi-val">${data.totalActiveWatts.toLocaleString()} W</div>
      <div class="kpi-sub">${data.activePlugCount}/${data.totalPlugCount} plugs · ${data.averageVoltage.toFixed(1)}V · PF ${data.averagePowerFactor.toFixed(2)}</div>
    </div>
  </div>

  <h2>Smart Plug Consumption &amp; Electrical Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Smart Plug &amp; Location</th>
        <th>State</th>
        <th class="num">Live Load</th>
        <th class="num">Voltage / Current</th>
        <th class="num">PF</th>
        <th class="num">Consumption</th>
        <th class="num">Est. Cost</th>
      </tr>
    </thead>
    <tbody>
      ${plugRowsHtml}
    </tbody>
  </table>

  <h2>Today's Hourly Consumption Log</h2>
  <table>
    <thead>
      <tr>
        <th>Time Window</th>
        <th class="num">Energy Used</th>
        <th class="num">Est. Cost</th>
      </tr>
    </thead>
    <tbody>
      ${hourlyRowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <div>SYNCO METER — Home Energy Management System</div>
    <div>Hardware: ESP32 + PZEM-004T v3.0 · Verified Audit Export</div>
  </div>
</body>
</html>`;
}

export function buildEnergyReportCsv(data: EnergyReportData): string {
  const lines: string[] = [
    ['SYNCO METER Energy Audit Report', data.periodLabel].map(escapeCsvCell).join(','),
    ['Generated At', data.generatedAt].map(escapeCsvCell).join(','),
    ['System Mode', data.systemMode, 'Data Source', data.dataSourceLabel]
      .map(escapeCsvCell)
      .join(','),
    ['Total kWh', data.totalKwh.toFixed(2), 'Estimated Cost (PHP)', data.totalCost.toFixed(2)]
      .map(escapeCsvCell)
      .join(','),
    ['Standby Saved (kWh)', data.savedKwh.toFixed(2), 'Reclaimed Cost (PHP)', data.savedCost.toFixed(2)]
      .map(escapeCsvCell)
      .join(','),
    '',
    ['Plug Name', 'Location', 'Device ID', 'Status', 'Live Watts', 'Voltage (V)', 'Current (A)', 'Power Factor', 'Energy (kWh)', 'Share (%)', 'Est. Cost (PHP)']
      .map(escapeCsvCell)
      .join(','),
    ...data.plugs.map((p) =>
      [
        p.name,
        p.location,
        p.code,
        p.status,
        p.activePowerWatts,
        p.voltage.toFixed(1),
        p.current.toFixed(2),
        p.powerFactor.toFixed(2),
        p.kwh.toFixed(2),
        p.sharePercent,
        p.cost.toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
    '',
    ['Hour Window', 'Energy (kWh)', 'Est. Cost (PHP)'].map(escapeCsvCell).join(','),
    ...data.hourly
      .filter((h) => h.energyKwh !== null)
      .map((h) =>
        [
          `${hourLabel(h.hour)} - ${hourLabel(h.hour + 1)}`,
          (h.energyKwh ?? 0).toFixed(3),
          ((h.energyKwh ?? 0) * data.tariffPerKwh).toFixed(2),
        ]
          .map(escapeCsvCell)
          .join(',')
      ),
  ];

  return lines.join('\n');
}
