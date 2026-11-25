import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, spacing, ui } from '../theme/theme';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function Screen({
  title,
  subtitle,
  brand,
  badge,
  immersive = false,
  headerRight,
  children,
}: {
  title?: string;
  subtitle?: string;
  brand?: boolean;
  badge?: string;
  immersive?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isLinked = isSupabaseConfigured();
  const label = badge || (isLinked ? 'Live' : 'Demo');

  if (immersive) {
    return (
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.immersiveContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {brand && (
          <Image
            source={require('../../assets/LOGO.jpg')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="SYNCO METER Logo"
          />
        )}
        <View style={ui.grow}>
          {title ? (
            <Text style={brand ? styles.brand : ui.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerRight ?? (
          <View style={[styles.badgeContainer, isLinked ? styles.badgeLinked : styles.badgeDemo]}>
            <View
              style={[
                styles.badgeDot,
                { backgroundColor: isLinked ? colors.success : colors.primary },
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                isLinked ? styles.badgeTextLinked : styles.badgeTextDemo,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Section({
  title,
  pill,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  pill?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {pill ? (
          <View style={ui.pill}>
            <Text style={ui.pillText}>{pill}</Text>
          </View>
        ) : actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            hitSlop={8}
            style={styles.sectionAction}
          >
            <Text style={styles.sectionActionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.disclosureWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        style={styles.disclosure}
      >
        <Text style={[styles.disclosureTitle, ui.grow]}>{title}</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.muted}
        />
      </Pressable>
      {expanded && <View style={styles.details}>{children}</View>}
    </View>
  );
}

export function SettingRow({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  unavailable = false,
  children,
}: {
  label: string;
  value?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  unavailable?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={styles.setting}
      accessible={unavailable}
      accessibilityLabel={unavailable ? `${label}. ${value ?? ''} Coming soon` : undefined}
      accessibilityState={unavailable ? { disabled: true } : undefined}
      aria-disabled={unavailable || undefined}
    >
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: iconBg || colors.primarySoft }]}>
          <MaterialCommunityIcons name={icon} size={18} color={iconColor || colors.primaryText} />
        </View>
      ) : null}
      <View style={ui.grow}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      {unavailable ? (
        <View style={styles.unavailableChip}>
          <Text style={styles.unavailable}>Soon</Text>
        </View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  brand: {
    fontSize: 19,
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeLinked: {
    backgroundColor: colors.successSoft,
  },
  badgeDemo: {
    backgroundColor: colors.primarySoft,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextLinked: {
    color: colors.successText,
  },
  badgeTextDemo: {
    color: colors.primaryText,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  immersiveContent: {
    paddingBottom: spacing.xxl,
  },
  sectionWrap: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.25,
  },
  sectionAction: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  disclosureWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 2,
    paddingTop: 4,
  },
  disclosure: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  details: {
    paddingTop: spacing.sm,
    paddingBottom: 4,
    gap: spacing.sm,
  },
  setting: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 6,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  settingValue: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  unavailableChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  unavailable: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});
