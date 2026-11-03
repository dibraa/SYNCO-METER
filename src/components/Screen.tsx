import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, ui } from '../theme/theme';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function Screen({
  title,
  subtitle,
  brand,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  brand?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const isLinked = isSupabaseConfigured();
  const label = badge || (isLinked ? 'Live' : 'Demo Mode');

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
          <Text style={brand ? styles.brand : ui.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle && <Text style={ui.muted}>{subtitle}</Text>}
        </View>
        <View style={[styles.badgeContainer, isLinked ? styles.badgeLinked : styles.badgeDemo]}>
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: isLinked ? colors.green : '#D97706' },
            ]}
          />
          <Text style={[styles.badgeText, isLinked ? styles.badgeTextLinked : styles.badgeTextDemo]}>
            {label}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={ui.section}>
      <Text style={ui.heading} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        style={styles.disclosure}
      >
        <Text style={[ui.body, ui.grow]}>{title}</Text>
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
  unavailable = false,
  children,
}: {
  label: string;
  value?: string;
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
      <View style={ui.grow}>
        <Text style={ui.body}>{label}</Text>
        {value && <Text style={ui.muted}>{value}</Text>}
      </View>
      {unavailable ? <Text style={styles.unavailable}>Coming soon</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandLogo: { width: 36, height: 36, borderRadius: 8 },
  brand: { fontSize: 19, color: colors.text, fontWeight: '800' },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeLinked: {
    backgroundColor: colors.greenSoft,
    borderColor: '#CCDFD1',
  },
  badgeDemo: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FED7AA',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextLinked: {
    color: colors.green,
  },
  badgeTextDemo: {
    color: '#B45309',
  },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  disclosure: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  details: { paddingTop: spacing.sm, gap: spacing.md },
  setting: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  unavailable: { color: colors.muted, fontSize: 11, backgroundColor: colors.neutral, padding: 6, borderRadius: 6 },
});
