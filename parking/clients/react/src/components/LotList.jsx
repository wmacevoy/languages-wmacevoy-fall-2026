import Status from './Status.jsx';

export default function LotList({ parking }) {
  const { t, formatDate, lots, loadError } = parking;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{t('customerViewTitle')}</h2>
        <p>{t('customerViewSubtitle')}</p>
      </div>
      <div id="lot-list">
        {lots.map((lot, index) => (
          <div key={lot.id} className="lot-card" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="lot-top">
              <strong>{lot.name}</strong>
              <span className={`badge ${lot.is_open ? 'open' : 'closed'}`}>
                {lot.is_open ? t('lotOpen') : t('lotClosed')}
              </span>
            </div>
            <div className="availability">
              <span>{t('availableLabel')}</span>
              <strong>{lot.available}</strong>
            </div>
            <div className="meta-row">
              <span>
                {t('capacityLabel')}: {lot.capacity}
              </span>
              <span>
                {t('occupiedLabel')}: {lot.occupancy}
              </span>
            </div>
            <div className="meta-row">
              <span>{t('updatedLabel')}</span>
              <span>{formatDate(lot.updated_at)}</span>
            </div>
          </div>
        ))}
      </div>
      {loadError && (
        <Status status={{ text: loadError.message || t('errLoadLots'), isError: true }} />
      )}
    </div>
  );
}
