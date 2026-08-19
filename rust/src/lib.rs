//! The greeting library.
//!
//! Deliberately tiny: it exists so the CLI, the integration tests and CI all
//! consume the *same* public API rather than each reimplementing the string.

/// Builds a greeting for `who`.
///
/// The result is always `"Hello, "` followed by `who` and `"!"`, with no
/// trimming, casing or empty-input special cases — see the tests, which pin
/// that behaviour down.
///
/// # Examples
///
/// ```
/// assert_eq!(hello::greet("world"), "Hello, world!");
/// assert_eq!(hello::greet("Ada"), "Hello, Ada!");
/// ```
pub fn greet(who: &str) -> String {
    format!("Hello, {who}!")
}

#[cfg(test)]
mod tests {
    use super::greet;

    #[test]
    fn greets_a_name() {
        assert_eq!(greet("world"), "Hello, world!");
    }

    #[test]
    fn greets_another_name() {
        assert_eq!(greet("Ada"), "Hello, Ada!");
    }

    /// `who` is interpolated verbatim, so an empty name yields an empty slot
    /// rather than a substituted default. Documented here so a future change
    /// to that decision has to be deliberate.
    #[test]
    fn empty_name_is_not_special_cased() {
        assert_eq!(greet(""), "Hello, !");
    }

    #[test]
    fn preserves_whitespace_and_punctuation() {
        assert_eq!(greet("  Grace  "), "Hello,   Grace  !");
        assert_eq!(greet("Ada, Grace"), "Hello, Ada, Grace!");
    }

    /// `&str` is UTF-8, so non-ASCII names pass through unchanged.
    #[test]
    fn handles_non_ascii() {
        assert_eq!(greet("Ada 🦀"), "Hello, Ada 🦀!");
        assert_eq!(greet("Ærø"), "Hello, Ærø!");
    }
}
