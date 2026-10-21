import { StyleSheet, Text, View } from 'react-native';
import { firstLanguages } from '../../../shared/i18n.js';
import { colors } from '../theme.js';
import { Panel } from './ui.js';

export default function LanguagePanel({ parking }) {
  const { t } = parking;

  return (
    <Panel title={t('languagePanelTitle')} subtitle={t('languagePanelSubtitle')}>
      <View style={styles.list}>
        {firstLanguages.map((name) => (
          <Text key={name} style={styles.item}>
            {name}
          </Text>
        ))}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: colors.ink,
  },
});
