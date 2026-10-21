import { StyleSheet, View } from 'react-native';
import { languages } from '../../../shared/i18n.js';
import { Choices } from './ui.js';

export default function LanguagePicker({ parking }) {
  const { t, language, setLanguage } = parking;
  const options = languages.map(({ code, name }) => ({ value: code, label: name }));

  return (
    <View style={styles.picker}>
      <Choices
        label={t('languageLabel')}
        options={options}
        value={language}
        onChange={setLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    paddingVertical: 4,
  },
});
