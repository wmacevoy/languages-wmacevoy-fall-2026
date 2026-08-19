# AGENTS.md — ml/

Working notes for coding agents. Read this before editing anything in `ml/`.
Human-facing explanation lives in [README.md](README.md).

## What this directory is

A demonstration of **cross-platform pixi environments**: one manifest describing
*constraints*, resolved separately per platform, instead of one frozen
resolution shipped to everyone. PyTorch is the example, not the subject — the
same pattern applies to any toolchain that is hardware-bound, too large, or too
GUI-bound to containerize.

Its sibling `../rust` argues the opposite case with containers. Neither is
"the right answer"; the pair is the teaching point. Do not make them consistent
with each other — they are deliberately different.

## Commands

Always use pixi; never `pip install` into the environment.

```sh
pixi run test       # 22 tests -- the gate for any change
pixi run device     # what this machine resolved to
pixi run resolved   # what every platform resolved to, plus what is installed here
pixi run train      # train the demo model
pixi run bench      # accelerator vs CPU matmul
pixi lock           # re-solve after editing pixi.toml
```

`pixi run -q` suppresses pixi's manifest warning (see "deliberate oddities").

## Invariants

Breaking any of these breaks the demo rather than improving it.

1. **`pixi.lock` is committed and must stay in sync with `pixi.toml`.** After
   any manifest edit, run `pixi lock` and commit both. CI uses `locked: true`
   and fails on drift.
2. **Never commit `.pixi/`.** It is gitignored, multi-GB, and regenerable.
3. **Never weaken the tests in `tests/test_resolved.py`.** They assert the
   directory's actual thesis — that the lock resolves differently per platform,
   that the `cuda` environment selects `cuda*` builds and `default` does not.
   If they fail, the demo is broken; fix the cause, not the assertion.
4. **`default` must stay installable on a machine with no GPU.** It is what a
   student gets with no flags and what CI installs. Never move a
   `system-requirements` entry onto the workspace or the `cpu` feature.
5. **Keep the CI pixi version pinned to whatever produced the lock.** If you
   upgrade pixi, re-lock and bump `pixi-version` in
   `../.github/workflows/ml.yml` in the same commit.

## Deliberate oddities — do not "fix" these

- **`[feature.cuda.system-requirements]` is deprecated and stays anyway.** pixi
  suggests `platforms = [{ platform = "linux-64", cuda = "12" }]`, which does not
  parse: `pixi info` accepts it but `pixi lock` fails with `expected a string,
  found table` (verified on 0.76.2 and 0.77.0). It also cannot simply be
  removed — the solve then fails with `pytorch 2.13.0 would require __cuda *,
  for which no candidates were found`. Re-check when upgrading pixi.
- **`cache: false` in CI is intentional.** Caching would skip the install on any
  push that does not change the lock, and installing from the lock is one of the
  things under test. A cold install is 7-45s per OS; do not "optimize" it.
- **The macOS `cpu_generic` build is the GPU build.** Metal is compiled into
  every `osx-arm64` build, so there is no `metal*` build variant to select. Code
  that assumes "cpu in the build string means no GPU" is wrong; see
  `_accelerator()` in `mldemo/resolved.py`.
- **Python versions differ across platforms** (3.12 on Linux, 3.13 elsewhere)
  from one `>=3.12,<3.14` constraint. That is the pattern working, not a bug to
  pin away.
- **TensorFlow is not used, deliberately.** On conda-forge it is CPU-only on
  `osx-arm64` and stuck at 1.14 (2020) on `win-64`, so it cannot demonstrate the
  point. Do not switch back.

## Making common changes

| change | how | then |
| --- | --- | --- |
| add a platform | append to `[workspace] platforms` | also add it to `feature.cuda` if it should get CUDA |
| add a dependency | `pixi add <pkg>` (or `--feature <name>`) | — |
| add an accelerator | new feature: narrow `platforms`, set `system-requirements`, pin `build = "..."`, add an environment | — |
| add a task | `[tasks]` entry with a `description` | add it to CI if it should gate |

After **any** change:

```sh
pixi lock && pixi run test && pixi run resolved
```

`pixi run resolved` is the fastest way to see whether you changed what the
platforms resolve to. If that table changes unintentionally, stop.

## Code conventions

- Modules are small and single-purpose; each has a docstring saying *why* it
  exists, not what it does.
- Comments explain judgement calls (why a threshold, why a seed is pinned to the
  CPU), never mechanics.
- Tests state what they prove in the name and docstring. `HOLDOUT_TOLERANCE` in
  `tests/test_train.py` is 0.02 with a documented margin — an untrained model
  scores ~0.5, a perfect one ~0.0025. Do not loosen it to make something pass;
  a failure there means a backend is computing wrong answers.
- Anything numeric that runs on multiple backends needs tolerance, not equality.
  The one exception is `test_training_is_reproducible_on_cpu`, which pins the
  device precisely so it *can* assert equality.

## Verifying a change the way CI does

```sh
pixi lock          # must report "already up-to-date" if you did not touch pixi.toml
pixi run -q device
pixi run -q resolved
pixi run -q bench
pixi run -q test
```

CI additionally runs this on ubuntu, windows and macOS. A change that passes
locally on macOS has been checked on exactly one of three platforms — the lock
table is the only local evidence about the other two.
