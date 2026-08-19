# rust — a greeting library, cross-compiled in a container

[![rust](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/rust.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/rust.yml)

A small crate wired to a workflow you can trust: a library with tests, a CLI
that consumes it, and a Docker environment that builds both for Linux, macOS
and Windows. The source is **bind-mounted**, not copied into the image — edit on
the host, rerun `./build.sh`, no image rebuild.

## The library

```rust
use hello::greet;

assert_eq!(greet("world"), "Hello, world!");
```

`greet` is the crate's entire public API (`src/lib.rs`). It is exercised from
four directions, all run by `cargo test`:

| where | what it proves |
| --- | --- |
| `src/lib.rs` unit tests | the string is built correctly, including empty, whitespace and non-ASCII names |
| `tests/greet.rs` | `greet` is genuinely *exported* — these link against the crate the way a downstream user would |
| doc example on `greet` | the documentation compiles and is still true |
| `src/main.rs` unit tests | the CLI composes `greet` correctly |

## Usage

```sh
./build.sh                 # test, then build every target -> ./dist
./build.sh macos windows   # only targets whose label contains these substrings
./build.sh --no-test       # skip the test gate (debugging a link error)
./build.sh --list          # show the target table
./run.sh                   # run the artifact for the container's architecture
./run.sh -- Ada Grace      # anything after -- is passed to the program
./run.sh --list            # list ./dist
```

Neither script needs a local Rust toolchain — only Docker.

## Continuous integration

`.github/workflows/rust.yml` runs on every push or pull request that touches
`rust/`. The badge above reports its result on `main`. Two jobs:

1. **test** — `cargo fmt --check`, `clippy -D warnings`, build, then the test
   suite, ordered cheapest-first so an obvious mistake fails in seconds.
2. **cross-compile** — runs `./build.sh` and uploads `dist/` as a downloadable
   artifact. It `needs: test`, so six targets are never built from code that
   fails its own tests.

What makes the result trustworthy rather than merely green:

- **CI runs the same command you do.** The cross-compile job's only build step
  is `./build.sh`, the script on your own machine. There is no parallel CI
  recipe to drift out of sync, and no "works locally, fails in CI" gap.
- **The gate is in the script, not just the workflow.** `build.sh` runs the
  tests itself and stops on failure, so a local build can't quietly produce
  artifacts that CI would have rejected. (Verified: with a broken `greet`,
  `build.sh` exits 101 and `dist/` is left untouched.)
- **`--locked` everywhere.** `Cargo.lock` is committed, so CI resolves exactly
  the dependency versions you tested against and fails loudly if it can't.
- **Least privilege and bounded runs.** The workflow is `contents: read`, every
  job has a `timeout-minutes`, and superseded runs are cancelled.

Two honest caveats. The toolchain floats on `stable` in both CI and the image,
so a new Rust release can introduce a `clippy` lint that turns the badge red
without anything in this directory changing — the fix is a pin in both places,
traded against having to bump it by hand. And because the workflow is
path-filtered, it does not run at all for commits outside `rust/`; if you ever
make it a required status check, use a merge queue or a skip-job, as a filtered
workflow that never starts reads as "pending" forever.

## Targets

| label | triple | linked by |
| --- | --- | --- |
| `linux-x86_64` | `x86_64-unknown-linux-musl` | zig (static) |
| `linux-arm64` | `aarch64-unknown-linux-musl` | zig (static) |
| `macos-x86_64` | `x86_64-apple-darwin` | zig |
| `macos-arm64` | `aarch64-apple-darwin` | zig |
| `macos-universal2` | `universal2-apple-darwin` | zig (fat binary) |
| `windows-x86_64` | `x86_64-pc-windows-gnu` | mingw-w64 |

## How the cross-compilation works

`rustc` can emit code for any target it knows about; the hard part is *linking*,
which needs that platform's libc and system stubs. Two linkers cover the table:

- **zig** ships libc stubs for glibc, musl and macOS, so `cargo-zigbuild` can
  link Mach-O and static-musl ELF binaries from inside a Linux container with no
  Xcode SDK. Rust prints an `xcrun ... failed` warning on the Darwin targets —
  it is looking for an SDK it does not need here, and the link succeeds anyway.
- **mingw-w64** provides the Windows import libraries for the `-gnu` ABI.

The `-msvc` Windows targets are deliberately absent: they need Microsoft's
linker and CRT, which cannot be redistributed in an image like this.

## Notes

- The container runs as your host uid/gid, so files written to the mount
  (`target/`, `dist/`) belong to you rather than root.
- `CARGO_HOME` and `HOME` point at `.docker-cache/` inside the mount, so the
  crates.io cache survives between runs. All three of `target/`, `dist/` and
  `.docker-cache/` are gitignored.
- `run.sh` executes only the Linux artifacts — the macOS and Windows ones are
  cross-compiled and have no interpreter in this container. Run those on their
  own platforms (`dist/hello-*-macos-arm64` runs directly on Apple Silicon).
- `dist/SHA256SUMS` is regenerated on every build.
