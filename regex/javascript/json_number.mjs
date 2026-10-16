// Recognize a JSON number (RFC 8259, section 6) with a regular expression.
//
// Regex notation used below:
//
//   ^ and $     the start and the end of the string
//   -?          an optional "-" (? = zero or one of the thing before it)
//   [1-9]       one character from the set: a digit 1 through 9
//   [0-9]*      zero or more digits (* = zero or more)
//   [0-9]+      one or more digits (+ = one or more)
//   [eE]        "e" or "E"
//   [+-]?       an optional "+" or "-"
//   \.          a literal "." (a bare "." would match any character)
//   a|b         a or b
//   (?:...)     a group: treats ... as one unit, so ?, * or | can apply to
//               the whole of it. The "?:" makes it non-capturing -- plain
//               (...) would also save the matched text for later retrieval,
//               which this code never asks for.
//
// Read as a whole:
//
//   -?                          optional minus sign
//   (?:0|[1-9][0-9]*)           integer part: "0", or a digit 1-9 then any digits
//   (?:\.[0-9]+)?               optional fraction: "." then at least one digit
//   (?:[eE][+-]?[0-9]+)?        optional exponent: e/E, optional sign, digits

// /.../ is a regex literal: the text between the slashes is the pattern,
// with backslashes passed through as written. Flags would go after the
// closing slash (/.../g) -- there are none here, on purpose:
//
// No "g" flag: a global regex keeps lastIndex between test() calls, so the
// same input would alternate between true and false. Without the "m" flag,
// "^" and "$" anchor to the whole string.
export const JSON_NUMBER = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;

export function isJsonNumber(text) {
  return JSON_NUMBER.test(text);
}
