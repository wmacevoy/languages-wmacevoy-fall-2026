# languages-fall-2026

## Resources

- [Programming Languages Field Guide](docs/programming-languages-field-guide.html) — a reference covering models of computation (including LLMs), language paradigms, and language mechanics, illustrated throughout by a full-stack "Parking App" case study. A plain-text version is also available at [`docs/programming-languages-reference.md`](docs/programming-languages-reference.md).

- [Rust cross-compilation demo](rust/) [![rust](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/rust.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/rust.yml) — a small library with tests, built and tested in CI and cross-compiled inside a container for Linux, macOS and Windows.

- [Pixi GPU-adaptive ML demo](ml/) [![ml](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml) — the counterpoint to the container demo: one manifest that resolves to CUDA, Metal or CPU depending on the machine, for a stack a single image cannot express.

- [C++ hello world, built six ways](hello/) [![hello](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/hello.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/hello.yml) — the textbook program, unchanged, with a containerized build for reproducibility *and* a CI matrix that compiles and runs it natively on Linux, macOS and Windows across x86-64 and arm64, under GCC, Clang and MSVC.
