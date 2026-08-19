//! Integration tests.
//!
//! These link against `hello` the way any downstream crate would, so they fail
//! if `greet` stops being *exported* even when the unit tests inside the module
//! still pass.

use hello::greet;

#[test]
fn greet_is_public() {
    assert_eq!(greet("world"), "Hello, world!");
}

#[test]
fn greet_matches_the_documented_shape() {
    for who in ["Ada", "Grace", "CSCI 330", ""] {
        assert_eq!(greet(who), format!("Hello, {who}!"));
    }
}

#[test]
fn greet_returns_an_owned_string() {
    // The borrow ends with this statement; the greeting outlives it.
    let greeting = greet(&String::from("Ada"));
    assert_eq!(greeting, "Hello, Ada!");
}
