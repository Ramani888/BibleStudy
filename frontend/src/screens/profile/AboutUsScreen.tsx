import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { QMBackButton, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography, VerdanceLogo } from '../../components/ui';
import { ChevronRightIcon, DocIcon, FlagIcon, MailIcon, ShieldIcon, type IconComponent } from '../../components/icons';
import { useTabBarSpace } from '../../hooks';
import { APP_VERSION } from '../../constants';
import { radius, spacing, useTheme } from '../../theme';

const SUPPORT_EMAIL = 'ddtechservices.work@gmail.com';
const TERMS_URL = 'https://getverdance.com/terms.html';
const LOGO = 96;
const TILE = 34;
const TILE_RADIUS = 11;
const ROW_H = 58;

export function AboutUsScreen({ navigation }: ProfileScreenProps<'AboutUs'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();

  const violet: [string, string] = [qm.lilac, qm.link];
  const links: { label: string; sub: string; icon: IconComponent; tint: [string, string]; go: () => void }[] = [
    { label: t('profile:qmAbout.email'), sub: SUPPORT_EMAIL, icon: MailIcon, tint: violet, go: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`) },
    {
      label: t('profile:qmAbout.report'), sub: t('profile:qmAbout.reportSub'), icon: FlagIcon, tint: [qm.errorBg, qm.warm],
      go: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('profile:qmAbout.reportSubject'))}`),
    },
    { label: t('profile:qmAbout.privacy'), sub: t('profile:qmAbout.privacySub'), icon: ShieldIcon, tint: violet, go: () => navigation.navigate('PrivacyPolicy') },
    { label: t('profile:qmAbout.terms'), sub: t('profile:qmAbout.termsSub'), icon: DocIcon, tint: violet, go: () => Linking.openURL(TERMS_URL) },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl + tabSpace }]} showsVerticalScrollIndicator={false}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmAbout.back')} />

        <View style={styles.brand}>
          <Animated.View entering={FadeIn.duration(500)} style={[styles.logo, { backgroundColor: qm.brand, boxShadow: qm.btnShadow }]}>
            <VerdanceLogo size={LOGO * 0.45} color={qm.onViolet} />
          </Animated.View>
          <Typography preset="qmPageTitle" color={qm.ink} style={styles.name}>{t('common:appName', 'Verdance')}</Typography>
          <Typography preset="qmBody" color={qm.muted}>{t('profile:qmAbout.version', { version: APP_VERSION })}</Typography>
        </View>

        <Animated.View entering={qmRowEnter(1)}>
          <Typography preset="qmLead" color={qm.body} style={styles.lead}>{t('profile:qmAbout.lead')}</Typography>
        </Animated.View>

        <Animated.View entering={qmRowEnter(2)}>
          <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.hope}>
            <Typography preset="qmLabel" color={qm.heroMuted}>{t('profile:qmAbout.hopeLabel')}</Typography>
            <Typography preset="qmVerse" color={qm.heroInk} style={styles.hopeText}>{t('profile:qmAbout.hope')}</Typography>
          </LinearGradient>
        </Animated.View>

        <Typography preset="qmLabel" color={qm.muted} style={styles.section}>{t('profile:qmAbout.touch')}</Typography>
        <Animated.View entering={qmRowEnter(3)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          {links.map((l, i) => (
            <AnimatedPressable
              key={l.label}
              scaleTo={0.98}
              onPress={l.go}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}
              accessibilityRole="button"
              accessibilityLabel={`${l.label}. ${l.sub}`}
            >
              <View style={[styles.tile, { backgroundColor: l.tint[0] }]}>
                <l.icon size={18} color={l.tint[1]} strokeWidth={2} />
              </View>
              <View style={styles.flex}>
                <Typography preset="qmRow" color={qm.ink}>{l.label}</Typography>
                <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.sub}>{l.sub}</Typography>
              </View>
              <ChevronRightIcon size={16} color={qm.muted} strokeWidth={2} />
            </AnimatedPressable>
          ))}
        </Animated.View>

        <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.care}>{t('profile:qmAbout.care')}</Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  brand: { alignItems: 'center', marginTop: spacing.s10 },
  logo: { width: LOGO, height: LOGO, borderRadius: spacing.s28, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: spacing.s18, marginBottom: spacing.xs },
  lead: { marginTop: spacing.s22, marginHorizontal: spacing.xs },
  hope: { marginTop: spacing.s18, padding: spacing.xl, borderRadius: radius.r20 + 2 },
  hopeText: { marginTop: spacing.sm },
  section: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  card: { borderRadius: radius.r20, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, minHeight: ROW_H },
  tile: { width: TILE, height: TILE, borderRadius: TILE_RADIUS, alignItems: 'center', justifyContent: 'center' },
  sub: { marginTop: spacing.s2 },
  care: { marginTop: spacing.s22 },
});
