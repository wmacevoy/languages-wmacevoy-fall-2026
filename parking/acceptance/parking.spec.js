import { expect, test } from '@playwright/test';

// One set of stories, run against every web client. The tests find things the way a person
// does, by visible English text and labels, plus the panel ids and class names the clients
// share. Nothing here knows which framework drew the page.

const lotCard = (page, name) => page.locator('.lot-card', { hasText: name });

// Known bugs in the vanilla app, kept as exhibits. If one gets fixed, its test reports
// "expected to fail, but passed", which is the cue to delete the line here.
const vanillaBugs = {
  hidden: 'styles.css gives .panel display:flex, which overrides the hidden attribute',
};

// The first words of the messages from clients/shared/validation.js.
const refusals = {
  username: 'Username: 1–32 lowercase letters',
  password: 'Password: 8–72 characters',
  occupancy: 'Occupancy must be a whole number',
};

async function signIn(page, username, password) {
  const panel = page.locator('#auth-panel');
  await panel.getByLabel('Username').fill(username);
  await panel.getByLabel('Password').fill(password);
  await panel.getByRole('button', { name: 'Sign In' }).click();
  await expect(panel).toContainText('Signed in.');
}

async function signOut(page) {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Logout' }).click();
  await expect(panel).toContainText('Signed out.');
}

async function expectPanels(page, { admin, sensor, users }) {
  await expect(page.locator('#admin-panel')).toBeVisible({ visible: admin });
  await expect(page.locator('#sensor-panel')).toBeVisible({ visible: sensor });
  await expect(page.locator('#users-panel')).toBeVisible({ visible: users });
}

// Setup and cleanup go straight to the API, so a failed assertion cannot leave data behind.
async function authHeaders(request, username, password) {
  const response = await request.post('/api/login', { data: { username, password } });
  const { token } = await response.json();
  return { Authorization: `Bearer ${token}` };
}

async function deleteUsersNamed(request, username) {
  const headers = await authHeaders(request, 'root', 'rootpass');
  const users = await (await request.get('/api/users', { headers })).json();
  for (const user of users.filter((item) => item.username === username)) {
    await request.delete(`/api/users/${user.id}`, { headers });
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(lotCard(page, 'North Deck')).toBeVisible();
});

test('each role sees exactly its own panels', async ({ page }, testInfo) => {
  test.fail(testInfo.project.name === 'vanilla', vanillaBugs.hidden);
  await expectPanels(page, { admin: false, sensor: false, users: false });

  await signIn(page, 'sensor/north', 'sensorpass');
  await expectPanels(page, { admin: false, sensor: true, users: false });
  await signOut(page);

  await signIn(page, 'root', 'rootpass');
  await expectPanels(page, { admin: true, sensor: true, users: true });
});

test('a guest sees every lot', async ({ page }) => {
  for (const name of ['North Deck', 'South Lot', 'River Garage', 'Overflow Gravel']) {
    await expect(lotCard(page, name)).toBeVisible();
  }
  await expect(page.locator('#auth-panel')).toContainText('Guest');
});

test('the chosen language translates the page and survives a reload', async ({ page }) => {
  const title = page.getByRole('heading', { level: 1 });
  await page.getByLabel('Language').selectOption('es');
  await expect(title).toHaveText('Disponibilidad de Estacionamiento en Vivo');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  await page.reload();
  await expect(title).toHaveText('Disponibilidad de Estacionamiento en Vivo');
});

test('a session survives a reload, and signing out ends it', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await signIn(page, 'root', 'rootpass');
  await page.reload();
  await expect(panel).toContainText('root (root)');

  await signOut(page);
  await expect(panel).toContainText('Guest');
  await page.reload();
  await expect(panel).toContainText('Guest');
});

// Leaves River Garage open, as the seed has it.
test('an admin closes and reopens a lot', async ({ page }) => {
  await signIn(page, 'root', 'rootpass');
  const admin = page.locator('#admin-panel');
  const badge = lotCard(page, 'River Garage').locator('.badge');

  await admin.getByLabel('Lot').selectOption({ label: 'River Garage' });
  await admin.getByRole('button', { name: 'Close Lot' }).click();
  await expect(admin).toContainText('River Garage is now closed.');
  await expect(badge).toHaveText('Closed');

  await admin.getByRole('button', { name: 'Open Lot' }).click();
  await expect(admin).toContainText('River Garage is now open.');
  await expect(badge).toHaveText('Open');
});

test('a sensor reports occupancy for its own lot only', async ({ page, request }) => {
  await signIn(page, 'sensor/north', 'sensorpass');
  const sensor = page.locator('#sensor-panel');
  const lot = sensor.getByLabel('Lot');
  await expect(lot.locator('option')).toHaveText(['North Deck']);
  await expect(lot).toBeDisabled();

  const count = sensor.getByLabel('Occupancy');
  const before = Number(await count.inputValue());
  const after = before === 0 ? 1 : before - 1;
  try {
    await count.fill(String(after));
    await sensor.getByRole('button', { name: 'Send Update' }).click();
    await expect(sensor).toContainText(`North Deck occupancy updated to ${after}.`);
    await expect(lotCard(page, 'North Deck')).toContainText(`Occupied: ${after}`);
  } finally {
    const headers = await authHeaders(request, 'sensor/north', 'sensorpass');
    const lots = await (await request.get('/api/lots')).json();
    const north = lots.find((item) => item.name === 'North Deck');
    await request.post(`/api/lots/${north.id}/occupancy`, {
      headers,
      data: { occupancy: before },
    });
  }
});

