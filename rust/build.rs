//! Forwards cargo's `TARGET` into the crate, so a binary can report the triple
//! it was cross-compiled for. `std` has `ARCH`/`OS` but not the full triple.
fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!(
        "cargo:rustc-env=TARGET_TRIPLE={}",
        std::env::var("TARGET").unwrap()
    );
}
