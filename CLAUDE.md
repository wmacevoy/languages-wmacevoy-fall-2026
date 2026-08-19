# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Course resource repository for CSCI 330 — Programming Languages (Fall 2026, Dr. Warren MacEvoy). It holds two kinds of material, with different rules:

1. **The reference document** (`docs/`) — the original deliverable: a course reference published as a static site via GitHub Pages. No build system; the content *is* the artifact. See "Content architecture" below.
2. **Runnable demos** (`rust/`, `ml/`) — small, self-contained projects, each with its own build, test suite and GitHub Actions workflow. Each has a README, and `ml/` has an `AGENTS.md` you should read before editing it.

The two demos are a deliberate matched pair on the same question — how to make an environment reproducible — reaching opposite conclusions. Do not "harmonize" them:

| | `rust/` | `ml/` |
| --- | --- | --- |
| tool | Docker | pixi |
| reproduces | one machine, byte-identical everywhere | one *decision procedure*, run per platform |
| right when | the build is hermetic and hardware-independent | dependencies must differ by hardware, or the toolchain is too big / too GUI-bound to containerize |
| CI | `.github/workflows/rust.yml` | `.github/workflows/ml.yml` (3-OS matrix) |

## Commands

There is nothing to build or test for `docs/`. For the demos:

```sh
cd rust && ./build.sh      # test, then cross-compile for 6 targets -> rust/dist
cd rust && ./run.sh        # run the artifact for this architecture
cd ml   && pixi run test   # 22 tests
cd ml   && pixi run resolved   # what each platform resolved to
```

Both demos gate their own artifacts on their tests, and both CI workflows are path-filtered, so a change under `docs/` triggers neither.

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