test('an admin creates and deletes a sensor user', async ({ page, request }, testInfo) => {
  const username = `sensor/test-${testInfo.project.name}`;
  await deleteUsersNamed(request, username);
  await signIn(page, 'root', 'rootpass');
  const users = page.locator('#users-panel');
  const row = users.locator('.user-row', { hasText: username });

  try {
    await users.getByLabel('Username').fill(username);
    await users.getByLabel('Password').fill('testpass');
    await users.getByLabel('Role').selectOption('sensor');
    await users.getByLabel('Sensor Lot').selectOption({ label: 'South Lot' });
    await users.getByRole('button', { name: 'Create User' }).click();
    await expect(users).toContainText(`Created ${username}.`);
    await expect(row).toContainText('Lot: South Lot');
    await expect(row.locator('.tag')).toHaveText('Sensor');

    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(users).toContainText(`Deleted ${username}.`);
    await expect(row).toHaveCount(0);
  } finally {
    await deleteUsersNamed(request, username);
  }
});

// Vanilla's renderUsers still builds rows with innerHTML, but a name like this can no longer
// be saved, so there is nothing for it to run.
test('a username that is markup is refused, by the form and by the server', async ({
  page,
  request,
}, testInfo) => {
  const username = `<img src=x onerror="window.injected=true">${testInfo.project.name}`;
  await deleteUsersNamed(request, username);

  try {
    const headers = await authHeaders(request, 'root', 'rootpass');
    const response = await request.post('/api/users', {
      headers,
      data: { username, password: 'testpass', role: 'none' },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain(refusals.username);

    await signIn(page, 'root', 'rootpass');
    const panel = page.locator('#users-panel');
    await panel.getByLabel('Username').fill(username);
    await panel.getByLabel('Password').fill('testpass');
    await panel.getByRole('button', { name: 'Create User' }).click();
    await expect(panel).toContainText(refusals.username);
    await expect(panel.locator('img')).toHaveCount(0);
    await expect(panel.locator('.user-row', { hasText: username })).toHaveCount(0);
  } finally {
    await deleteUsersNamed(request, username);
  }
});

// The clients check with the same patterns as the server, so a bad value never leaves the page.
test('a form refuses bad input without sending it', async ({ page }) => {
  const posts = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(new URL(request.url()).pathname);
  });

  const auth = page.locator('#auth-panel');
  await auth.getByLabel('Username').fill('Root');
  await auth.getByLabel('Password').fill('rootpass');
  await auth.getByRole('button', { name: 'Sign In' }).click();
  await expect(auth).toContainText(refusals.username);
  expect(posts).toEqual([]);

  await signIn(page, 'root', 'rootpass');
  posts.length = 0;

  const users = page.locator('#users-panel');
  await users.getByLabel('Username').fill('sensor/east');
  await users.getByLabel('Password').fill('short');
  await users.getByRole('button', { name: 'Create User' }).click();
  await expect(users).toContainText(refusals.password);

  // Number('') is 0, so before the check an empty field quietly emptied the lot.
  const sensor = page.locator('#sensor-panel');
  await sensor.getByLabel('Occupancy').fill('');
  await sensor.getByRole('button', { name: 'Send Update' }).click();
  await expect(sensor).toContainText(refusals.occupancy);

  expect(posts).toEqual([]);
});

// Straight to the API, as a client that skipped its own checks would.
test('the server refuses what the patterns refuse', async ({ request }) => {
  const headers = await authHeaders(request, 'root', 'rootpass');
  const lots = await (await request.get('/api/lots')).json();
  const north = lots.find((item) => item.name === 'North Deck');
  const occupancy = (value) =>
    request.post(`/api/lots/${north.id}/occupancy`, { headers, data: { occupancy: value } });
  const newUser = (data) =>
    request.post('/api/users', { headers, data: { username: 'test-refused', ...data } });

  const refused = {
    'lot id 1.0': () => request.get('/api/lots/1.0'),
    'lot id 01': () => request.get('/api/lots/01'),
    'user id 1e3': () => request.delete('/api/users/1e3', { headers }),
    'username Root': () =>
      request.post('/api/login', { data: { username: 'Root', password: 'rootpass' } }),
    'a short password': () => newUser({ password: 'short', role: 'none' }),
    'role administrator': () => newUser({ password: 'testpass', role: 'administrator' }),
    'a sensor with no lot': () => newUser({ password: 'testpass', role: 'sensor', lot_id: 0 }),
    "occupancy ''": () => occupancy(''),
    'occupancy 7.5': () => occupancy(7.5),
    'occupancy -1': () => occupancy(-1),
    'occupancy 1e1': () => occupancy('1e1'),
    'occupancy [7]': () => occupancy([7]),
  };

  try {
    for (const [label, send] of Object.entries(refused)) {
      expect((await send()).status(), label).toBe(400);
    }
  } finally {
    // In case the server took one: put the count back and remove the user.
    await occupancy(north.occupancy);
    await deleteUsersNamed(request, 'test-refused');
  }
});
