// Every call the clients make to the Express server, in one place.
//
// The two things that differ by platform are passed in: where the server is (a browser page
// shares its origin, a phone does not) and where the token is kept (localStorage on the web,
// the keychain on a phone).
export function createApi(baseUrl, getToken) {
  async function request(path, { method = 'GET', body } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // The message is the server's, or empty so the caller can pick a translated fallback.
      const error = new Error(data?.error ?? '');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  return {
    listLots: () => request('/api/lots'),
    me: () => request('/api/me'),
    login: (username, password) =>
      request('/api/login', { method: 'POST', body: { username, password } }),
    setLotOpen: (lotId, open) =>
      request(`/api/lots/${lotId}/${open ? 'open' : 'close'}`, { method: 'POST' }),
    updateOccupancy: (lotId, occupancy) =>
      request(`/api/lots/${lotId}/occupancy`, { method: 'POST', body: { occupancy } }),
    listUsers: () => request('/api/users'),
    createUser: (user) => request('/api/users', { method: 'POST', body: user }),
    deleteUser: (userId) => request(`/api/users/${userId}`, { method: 'DELETE' }),
  };
}
