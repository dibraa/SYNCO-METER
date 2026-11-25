import { Platform, StyleSheet } from 'react-native';

/**
 * Layer 1: Primitive Design Tokens
 * Raw scale values for the Electric-Sky Energy Management visual system.
 */
export const primitives = {
  blue900: '#0047A8',
  blue700: '#005FCC',
  blue600: '#0066D6',
  blue500: '#007AFF',
  blue400: '#3B9EFF',
  blue300: '#7CC4FF',
  blue200: '#C7E4FF',
  blue100: '#E8F3FF',
  blue50: '#F2F8FF',

  slate950: '#0F172A',
  slate800: '#1E293B',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E6EBF2',
  slate100: '#F1F5F9',
  slate50: '#F3F5F8',
  white: '#FFFFFF',

  green700: '#15803D',
  green600: '#16A34A',
  green500: '#22C55E',
  green400: '#65A30D',
  green300: '#84CC16',
  green100: '#DCFCE7',
  green50: '#ECFDF5',

  amber700: '#B45309',
  amber600: '#D97706',
  amber500: '#F59E0B',
  orange500: '#F97316',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',

  red700: '#B91C1C',
  red600: '#DC2626',
  red500: '#EF4444',
  red100: '#FEE2E2',
  red50: '#FEF2F2',
} as const;

/**
 * Layer 2: Semantic Tokens
 */
export const colors = {
  canvas: primitives.slate50,
  backdrop: '#E7EDF4',
  surface: primitives.white,
  surfaceMuted: primitives.slate100,

  primary: primitives.blue500,
  primaryDeep: primitives.blue700,
  primaryText: primitives.blue600,
  primarySoft: primitives.blue100,
  primaryTint: primitives.blue50,

  heroTop: '#0070F3',
  heroMid: primitives.blue400,
  heroFade: primitives.blue200,
  heroText: primitives.white,
  heroTextMuted: 'rgba(255, 255, 255, 0.86)',
  heroDivider: 'rgba(255, 255, 255, 0.34)',
  heroGlass: 'rgba(255, 255, 255, 0.22)',
  heroGlassBorder: 'rgba(255, 255, 255, 0.36)',

  text: primitives.slate950,
  textSecondary: primitives.slate600,
  muted: primitives.slate500,
  subtle: primitives.slate400,

  border: primitives.slate200,
  divider: primitives.slate100,
  neutral: primitives.slate100,

  // Semantic state colors (with green alias preserved for convenience)
  success: primitives.green600,
  successText: primitives.green700,
  successSoft: primitives.green100,
  green: primitives.green600,
  greenSoft: primitives.green50,

  warning: primitives.amber500,
  warningText: primitives.amber700,
  warningSoft: primitives.amber100,
  amber: primitives.amber700,
  amberSoft: primitives.amber50,

  danger: primitives.red600,
  dangerBright: primitives.red500,
  dangerSoft: primitives.red100,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radii = {
  sm: 8,
  control: 12,
  tile: 16,
  card: 20,
  sheet: 26,
  pill: 999,
} as const;

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 4px 16px rgba(15, 23, 42, 0.05), 0px 1px 2px rgba(15, 23, 42, 0.03)',
    } as any,
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
  }),
  tile: Platform.select({
    web: {
      boxShadow: '0px 3px 10px rgba(15, 23, 42, 0.05), 0px 1px 2px rgba(15, 23, 42, 0.03)',
    } as any,
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  }),
  button: Platform.select({
    web: {
      boxShadow: '0px 6px 16px rgba(0, 112, 243, 0.24)',
    } as any,
    default: {
      shadowColor: '#0070F3',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 4,
    },
  }),
};

/**
 * Layer 3: Reusable Component Styles
 */
export const ui = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  number: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radii.tile,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.tile,
  },
  pill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  softButton: {
    minHeight: 46,
    borderRadius: radii.control,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  softButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  action: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadows.button,
  },
  actionText: {
    color: primitives.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
