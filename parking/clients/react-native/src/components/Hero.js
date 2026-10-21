import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme.js';
import { Button } from './ui.js';

export default function Hero({ parking }) {
  const { t, formatDate, lastRefreshAt, refresh } = parking;

  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{t('eyebrowCityParking')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('heroTitle')}
      </Text>
      <Text style={styles.subtitle}>{t('heroSubtitle')}</Text>
      <View style={styles.meta}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('lastRefresh')}</Text>
          <Text>{lastRefreshAt ? formatDate(lastRefreshAt) : '--'}</Text>
        </View>
        <Button kind="ghost" label={t('refreshNow')} onPress={refresh} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    color: colors.eyebrow,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaCard: {
    backgroundColor: colors.panel,
    borderRadius: radius,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metaLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 11,
    color: colors.inkSoft,
  },
});
