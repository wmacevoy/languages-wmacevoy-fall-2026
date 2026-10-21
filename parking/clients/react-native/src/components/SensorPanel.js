import { useState } from 'react';
import { sensorLots } from '../../../shared/roles.js';
import { isValidOccupancy } from '../../../shared/validation.js';
import { api } from '../api.js';
import { Button, Choices, Field, Panel, Status } from './ui.js';

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
  const options = choices.map((item) => ({ value: String(item.id), label: item.name }));

  function chooseLot(id) {
    setLotId(id);
    setDraft(null);
  }

  async function handleSubmit() {
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
    <Panel id="sensor-panel" title={t('sensorUpdateTitle')} subtitle={t('sensorUpdateSubtitle')}>
      <Choices
        label={t('lotLabel')}
        options={options}
        value={lot ? String(lot.id) : ''}
        onChange={chooseLot}
        disabled={choices.length <= 1}
      />
      <Field
        label={t('occupancyLabel')}
        value={occupancy}
        onChangeText={setDraft}
        keyboardType="number-pad"
        onSubmitEditing={handleSubmit}
      />
      <Button label={t('sendUpdate')} onPress={handleSubmit} />
      <Status status={status} />
    </Panel>
  );
}
