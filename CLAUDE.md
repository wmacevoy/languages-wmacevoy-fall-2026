# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Course resource repository for CSCI 330 — Programming Languages (Fall 2026, Dr. Warren MacEvoy). It holds three kinds of material, with different rules:

1. **The reference document** (`docs/`) — the original deliverable: a course reference published as a static site via GitHub Pages. No build system; the content *is* the artifact. See "Content architecture" below.
2. **Runnable demos** (`rust/`, `ml/`, `hello/`) — small, self-contained projects, each with its own build, test suite and GitHub Actions workflow. Each has a README, and `ml/` has an `AGENTS.md` you should read before editing it.
3. **The `regex/` demo** — one JSON-number regex in Python, JavaScript, Rust and C++ (GoogleTest), all tested against the single shared `regex/cases.txt`. It is about language semantics (`\d`, `$`, the JS `g` flag), not reproducibility, so it is not part of the three-demo set below. Keep the four implementations reading the shared file rather than copying cases into each language, and read `regex/time.md` before changing how any harness reads `cases.txt` or lists its tests.

The three demos are a deliberate set on the same question — how to make an environment reproducible — reaching *different* conclusions. Do not "harmonize" them:

| | `rust/` | `ml/` | `hello/` |
| --- | --- | --- | --- |
| tool | Docker | pixi | Docker **and** a native CI matrix |
| reproduces | one machine, byte-identical everywhere | one *decision procedure*, run per platform | the Linux build hermetically; portability by building natively on each platform |
| right when | the build is hermetic and hardware-independent | dependencies must differ by hardware, or the toolchain is too big / too GUI-bound to containerize | no cross-toolchain reaches every target (C++ has no `cargo-zigbuild`), or you must prove the source survives *different compilers* |
| CI | `.github/workflows/rust.yml` | `.github/workflows/ml.yml` (3-OS matrix) | `.github/workflows/hello.yml` (3-OS × 2-arch matrix + container job) |

The `rust/` vs `hello/` contrast is the point of having both, and is easy to flatten by accident:

- `rust/` **cross-compiles** six targets from one Linux container. One toolchain, one machine — and nothing ever *runs* the macOS or Windows artifacts.
- `hello/` **natively compiles** on six runners, so each binary is executed by the architecture it was built for, under three genuinely different compilers (GCC, Clang, MSVC). Its container job covers only Linux, on purpose.

Do not add cross-compilation to `hello/`, and do not add a native matrix to `rust/`.

## Commands

There is nothing to build or test for `docs/`. For the demos:

```sh
cd rust  && ./build.sh     # test, then cross-compile for 6 targets -> rust/dist
cd rust  && ./run.sh       # run the artifact for this architecture
cd ml    && pixi run test  # 22 tests
cd ml    && pixi run resolved  # what each platform resolved to
cd hello && ./build.sh     # configure, build, test in the container -> hello/dist
cd hello && ./run.sh       # run the artifact for the container's architecture
cd regex && ./test.sh      # all four languages against regex/cases.txt
```

`hello/` also builds without Docker, with the same three commands its CI runs:
`cmake -S . -B build -DCMAKE_BUILD_TYPE=Release`, `cmake --build build --config Release`,
`ctest --test-dir build --build-config Release --output-on-failure`.

All three demos gate their own artifacts on their tests, and all three CI workflows are path-filtered, so a change under `docs/` triggers none of them.

## Content architecture

The reference material exists in **two independently-maintained files with no build step linking them**:

- `docs/programming-languages-reference.md` — the plain-text reference, reorganized by topic from the original lecture-note PDFs.
- `docs/programming-languages-field-guide.html` — a fully self-contained, hand-authored HTML page presenting the *same content*, styled with a sticky table-of-contents sidebar, light/dark theming via CSS custom properties, and two hand-drawn inline SVG diagrams. No external CSS/JS/fonts — everything is inlined so the file works opened directly from disk.

**Neither file generates the other.** Any content change (adding a section, renumbering, fixing a fact) must be applied by hand to both files. Sections use a `1.1`, `4.6`, `9.3`-style chapter.section numbering scheme that both files reference throughout via "§X.Y" cross-references in the prose — renumbering or inserting a section means finding and updating every cross-reference in *both* files, not just the heading itself.

`docs/index.html` is a separate, lighter-weight landing page (not sharing markup with the field guide, but reusing the same CSS custom-property tokens for visual consistency) that links to the two files above. It deliberately does not link to the source PDFs.

## GitHub Pages deployment

- Pages is enabled on this repo (`wmacevoy/languages-wmacevoy-fall-2026`), source = `main` branch, `/docs` folder, legacy build type.
- `docs/.nojekyll` disables Jekyll processing, so everything under `docs/` is served byte-for-byte as committed (this matters because Jekyll would otherwise try to process/convert the `.md` file).
- Live site: https://wmacevoy.github.io/languages-wmacevoy-fall-2026/
- The two source PDFs (`docs/CSCI 330 Programming Languages Brandon Kamplain Notes 1.pdf` / `...2.pdf`, the original lecture notes) are present in the working tree but intentionally **not git-tracked** and intentionally not linked from `index.html`.

## Previewing changes

Both HTML files are self-contained static documents — open them directly in a browser (`file://...`) to preview; no local server is needed.
