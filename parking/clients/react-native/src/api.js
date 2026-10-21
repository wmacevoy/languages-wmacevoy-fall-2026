import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createApi } from '../../shared/api.js';

const TOKEN_KEY = 'parking_token';

// A phone is not on the server's origin, so it needs the server's address.
// EXPO_PUBLIC_API_URL sets it. Otherwise, during development the phone is already
// reaching this computer for the JavaScript bundle, so the API is assumed to be here too.
function serverUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:3000`;
}

// The keychain is only reachable asynchronously, so requests read this copy instead.
let token = null;

export const api = createApi(serverUrl(), () => token);

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}

export async function saveToken(value) {
  token = value;
  await SecureStore.setItemAsync(TOKEN_KEY, value);
}

export async function clearToken() {
  token = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
