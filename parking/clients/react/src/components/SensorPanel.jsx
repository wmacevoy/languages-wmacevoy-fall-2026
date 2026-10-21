import { useState } from 'react';
import { sensorLots } from '../../../shared/roles.js';
import { isValidOccupancy } from '../../../shared/validation.js';
import { api } from '../api.js';
import Status from './Status.jsx';

export default function SensorPanel({ parking }) {
  const { t, lots, user, refresh } = parking;
  const choices = sensorLots(user, lots);
  const [lotId, setLotId] = useState('');
  // null until the user types, so the field follows the live count without overwriting an
  // edit in progress when the lots refresh.
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(null);

  const lot = choices.find((item) => String(item.id) === lotId) ?? choices[0];
  const occupancy = draft ?? String(lot?.occupancy ?? 0);

  function chooseLot(id) {
    setLotId(id);
    setDraft(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // An empty field is '', which Number() would quietly send as 0.
    if (!isValidOccupancy(occupancy)) {
      setStatus({ text: t('errOccupancy'), isError: true });
      return;
    }
    setStatus({ text: t('sending') });
    try {
      const updated = await api.updateOccupancy(lot.id, Number(occupancy));
      setStatus({
        text: t('occupancyUpdated', { name: updated.name, occupancy: updated.occupancy }),
      });
      await refresh();
      setDraft(null);
    } catch (err) {
      setStatus({ text: err.message || t('errUpdateFailed'), isError: true });
    }
  }

  return (
    <div className="panel" id="sensor-panel">
      <div className="panel-header">
        <h2>{t('sensorUpdateTitle')}</h2>
        <p>{t('sensorUpdateSubtitle')}</p>
      </div>
      <form className="stack" onSubmit={handleSubmit}>
        <label>
          <span>{t('lotLabel')}</span>
          <select
            value={lot ? String(lot.id) : ''}
            disabled={choices.length <= 1}
            onChange={(event) => chooseLot(event.target.value)}
          >
            {choices.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('occupancyLabel')}</span>
          <input
            type="number"
            min="0"
            max={lot?.capacity}
            value={occupancy}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <button type="submit" className="primary">
          {t('sendUpdate')}
        </button>
      </form>
      <Status status={status} />
    </div>
  );
}
