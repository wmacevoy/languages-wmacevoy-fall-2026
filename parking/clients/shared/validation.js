// What counts as valid input, written once and used in three places: every client checks a
// form before sending it, the server checks every request before touching the database, and
// validation.test.js checks the rules themselves.
//
// The file imports nothing, so the server can load it, the vanilla page can fetch it as it
// is, and the bundlers can include it, all from this one copy.

// A rule is a list of patterns, and a value obeys the rule when it matches every one of
// them: the rule is their intersection. Each pattern can then say one thing, and adding a
// requirement means adding a line. An empty list asks nothing, so it accepts any text.
//
// No pattern has the g flag: a g regex remembers where its last match ended (lastIndex), so
// calling test() twice on the same valid input answers true, then false.
export const rules = Object.freeze({
  username: [
    /^.{1,32}$/, // 1 to 32 characters
    /^[a-z0-9._/-]*$/, // lowercase letters, digits, '.', '_', '-' and '/'
    // at most one '/', and each side of it starts with a letter or digit
    /^[a-z0-9][^/]*(?:\/[a-z0-9][^/]*)?$/,
  ],
  password: [
    // printable ASCII, space included; bcrypt reads only 72 bytes, and here a character is a byte
    /^[\x20-\x7e]*$/,
    /^.{8,72}$/, // 8 to 72 characters
    /^[^ ]/, // not starting with a space
    /[^ ]$/, // not ending with a space
  ],
  // At least one character that is not white space.
  filled: [/\S/],
  // The group matters: without it, ^none|admin|sensor$ means "starts with none, or contains
  // admin, or ends with sensor", and "administrator" would pass.
  role: [/^(?:none|admin|sensor)$/],
  // A database id. Nine digits stays under Postgres's INTEGER limit of 2147483647.
  id: [
    /^[0-9]{1,9}$/, // only digits, so no sign, decimal point or exponent, and at most nine
    /^[1-9]/, // no leading zero, and not zero
  ],
  // A count of cars.
  count: [
    /^[0-9]{1,9}$/, // only digits, at most nine
    /^(?:0$|[1-9])/, // no leading zero, unless the count is 0
  ],
});

// The patterns describe text. A string is checked as it is, and a JSON number as JavaScript
// prints it, so 7 is checked as "7" and 7.5 as "7.5". Anything else is not text and never
// matches: String(['7']) is "7", but an array is not an occupancy.
export function asText(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function matches(rule, value) {
  const text = asText(value);
  return text !== null && rule.every((pattern) => pattern.test(text));
}

// One predicate per kind of value: true when the value obeys its rule.
const isValid = (rule) => (value) => matches(rule, value);

export const isValidUsername = isValid(rules.username);
export const isValidPassword = isValid(rules.password);
export const isValidLoginPassword = isValid(rules.filled);
export const isValidRole = isValid(rules.role);
export const isValidId = isValid(rules.id);
export const isValidOccupancy = isValid(rules.count);

// A form's error is the translation key of the message for its first invalid field, or null
// when every field is valid. Clients show the message in the user's language; the server
// sends it in English.

// Signing in checks only that the username could exist. The password rules are for new
// passwords, and an older one may not follow them.
export function loginError(input) {
  const { username, password } = input ?? {};
  if (!isValidUsername(username)) return 'errUsername';
  if (!isValidLoginPassword(password)) return 'errPasswordRequired';
  return null;
}

// A missing role means "none", as it does on the server.
export function newUserError(input) {
  const { username, password, lot_id: lotId } = input ?? {};
  const role = input?.role ?? 'none';
  if (!isValidUsername(username)) return 'errUsername';
  if (!isValidPassword(password)) return 'errPassword';
  if (!isValidRole(role)) return 'errRole';
  if (role === 'sensor' && !isValidId(lotId)) return 'errSensorLot';
  return null;
}

export const isValidLogin = (input) => loginError(input) === null;
export const isValidNewUser = (input) => newUserError(input) === null;
