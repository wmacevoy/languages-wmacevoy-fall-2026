//! Greets whoever is named on the command line, then reports the platform this
//! binary was *compiled* for.
//!
//! The point of the exercise: one source tree, one container, six artifacts --
//! the platform block below differs per artifact even though nothing in the
//! crate branches on the host it happens to be running on.

use std::env::consts::{ARCH, DLL_EXTENSION, EXE_SUFFIX, FAMILY, OS};

use hello::greet;

/// The triple is not exposed by `std`, so bake it in from cargo's environment.
const TARGET: &str = env!("TARGET_TRIPLE");

fn describe() -> String {
    format!(
        "{name} {version}\n  target : {TARGET}\n  os     : {OS} ({FAMILY})\n  arch   : {ARCH}\n  exe    : {exe}\n  dylib  : .{DLL_EXTENSION}",
        name = env!("CARGO_PKG_NAME"),
        version = env!("CARGO_PKG_VERSION"),
        exe = if EXE_SUFFIX.is_empty() {
            "(none)"
        } else {
            EXE_SUFFIX
        },
    )
}

/// Collapses the argument list into a single name for [`greet`].
fn greeting(args: &[String]) -> String {
    if args.is_empty() {
        greet("world")
    } else {
        greet(&args.join(" and "))
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    println!("{}", greeting(&args));
    println!("{}", describe());
}

#[cfg(test)]
mod tests {
    use super::{describe, greeting, TARGET};

    #[test]
    fn no_args_greets_the_world() {
        assert_eq!(greeting(&[]), "Hello, world!");
    }

    #[test]
    fn names_are_joined() {
        let args = vec!["Ada".to_string(), "Grace".to_string()];
        assert_eq!(greeting(&args), "Hello, Ada and Grace!");
    }

    #[test]
    fn description_names_the_target() {
        assert!(describe().contains(TARGET));
    }
}
