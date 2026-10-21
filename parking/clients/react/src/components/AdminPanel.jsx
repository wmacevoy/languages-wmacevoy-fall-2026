import { useState } from 'react';
import { api } from '../api.js';
import Status from './Status.jsx';

export default function AdminPanel({ parking }) {
  const { t, lots, refresh } = parking;
  const [lotId, setLotId] = useState('');
  const [status, setStatus] = useState(null);
  // Until someone picks, the first lot is selected.
  const selectedId = lotId || String(lots[0]?.id ?? '');

  async function setOpen(open) {
    setStatus({ text: t('working') });
    try {
      const lot = await api.setLotOpen(selectedId, open);
      setStatus({
        text: t('lotNowState', {
          name: lot.name,
          state: t(lot.is_open ? 'stateOpen' : 'stateClosed'),
        }),
      });
      await refresh();
    } catch (err) {
      setStatus({ text: err.message || t('errActionFailed'), isError: true });
    }
  }

  return (
    <div className="panel" id="admin-panel">
      <div className="panel-header">
        <h2>{t('adminConsoleTitle')}</h2>
        <p>{t('adminConsoleSubtitle')}</p>
      </div>
      <div className="stack">
        <label>
          <span>{t('lotLabel')}</span>
          <select value={selectedId} onChange={(event) => setLotId(event.target.value)}>
            {lots.map((lot) => (
              <option key={lot.id} value={String(lot.id)}>
                {lot.name}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button type="button" className="primary" onClick={() => setOpen(true)}>
            {t('openLot')}
          </button>
          <button type="button" className="danger" onClick={() => setOpen(false)}>
            {t('closeLot')}
          </button>
        </div>
      </div>
      <Status status={status} />
    </div>
  );
}
