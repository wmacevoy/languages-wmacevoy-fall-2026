import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme.js';
import { Panel, Status } from './ui.js';

export default function LotList({ parking }) {
  const { t, formatDate, lots, loadError } = parking;

  return (
    <Panel id="lot-list" title={t('customerViewTitle')} subtitle={t('customerViewSubtitle')}>
      {lots.map((lot) => (
        <View key={lot.id} testID={`lot ${lot.name}`} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{lot.name}</Text>
            <View style={[styles.badge, lot.is_open ? styles.open : styles.closed]}>
              <Text style={[styles.badgeText, lot.is_open ? styles.openText : styles.closedText]}>
                {lot.is_open ? t('lotOpen') : t('lotClosed')}
              </Text>
            </View>
          </View>
          <View style={[styles.row, styles.baseline]}>
            <Text>{t('availableLabel')}</Text>
            <Text style={styles.available}>{lot.available}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>
              {t('capacityLabel')}: {lot.capacity}
            </Text>
            <Text style={styles.meta}>
              {t('occupiedLabel')}: {lot.occupancy}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.meta}>{t('updatedLabel')}</Text>
            <Text style={styles.meta}>{formatDate(lot.updated_at)}</Text>
          </View>
        </View>
      ))}
      {loadError && (
        <Status status={{ text: loadError.message || t('errLoadLots'), isError: true }} />
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  baseline: {
    alignItems: 'baseline',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    flexShrink: 1,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  open: {
    backgroundColor: colors.openBackground,
  },
  openText: {
    color: colors.openText,
  },
  closed: {
    backgroundColor: colors.closedBackground,
  },
  closedText: {
    color: colors.closedText,
  },
  available: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    fontSize: 14,
    color: colors.inkSoft,
  },
});
