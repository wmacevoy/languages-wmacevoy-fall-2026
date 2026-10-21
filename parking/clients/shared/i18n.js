import translations from './translations.js';

// Each language is listed under its own name, so these labels are never translated.
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
];

// The "First Languages Over 100M" panel.
export const firstLanguages = [
  '中文（普通话）',
  'Español',
  'English',
  'हिन्दी',
  'বাংলা',
  'Português',
  'Русский',
  '日本語',
];

const dateLocales = {
  en: 'en-US',
  zh: 'zh-CN',
  es: 'es-ES',
  hi: 'hi-IN',
  bn: 'bn-BD',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ja: 'ja-JP',
};

export function isLanguage(code) {
  return Object.hasOwn(translations, code ?? '');
}

// A missing key falls back to English, then to the key itself, so a gap shows up on screen
// instead of as a blank.
export function translate(language, key, params = {}) {
  const pack = translations[language] || translations.en;
  const template = pack[key] ?? translations.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, token) =>
    Object.hasOwn(params, token) ? String(params[token]) : match
  );
}

export function formatDateTime(language, value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString(dateLocales[language]);
}
