import assert from 'node:assert/strict';
import { test } from 'node:test';
import translations from './translations.js';
import {
  asText,
  isValidId,
  isValidLogin,
  isValidNewUser,
  isValidOccupancy,
  loginError,
  matches,
  newUserError,
  rules,
} from './validation.js';

// Each rule on its own: what it must accept, and what it must refuse.
const cases = {
  username: {
    accept: ['root', 'sensor/north', 'sensor/test-vanilla', 'a', 'lot_2.b', 'x'.repeat(32)],
    refuse: [
      '',
      'x'.repeat(33),
      'Root',
      'has space',
      ' root',
      'sensor/',
      '/north',
      'a/b/c',
      '-root',
      'sensor/-north',
      'sensor/north\n',
      'ünïcode',
      '<img src=x onerror="window.injected=true">',
    ],
  },
  password: {
    accept: ['rootpass', 'testpass', 'P@ss!w0rd~', 'pass word', 'x'.repeat(72)],
    refuse: [
      '',
      'short12',
      ' password',
      'password ',
      '        ',
      'tab\there1',
      'new\nline1',
      'pässwörd',
      'x'.repeat(73),
    ],
  },
  filled: {
    accept: ['x', ' x ', 'rootpass'],
    refuse: ['', ' ', '\t\n'],
  },
  role: {
    accept: ['none', 'admin', 'sensor'],
    refuse: ['', 'Admin', 'root', 'administrator', 'nonesuch', 'sensors', 'admin sensor'],
  },
  id: {
    accept: ['1', '42', '999999999', 1, 42],
    refuse: ['', '0', '01', '-1', '+1', '1.0', '1e3', '0x10', ' 1', '1 ', '1234567890', 0, 1.5],
  },
  count: {
    accept: ['0', '7', '120', 0, 7, '999999999'],
    refuse: ['', '00', '07', '-1', '7.5', '1e1', 'seven', 7.5, -1, NaN, Infinity],
  },
};

for (const [name, { accept, refuse }] of Object.entries(cases)) {
  test(`${name} accepts what it should`, () => {
    for (const value of accept) assert.equal(matches(rules[name], value), true, value);
  });

  test(`${name} refuses what it should`, () => {
    for (const value of refuse) assert.equal(matches(rules[name], value), false, value);
  });
}

test('every rule is tested here', () => {
  assert.deepEqual(Object.keys(cases).sort(), Object.keys(rules).sort());
});

test('a rule is the intersection of its patterns', () => {
  const rule = [/^[a-z]*$/, /^.{2,3}$/];
  assert.equal(matches(rule, 'ab'), true);
  assert.equal(matches(rule, 'AB'), false); // fails the first only
  assert.equal(matches(rule, 'abcd'), false); // fails the second only

  // An empty rule asks nothing, so any text passes; what is not text still does not.
  assert.equal(matches([], ''), true);
  assert.equal(matches([], 'anything at all'), true);
  assert.equal(matches([], null), false);
});

test('patterns keep no state between calls', () => {
  for (const [name, rule] of Object.entries(rules)) {
    for (const pattern of rule) assert.equal(pattern.flags, '', `${name} ${pattern}`);
  }

  // Why no g flag: the same regex, given the same valid input, changes its answer.
  const sticky = new RegExp(rules.role[0].source, 'g');
  assert.equal(sticky.test('admin'), true);
  assert.equal(sticky.test('admin'), false);
});

test('only strings and finite numbers are text', () => {
  assert.equal(asText('7'), '7');
  assert.equal(asText(7), '7');
  assert.equal(asText(NaN), null);
  for (const value of [undefined, null, true, ['7'], { toString: () => '7' }]) {
    assert.equal(asText(value), null);
    assert.equal(matches(rules.count, value), false);
  }
});

test('a form is valid only when every field is, and its error names the first that is not', () => {
  assert.equal(loginError({ username: 'root', password: 'rootpass' }), null);
  assert.equal(loginError({ username: 'root', password: '' }), 'errPasswordRequired');
  assert.equal(loginError({ username: 'Bad Name', password: '' }), 'errUsername');
  assert.equal(loginError(undefined), 'errUsername');
  assert.equal(loginError(null), 'errUsername');

  const sensor = { username: 'sensor/east', password: 'testpass', role: 'sensor', lot_id: 2 };
  assert.equal(newUserError(sensor), null);
  assert.equal(newUserError({ ...sensor, role: undefined, lot_id: null }), null);
  assert.equal(newUserError({ ...sensor, role: null, lot_id: null }), null);
  assert.equal(newUserError({ ...sensor, username: 'sensor east' }), 'errUsername');
  assert.equal(newUserError({ ...sensor, password: 'short' }), 'errPassword');
  assert.equal(newUserError({ ...sensor, role: 'root' }), 'errRole');
  assert.equal(newUserError({ ...sensor, lot_id: 0 }), 'errSensorLot');
  assert.equal(newUserError({ ...sensor, role: 'admin', lot_id: 0 }), null);

  assert.equal(isValidLogin({ username: 'root', password: 'rootpass' }), true);
  assert.equal(isValidLogin({ username: 'root', password: ' ' }), false);
  assert.equal(isValidNewUser(sensor), true);
  assert.equal(isValidNewUser({ ...sensor, lot_id: '' }), false);
  assert.equal(isValidOccupancy(''), false);
  assert.equal(isValidId('1.0'), false);
});

test('every message a check can return is translated', () => {
  const keys = [
    'errUsername',
    'errPassword',
    'errPasswordRequired',
    'errRole',
    'errSensorLot',
    'errLotId',
    'errUserId',
    'errOccupancy',
  ];
  for (const key of keys) assert.ok(Object.hasOwn(translations.en, key), key);
});
