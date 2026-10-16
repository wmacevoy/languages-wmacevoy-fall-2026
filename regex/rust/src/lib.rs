//! Recognize a JSON number (RFC 8259, section 6) with a regular expression.

use regex::Regex;
use std::sync::LazyLock;

// [0-9], not \d: the regex crate is Unicode-aware by default, so \d would also
// match Arabic-Indic, fullwidth and every other Unicode decimal digit.
// Without the (?m) flag, "^" and "$" anchor to the whole string.
static JSON_NUMBER: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$").unwrap()
});

pub fn is_json_number(text: &str) -> bool {
    JSON_NUMBER.is_match(text)
}
