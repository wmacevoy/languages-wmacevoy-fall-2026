import { firstLanguages } from '../../../shared/i18n.js';

export default function LanguagePanel({ parking }) {
  const { t } = parking;

  return (
    <div className="panel language-panel">
      <div className="panel-header">
        <h2>{t('languagePanelTitle')}</h2>
        <p>{t('languagePanelSubtitle')}</p>
      </div>
      <ul className="language-list">
        {firstLanguages.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
