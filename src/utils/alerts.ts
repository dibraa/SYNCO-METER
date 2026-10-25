import { SmartNode } from '../types/hems';

export interface ActiveAlert { id: string; title: string; description: string; urgent: boolean }
export function getActiveAlerts(nodes: SmartNode[], totalPowerWatts: number): ActiveAlert[] {
  const alerts: ActiveAlert[] = [];
  if (totalPowerWatts > 2500) alerts.push({ id: 'overload', title: 'High power use', description: `${totalPowerWatts} W in use. Turn off appliances you do not need.`, urgent: true });
  for (const node of nodes) {
    if (node.cutoffPending) alerts.push({ id: `${node.id}-cutoff`, title: `${node.name} will turn off`, description: `No occupancy detected. Cutoff in ${Math.ceil(node.cutoffCountdownSeconds / 60)} min. Extend the timer in Appliances.`, urgent: false });
    if (node.relayState && (node.standbyBleedWatts ?? 0) > 0) alerts.push({ id: `${node.id}-standby`, title: `${node.name}: standby power`, description: `${node.standbyBleedWatts} W of standby draw in the demo. Switch off the plug when it is not needed.`, urgent: false });
  }
  return alerts;
}
