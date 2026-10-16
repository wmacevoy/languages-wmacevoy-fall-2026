//! Recognize a JSON number (RFC 8259, section 6) with a regular expression.
//!
//! Regex notation used below:
//!
//! ```text
//! ^ and $     the start and the end of the string
//! -?          an optional "-" (? = zero or one of the thing before it)
//! [1-9]       one character from the set: a digit 1 through 9
//! [0-9]*      zero or more digits (* = zero or more)
//! [0-9]+      one or more digits (+ = one or more)
//! [eE]        "e" or "E"
//! [+-]?       an optional "+" or "-"
//! \.          a literal "." (a bare "." would match any character)
//! a|b         a or b
//! (?:...)     a group: treats ... as one unit, so ?, * or | can apply to
//!             the whole of it. The "?:" makes it non-capturing -- plain
//!             (...) would also save the matched text for later retrieval,
//!             which this code never asks for.
//! ```
//!
//! Read as a whole:
//!
//! ```text
//! -?                          optional minus sign
//! (?:0|[1-9][0-9]*)           integer part: "0", or a digit 1-9 then any digits
//! (?:\.[0-9]+)?               optional fraction: "." then at least one digit
//! (?:[eE][+-]?[0-9]+)?        optional exponent: e/E, optional sign, digits
//! ```

use regex::Regex;
use std::sync::LazyLock;

// Compiling a regex is expensive, so do it once, not on every call. But a
// `static` must normally be built at compile time, and Regex::new runs at run
// time. LazyLock bridges the two: it holds the closure `|| ...` and runs it
// the first time JSON_NUMBER is used, then keeps the result for every later
// use. It is thread-safe -- if two threads arrive first at once, one builds
// the Regex and the other waits for it.
//
// r"..." is a raw string: Rust leaves backslashes alone, so the regex engine
// receives \. as written. In a normal "..." string you would write \\.
//
// [0-9], not \d: the regex crate is Unicode-aware by default, so \d would also
// match Arabic-Indic, fullwidth and every other Unicode decimal digit.
// Without the (?m) flag, "^" and "$" anchor to the whole string.
//
// unwrap() is safe here: Regex::new only fails on a malformed pattern, and
// this one is fixed -- the tests would panic on the first call if it broke.
static JSON_NUMBER: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$").unwrap()
});

pub fn is_json_number(text: &str) -> bool {
    JSON_NUMBER.is_match(text)
}
