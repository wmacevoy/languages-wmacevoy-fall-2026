import AsyncStorage from '@react-native-async-storage/async-storage';
import { configure, render, screen, userEvent, within } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import App from '../App';

// The stories from acceptance/parking.spec.js, told to the React Native tree instead of a
// browser. Like that suite, these talk to the live server, so start it first
// (docker compose up, from parking/).

const SERVER = 'http://localhost:3000';

configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(20000);

beforeEach(async () => {
  await SecureStore.deleteItemAsync('parking_token');
  await AsyncStorage.clear();
});

async function startApp() {
  const user = userEvent.setup();
  const app = await render(<App />);
  expect(await screen.findByTestId('lot North Deck')).toBeOnTheScreen();
  return { user, app };
}

async function signIn(user, username, password) {
  const panel = within(screen.getByTestId('auth-panel'));
  // The username field keeps its text after signing out, as in the vanilla app.
  await user.clear(panel.getByLabelText('Username'));
  await user.type(panel.getByLabelText('Username'), username);
  await user.type(panel.getByLabelText('Password'), password);
  await user.press(panel.getByRole('button', { name: 'Sign In' }));
  expect(await screen.findByText('Signed in.')).toBeOnTheScreen();
}

async function signOut(user) {
  await user.press(screen.getByRole('button', { name: 'Logout' }));
  expect(await screen.findByText('Signed out.')).toBeOnTheScreen();
}

function expectPanels({ admin, sensor, users }) {
  expect(screen.queryByTestId('admin-panel') !== null).toBe(admin);
  expect(screen.queryByTestId('sensor-panel') !== null).toBe(sensor);
  expect(screen.queryByTestId('users-panel') !== null).toBe(users);
}

// Setup and cleanup go straight to the API, so a failed assertion cannot leave data behind.
async function authHeaders(username, password) {
  const response = await fetch(`${SERVER}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const { token } = await response.json();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function deleteUsersNamed(username) {
  const headers = await authHeaders('root', 'rootpass');
  const users = await (await fetch(`${SERVER}/api/users`, { headers })).json();
  for (const account of users.filter((item) => item.username === username)) {
    await fetch(`${SERVER}/api/users/${account.id}`, { method: 'DELETE', headers });
  }
}

test('each role sees exactly its own panels', async () => {
  const { user } = await startApp();
  expectPanels({ admin: false, sensor: false, users: false });

  await signIn(user, 'sensor/north', 'sensorpass');
  expectPanels({ admin: false, sensor: true, users: false });
  await signOut(user);

  await signIn(user, 'root', 'rootpass');
  expectPanels({ admin: true, sensor: true, users: true });
});

test('a guest sees every lot', async () => {
  await startApp();
  for (const name of ['North Deck', 'South Lot', 'River Garage', 'Overflow Gravel']) {
    expect(screen.getByTestId(`lot ${name}`)).toBeOnTheScreen();
  }
  expect(within(screen.getByTestId('auth-panel')).getByText('Guest')).toBeOnTheScreen();
});

test('the chosen language translates the app and survives a restart', async () => {
  const { user, app } = await startApp();
  await user.press(screen.getByRole('radio', { name: 'Español' }));
  expect(
    screen.getByRole('header', { name: 'Disponibilidad de Estacionamiento en Vivo' })
  ).toBeOnTheScreen();

  await app.unmount();
  await render(<App />);
  expect(
    await screen.findByRole('header', { name: 'Disponibilidad de Estacionamiento en Vivo' })
  ).toBeOnTheScreen();
});

test('a session survives a restart, and signing out ends it', async () => {
  let { user, app } = await startApp();
  await signIn(user, 'root', 'rootpass');

  await app.unmount();
  ({ user, app } = await startApp());
  expect(await screen.findByText('root (root)')).toBeOnTheScreen();

  await signOut(user);
  await app.unmount();
  await startApp();
  expect(within(screen.getByTestId('auth-panel')).getByText('Guest')).toBeOnTheScreen();
});

// Leaves River Garage open, as the seed has it.
test('an admin closes and reopens a lot', async () => {
  const { user } = await startApp();
  await signIn(user, 'root', 'rootpass');
  const admin = within(screen.getByTestId('admin-panel'));
  const card = () => within(screen.getByTestId('lot River Garage'));

  await user.press(admin.getByRole('radio', { name: 'River Garage' }));
  await user.press(admin.getByRole('button', { name: 'Close Lot' }));
  expect(await admin.findByText('River Garage is now closed.')).toBeOnTheScreen();
  expect(card().getByText('Closed')).toBeOnTheScreen();

  await user.press(admin.getByRole('button', { name: 'Open Lot' }));
  expect(await admin.findByText('River Garage is now open.')).toBeOnTheScreen();
  expect(card().getByText('Open')).toBeOnTheScreen();
});

test('a sensor reports occupancy for its own lot only', async () => {
  const { user } = await startApp();
  await signIn(user, 'sensor/north', 'sensorpass');
  const sensor = within(screen.getByTestId('sensor-panel'));
  const choices = sensor.getAllByRole('radio');
  expect(choices).toHaveLength(1);
  expect(sensor.getByRole('radio', { name: 'North Deck' })).toBeDisabled();

  const count = sensor.getByLabelText('Occupancy');
  const before = Number(count.props.value);
  const after = before === 0 ? 1 : before - 1;
  try {
    await user.clear(count);
    await user.type(count, String(after));
    await user.press(sensor.getByRole('button', { name: 'Send Update' }));
    expect(
      await sensor.findByText(`North Deck occupancy updated to ${after}.`)
    ).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('lot North Deck')).getByText(`Occupied: ${after}`)
    ).toBeOnTheScreen();
  } finally {
    const headers = await authHeaders('sensor/north', 'sensorpass');
    const lots = await (await fetch(`${SERVER}/api/lots`)).json();
    const north = lots.find((item) => item.name === 'North Deck');
    await fetch(`${SERVER}/api/lots/${north.id}/occupancy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ occupancy: before }),
    });
  }
});

