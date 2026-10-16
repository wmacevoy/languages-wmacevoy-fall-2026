// Recognize a JSON number (RFC 8259, section 6) with a regular expression.

// No "g" flag: a global regex keeps lastIndex between test() calls, so the
// same input would alternate between true and false. Without the "m" flag,
// "^" and "$" anchor to the whole string.
export const JSON_NUMBER = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;

export function isJsonNumber(text) {
  return JSON_NUMBER.test(text);
}
