import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { api } from '../api.js';
import { Button, Choices, Panel, Status } from './ui.js';

export default function AdminPanel({ parking }) {
  const { t, lots, refresh } = parking;
  const [lotId, setLotId] = useState('');
  const [status, setStatus] = useState(null);
  // Until someone picks, the first lot is selected.
  const selectedId = lotId || String(lots[0]?.id ?? '');
  const options = lots.map((lot) => ({ value: String(lot.id), label: lot.name }));

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
    <Panel id="admin-panel" title={t('adminConsoleTitle')} subtitle={t('adminConsoleSubtitle')}>
      <Choices label={t('lotLabel')} options={options} value={selectedId} onChange={setLotId} />
      <View style={styles.buttons}>
        <Button label={t('openLot')} onPress={() => setOpen(true)} />
        <Button kind="danger" label={t('closeLot')} onPress={() => setOpen(false)} />
      </View>
      <Status status={status} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
