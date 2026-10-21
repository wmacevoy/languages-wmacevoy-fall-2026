import { languages } from '../../../shared/i18n.js';

export default function LanguagePicker({ parking }) {
  const { t, language, setLanguage } = parking;

  return (
    <div className="language-picker">
      <label htmlFor="language-select">{t('languageLabel')}</label>
      <select
        id="language-select"
        aria-label={t('languageLabel')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {languages.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