test('an admin creates and deletes a sensor user', async () => {
  const username = 'sensor/test-react-native';
  await deleteUsersNamed(username);
  const { user } = await startApp();
  await signIn(user, 'root', 'rootpass');
  const users = within(screen.getByTestId('users-panel'));

  try {
    await user.type(users.getByLabelText('Username'), username);
    await user.type(users.getByLabelText('Password'), 'testpass');
    await user.press(users.getByRole('radio', { name: 'Sensor' }));
    await user.press(users.getByRole('radio', { name: 'South Lot' }));
    await user.press(users.getByRole('button', { name: 'Create User' }));
    expect(await users.findByText(`Created ${username}.`)).toBeOnTheScreen();

    const row = within(await screen.findByTestId(`user ${username}`));
    expect(row.getByText('Lot: South Lot')).toBeOnTheScreen();
    expect(row.getByText('Sensor')).toBeOnTheScreen();

    await user.press(row.getByRole('button', { name: 'Delete' }));
    expect(await users.findByText(`Deleted ${username}.`)).toBeOnTheScreen();
    expect(screen.queryByTestId(`user ${username}`)).toBeNull();
  } finally {
    await deleteUsersNamed(username);
  }
});

test('a username that is markup is refused, by the form and by the server', async () => {
  const username = '<img src=x onerror="window.injected=true">react-native';
  await deleteUsersNamed(username);

  try {
    const response = await fetch(`${SERVER}/api/users`, {
      method: 'POST',
      headers: await authHeaders('root', 'rootpass'),
      body: JSON.stringify({ username, password: 'testpass', role: 'none' }),
    });
    expect(response.status).toBe(400);

    const { user } = await startApp();
    await signIn(user, 'root', 'rootpass');
    const users = within(screen.getByTestId('users-panel'));
    await user.type(users.getByLabelText('Username'), username);
    await user.type(users.getByLabelText('Password'), 'testpass');
    await user.press(users.getByRole('button', { name: 'Create User' }));
    expect(await users.findByText(/^Username: 1–32 lowercase letters/)).toBeOnTheScreen();
    expect(screen.queryByTestId(`user ${username}`)).toBeNull();
  } finally {
    await deleteUsersNamed(username);
  }
});

// The app checks with the same patterns as the server, so a bad value never leaves the phone.
test('a form refuses bad input without sending it', async () => {
  const { user } = await startApp();
  await signIn(user, 'root', 'rootpass');
  const posts = jest.spyOn(global, 'fetch');

  try {
    const users = within(screen.getByTestId('users-panel'));
    await user.type(users.getByLabelText('Username'), 'sensor/east');
    await user.type(users.getByLabelText('Password'), 'short');
    await user.press(users.getByRole('button', { name: 'Create User' }));
    expect(await users.findByText(/^Password: 8–72 characters/)).toBeOnTheScreen();

    // Number('') is 0, so before the check an empty field quietly emptied the lot.
    const sensor = within(screen.getByTestId('sensor-panel'));
    await user.clear(sensor.getByLabelText('Occupancy'));
    await user.press(sensor.getByRole('button', { name: 'Send Update' }));
    expect(await sensor.findByText(/^Occupancy must be a whole number/)).toBeOnTheScreen();

    const sent = posts.mock.calls.filter(([, options]) => options?.method === 'POST');
    expect(sent).toEqual([]);
  } finally {
    posts.mockRestore();
  }
});
