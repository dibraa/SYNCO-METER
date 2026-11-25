import { SmartNode } from '../types/hems';

export interface ActiveAlert { id: string; title: string; description: string; urgent: boolean }
export function getActiveAlerts(
  nodes: SmartNode[],
  totalPowerWatts: number,
  externalAlerts: ActiveAlert[] = []
): ActiveAlert[] {
  const alerts: ActiveAlert[] = [...externalAlerts];
  if (totalPowerWatts > 2500) alerts.push({ id: 'overload', title: 'High power use', description: `${totalPowerWatts} W in use. Turn off appliances you do not need.`, urgent: true });
  for (const node of nodes) {
    if (node.cutoffPending) alerts.push({ id: `${node.id}-cutoff`, title: `${node.name} will turn off`, description: `No occupancy detected. Cutoff in ${Math.max(1, Math.ceil(node.cutoffCountdownSeconds / 60))} min. Extend the timer in Plugs.`, urgent: false });
    if (node.relayState && (node.standbyBleedWatts ?? 0) > 0) alerts.push({ id: `${node.id}-standby`, title: `${node.name}: standby power`, description: `${node.standbyBleedWatts} W of standby draw detected. Switch off the plug when it is not needed.`, urgent: false });
  }
  return alerts;
}
