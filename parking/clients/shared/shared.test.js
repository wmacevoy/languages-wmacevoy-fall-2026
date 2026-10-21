import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { createApi } from './api.js';
import { isLanguage, translate } from './i18n.js';
import { isAdmin, isSensor, roleKey, sensorLots } from './roles.js';
import translations from './translations.js';

test('translations match the vanilla app word for word', () => {
  const appJs = readFileSync(new URL('../../server/public/app.js', import.meta.url), 'utf8');
  const source = appJs.slice(
    appJs.indexOf('const translations = {'),
    appJs.indexOf('const dateLocales')
  );
  const context = {};
  vm.runInNewContext(source.replace('const translations =', 'translations ='), context);
  // Compare as JSON: objects built inside the vm have a different Object prototype.
  assert.equal(JSON.stringify(translations), JSON.stringify(context.translations));
});

test('every language has every English key', () => {
  const keys = Object.keys(translations.en);
  for (const [language, pack] of Object.entries(translations)) {
    assert.deepEqual(Object.keys(pack), keys, language);
  }
});

test('translate fills tokens and leaves unknown ones visible', () => {
  assert.equal(translate('en', 'createdUser', { username: 'ada' }), 'Created ada.');
  assert.equal(translate('en', 'createdUser'), 'Created {username}.');
  assert.equal(translate('es', 'languageLabel'), 'Idioma');
});

test('translate falls back to English, then to the key', () => {
  assert.equal(translate('xx', 'languageLabel'), 'Language');
  assert.equal(translate('en', 'noSuchKey'), 'noSuchKey');
  assert.equal(isLanguage('ja'), true);
  assert.equal(isLanguage('xx'), false);
  assert.equal(isLanguage(null), false);
});

test('roles decide which panels show', () => {
  const root = { role: 'admin', is_root: true };
  const admin = { role: 'admin', is_root: false };
  const sensor = { role: 'sensor', lot_id: 2, is_root: false };
  const lots = [{ id: 1 }, { id: 2 }];

  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin(admin), true);
  assert.equal(isSensor(admin), false);
  assert.equal(isSensor(root), true);

  assert.deepEqual(sensorLots(null, lots), []);
  assert.deepEqual(sensorLots(root, lots), lots);
  assert.deepEqual(sensorLots(sensor, lots), [{ id: 2 }]);

  assert.equal(roleKey('admin', true), 'roleRoot');
  assert.equal(roleKey('sensor'), 'roleSensor');
  assert.equal(roleKey('none'), 'roleNone');
});

test('api sends the token and surfaces the server error', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ error: 'Sensor not assigned to this lot' }), {
      status: 403,
    });
  });

  const api = createApi('http://server', () => 'abc');
  await assert.rejects(api.updateOccupancy(3, 7), (error) => {
    assert.equal(error.message, 'Sensor not assigned to this lot');
    assert.equal(error.status, 403);
    return true;
  });

  assert.equal(calls[0].url, 'http://server/api/lots/3/occupancy');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer abc');
  assert.equal(calls[0].options.body, '{"occupancy":7}');
});

test('api leaves the message empty when the server sends none', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>', { status: 502 }));

  const api = createApi('', () => null);
  await assert.rejects(api.listLots(), (error) => {
    assert.equal(error.message, '');
    assert.equal(error.status, 502);
    return true;
  });
});
