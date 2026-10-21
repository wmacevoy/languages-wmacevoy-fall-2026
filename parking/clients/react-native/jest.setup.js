// Under Jest there is no phone, so these stand in for its network, storage, and screen insets.

// Expo's fetch needs the phone's networking, and Jest's sandbox has no other, so requests go
// through Node's http module instead. This covers only what shared/api.js and the tests use.
const http = require('http');

global.fetch = (url, { method = 'GET', headers = {}, body } = {}) =>
  new Promise((resolve, reject) => {
    const request = http.request(url, { method, headers }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        text += chunk;
      });
      response.on('end', () =>
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          json: async () => JSON.parse(text),
        })
      );
    });
    request.on('error', reject);
    request.end(body);
  });

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('expo-secure-store', () => {
  const values = new Map();
  return {
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => {
      values.set(key, value);
    },
    deleteItemAsync: async (key) => {
      values.delete(key);
    },
  };
});
