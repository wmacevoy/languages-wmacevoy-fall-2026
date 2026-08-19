# languages-fall-2026

## Resources

- [Programming Languages Field Guide](docs/programming-languages-field-guide.html) — a reference covering models of computation (including LLMs), language paradigms, and language mechanics, illustrated throughout by a full-stack "Parking App" case study. A plain-text version is also available at [`docs/programming-languages-reference.md`](docs/programming-languages-reference.md).

- [Rust cross-compilation demo](rust/) [![rust](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/rust.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/rust.yml) — a small library with tests, built and tested in CI and cross-compiled inside a container for Linux, macOS and Windows.

- [Pixi GPU-adaptive ML demo](ml/) [![ml](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml) — the counterpoint to the container demo: one manifest that resolves to CUDA, Metal or CPU depending on the machine, for a stack a single image cannot express.
