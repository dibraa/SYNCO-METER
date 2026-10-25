import { StyleSheet } from 'react-native';

export const colors = {
  canvas: '#F6F8F6', surface: '#FFFFFF', text: '#172B22', muted: '#59685F',
  green: '#177245', greenSoft: '#EAF5EE', border: '#DFE7E1', neutral: '#EDF1EE',
  amber: '#895016', amberSoft: '#FFF4E5', danger: '#B42318', dangerSoft: '#FFF0EE',
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { control: 10, card: 16 };
export const ui = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  muted: { fontSize: 13, lineHeight: 19, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  number: { fontSize: 24, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  grow: { flex: 1, minWidth: 0 },
  section: { gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border },
  action: { minHeight: 48, borderRadius: radii.control, backgroundColor: colors.green, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
