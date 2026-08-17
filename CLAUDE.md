# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Course resource repository for CSCI 330 — Programming Languages (Fall 2026, Dr. Warren MacEvoy). There is no application code, build system, package manager, linter, or test suite — the repository's content *is* the deliverable: a course reference document published as a static site via GitHub Pages. There are no commands to build, lint, or test.

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
