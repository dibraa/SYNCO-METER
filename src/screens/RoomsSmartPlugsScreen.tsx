import React from 'react';
import { View, Text } from 'react-native';
import { useHems } from '../context/HemsContext';
import { Screen, SettingRow } from '../components/Screen';
import { RoomSummary } from '../components/RoomSummary';
import { ui } from '../theme/theme';

export const RoomsSmartPlugsScreen = () => {
  const { nodes, totalPowerWatts, toggleNodeRelay, extendCutoff } = useHems();
  return <Screen title="Appliances" subtitle="Power and controls by room">
    <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={ui.muted}>{nodes.filter(node => node.relayState).length} of {nodes.length} plugs on</Text><Text style={ui.heading}>{totalPowerWatts.toLocaleString()} W total</Text></View>
    <View style={ui.section}>{nodes.map(node => <RoomSummary key={node.id} node={node} detailed onToggle={() => toggleNodeRelay(node.id)} onExtend={() => extendCutoff(node.id, 30)} />)}
      {!nodes.length && <Text style={ui.muted}>No rooms added yet.</Text>}
    </View>
    <View style={ui.card}><SettingRow label="Automation settings" unavailable /></View>
  </Screen>;
};
