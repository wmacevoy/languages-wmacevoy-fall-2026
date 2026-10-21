export default function Hero({ parking }) {
  const { t, formatDate, lastRefreshAt, refresh } = parking;

  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{t('eyebrowCityParking')}</p>
        <h1>{t('heroTitle')}</h1>
        <p className="subtitle">{t('heroSubtitle')}</p>
      </div>
      <div className="meta">
        <div className="meta-card">
          <span className="meta-label">{t('lastRefresh')}</span>
          <span id="last-updated">{lastRefreshAt ? formatDate(lastRefreshAt) : '--'}</span>
        </div>
        <button id="refresh" type="button" className="ghost" onClick={refresh}>
          {t('refreshNow')}
        </button>
      </div>
    </header>
  );
}
