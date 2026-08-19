# ml — cross-platform environments with pixi

[![ml](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml)

**The pattern this directory demonstrates:** describe an environment as
*constraints* and let every platform resolve them separately, instead of
freezing one resolution and shipping it to everyone. PyTorch is the worked
example because the drift is dramatic there, but the pattern is not about
machine learning. See [Adopting this](#adopting-this-for-another-problem).

This is the counterpart to [`../rust`](../rust), which argues the opposite case
and is right to. There, a container is exactly the correct tool: the build is
hermetic and hardware-independent, and making it byte-identical everywhere is
the entire goal. Here that same instinct produces the wrong answer.

## When a container is the wrong tool

Reach for this pattern when any of these is true:

| condition | why a container fails | example |
| --- | --- | --- |
| dependencies differ by **hardware** | an image pins one answer; GPU passthrough is Linux+NVIDIA only | CUDA vs Metal vs CPU |
| the toolchain is **too big** | multi-GB images that are painful to rebuild and ship | Android SDK, Flutter |
| it has a **real UI** | X11 forwarding and VNC are a poor substitute for a native window | RStudio, IDEs, notebooks with plots |
| it needs **host resources** | devices, licences and credentials do not cross the boundary | serial ports, GPUs, cameras, licensed SDKs |

Stay with a container when the build is hermetic, hardware-independent, and the
deployment target is Linux anyway — which is precisely `../rust`.

Both tools solve reproducibility. The difference is *what* they reproduce: a
container reproduces one machine, a lock file reproduces one **decision
procedure** run separately per machine.

## The worked example

```sh
pixi run device     # what THIS machine resolved to
pixi run resolved   # what EVERY platform resolved to, read from pixi.lock
pixi run train      # fit a small model on the best available device
pixi run bench      # time a matmul on the accelerator against the CPU
pixi run test       # the test suite (22 tests)
```

Nothing to install beyond pixi itself — `pixi run` builds the environment from
`pixi.lock` on first use.

`pixi run resolved` reads the committed lock and prints what each platform got.
One manifest, five resolutions:

```
environment  platform   version  accelerator  build
---------------------------------------------------
cuda         linux-64   2.13.0   CUDA 12.9    cuda129_mkl_py312_h0509a7e_302
cuda         win-64     2.13.0   CUDA 12.8    cuda128_mkl_py313_h2820626_302
default      linux-64   2.13.0   CPU          cpu_mkl_py312_h999dc20_102
default      osx-arm64  2.13.0   Metal (MPS)  cpu_generic_py313_hc574c4b_2
default      win-64     2.13.0   CPU          cpu_mkl_py313_h71f30b3_102
```

Worth a minute of lecture time: on Linux and Windows, using the GPU means
installing a **different package build**. On macOS it does not — Metal is
compiled into every `osx-arm64` build, so the same `cpu_generic` artifact *is*
the GPU build. A package name alone does not tell you what hardware you are
about to use.

On an M-series Mac the payoff is measurable, and CI reproduces it on the macOS
runner (112.61 ms → 11.19 ms, 10.1x):

```
$ pixi run bench
2048x2048 matmul, mean of 10 runs
  cpu :    39.40 ms
  mps :     5.90 ms  (Apple arm64 GPU via Metal)

speedup: 6.7x
```

None of that survives a container here: Docker Desktop runs a Linux VM with no
Metal passthrough, so a containerized run gets the `linux` row — CPU — no matter
what silicon is underneath.

## How the manifest works

```toml
platforms = ["osx-arm64", "linux-64", "win-64"]   # one manifest, three answers

[feature.cpu.dependencies]
pytorch = { version = ">=2.13,<3", build = "cpu*" }

[feature.cuda]
platforms = ["linux-64", "win-64"]                 # CUDA exists only here
[feature.cuda.system-requirements]
cuda = "12"                                        # enters the solve as __cuda=12
[feature.cuda.dependencies]
pytorch = { version = ">=2.13,<3", build = "cuda*" }

[environments]
default = ["cpu", "dev"]
cuda = ["cuda", "dev"]
```

Three ideas do all the work:

- **`platforms`** on the workspace lists every target to solve for. The lock
  stores one resolution per entry.
- **A `feature`** is a named bundle of dependencies, platforms and requirements.
  Features compose; nothing is duplicated between them.
- **`system-requirements`** describes hardware the *target* machine will have,
  not the one solving. It is what lets a Mac solve for "linux-64 with a CUDA 12
  GPU present" without owning one — pixi records it in the lock as a synthetic
  platform (`p1`, `p2`) whose `subdir` is the real target and whose virtual
  packages include `__cuda=12`.

An **environment** is a chosen set of features. Users pick one with
`pixi run -e cuda ...`; the default needs no flag.

## Adopting this for another problem

The recipe, independent of ML:

1. **`pixi init`**, then set `platforms` to every OS/arch your users actually
   have. This is the decision that everything else hangs off.
2. **Put the portable dependencies in `[dependencies]`.** Anything every
   platform shares belongs here, unqualified.
3. **Find the axis that varies.** Usually hardware (GPU, CPU ISA), sometimes a
   licence, sometimes a platform-only package. That axis becomes your features.
4. **One feature per branch of that axis**, each narrowing `platforms` to where
   it applies and pinning a build with `build = "..."` if the distinction is a
   build variant rather than a different package.
5. **Add `system-requirements`** only for hardware the solver cannot see from
   your machine. Without it the solve fails outright rather than silently
   choosing wrong — which is the good failure mode.
6. **Declare the environments** users will select between. Keep the safest one
   as `default`, so someone who reads no documentation still gets a working
   install.
7. **Add `[tasks]`** so the interface is `pixi run <verb>`, not a README full of
   shell incantations. Tasks are the API of the directory.
8. **Commit `pixi.lock`**, gitignore `.pixi/`, and keep `.gitattributes`
   marking the lock generated so it never three-way-merges.
9. **Assert the thing you are claiming.** If the point is that platforms differ,
   write a test that reads the lock and fails when they stop differing — see
   `tests/test_resolved.py`.

A second sketch, for the RStudio case (a GUI that containerizes badly), showing
the same shape with no GPU involved:

```toml
[workspace]
platforms = ["osx-arm64", "linux-64", "win-64"]

[dependencies]
r-base = ">=4.4"

# The desktop IDE exists on some platforms only; the analysis code does not
# depend on it, so it goes in its own feature rather than the base dependencies.
[feature.ide]
platforms = ["linux-64"]
[feature.ide.dependencies]
rstudio-desktop = "*"

[environments]
default = []           # headless: runs anywhere, including CI
ide = ["ide"]          # `pixi run -e ide rstudio`
```

The judgement call is step 3. If nothing genuinely varies across your users'
machines, you do not need this pattern — use a container and get stronger
guarantees.

## Extending this one

**Add a platform.** Append it to `[workspace] platforms` and re-lock:

```sh
# add "linux-aarch64" to platforms, then
pixi lock
pixi run resolved     # confirm the new row appears
```

Verified: adding `linux-aarch64` resolves to
`pytorch-2.13.0-cpu_generic_py313_h77e59b0_2` — note `cpu_generic`, not
`cpu_mkl`, because Intel's MKL is x86-only. Even the *CPU* build differs by
architecture. A new platform does **not** join `feature.cuda` automatically;
add it to that feature's `platforms` list too if it should.

**Add a dependency.** `pixi add <package>` edits the manifest and re-locks in one
step. Use `pixi add --feature cuda <package>` to scope it to a feature.

**Add a task.** A `[tasks]` entry with a `description`; `pixi task list` shows
them. Tasks can declare `depends-on`, so `test` could build fixtures first.

**Add an accelerator.** AMD ROCm is the natural third branch and follows the
CUDA feature exactly — narrow `platforms` to `["linux-64"]`, require
`system-requirements` appropriately, pin `build = "rocm*"`, and add a `rocm`
environment. The existing tests generalise: `test_installed_build_matches_the_lock`
needs no change, and `test_generalizes_on_the_selected_device` will exercise the
new backend wherever it runs.

**After any change**, always:

```sh
pixi lock && pixi run test && pixi run resolved
```

CI runs with `locked: true`, so a manifest edit without a re-lock fails the
build rather than silently re-solving.

## Gotchas

**TensorFlow cannot express this.** It was the original choice here and had to
be replaced. On conda-forge today:

| platform | TensorFlow | PyTorch |
| --- | --- | --- |
| `osx-arm64` | 2.19.1, **CPU only** | 2.13.0, Metal |
| `linux-64` | 2.19.1 `cuda128` | 2.13.0 `cuda129` |
| `win-64` | **1.14.0, from 2020** | 2.13.0 `cuda130` |

A Windows student has no usable TensorFlow at all, and a Mac student never sees
a GPU.

**A pixi bug.** `[feature.cuda.system-requirements]` emits a deprecation warning
suggesting you write the requirement inline instead:

```toml
platforms = [{ platform = "linux-64", cuda = "12" }]   # does NOT work on a feature
```

That suggestion does not parse. `pixi info` accepts it, but `pixi lock` fails
with `expected a string, found table` — verified on pixi 0.76.2 and 0.77.0. And
the requirement is not optional: drop it and the solve fails with
`pytorch 2.13.0 would require __cuda *, for which no candidates were found`. The
deprecated spelling is currently the only one that works. `pixi run -q` silences
the warning, which is what CI uses.

**Python itself drifts.** CI resolves 3.12.13 on Linux and 3.13.15 on macOS and
Windows from the same `>=3.12,<3.14` constraint. That is the pattern working as
intended, but it means "works on my machine" carries less weight than usual —
which is why CI runs all three.

## Continuous integration

`.github/workflows/ml.yml` runs on **ubuntu-latest, windows-latest and
macos-latest**. The matrix is not incidental: the claim is that one manifest
resolves correctly on three operating systems, so three real runners are the
evidence. Every push that touches `ml/` checks that the environment **installs**
and that a small model **trains and generalises** on that machine's backend.

- **`locked: true`** — CI fails if `pixi.lock` does not match `pixi.toml`
  instead of quietly re-solving, so the run reproduces the committed lock.
- **`cache: false`** — deliberately. Caching would restore a previously-good
  environment and skip the install on any push that does not change the lock,
  but installing from the lock is one of the things being tested, and it is what
  every student does on a fresh clone. A cold install costs 7-45s per OS.
- **The install is asserted, not assumed.** `test_installed_build_matches_the_lock`
  reads `conda-meta/` in the live environment and compares the artifact actually
  installed against the one the lock names for this platform. A stale cache or a
  stray `pip install` fails the build.
- **The model must generalise, not just converge.**
  `test_generalizes_on_the_selected_device` scores the model on data it never
  saw, and `test_predicts_sine_at_known_points` checks it against values known by
  hand. A backend with silently wrong arithmetic fails these even though its loss
  curve looked healthy.
- **`pixi-version: v0.76.2`** — pinned to the version that produced the lock, so
  a pixi release cannot change the answer mid-semester.

Two limits, stated plainly. Hosted runners have no NVIDIA GPU, so CI proves
*resolution and correctness*, not CUDA execution — the `cuda` environment is
verified through the lock file, never run. macOS runners are virtualized but do
report Metal, so the GPU path is genuinely exercised there.

## Layout

```
pixi.toml          the manifest: platforms, features, environments, tasks
pixi.lock          committed; the per-platform resolutions above live here
AGENTS.md          working notes for coding agents; read before editing
mldemo/device.py   pick the best device and describe it
mldemo/resolved.py parse pixi.lock, and compare it against what is installed
mldemo/train.py    fit a small MLP on a noisy sine, score it on held-out data
mldemo/bench.py    matmul timing, accelerator vs CPU
tests/             22 tests, including the thesis and install assertions
```

`.pixi/` is gitignored and regenerable; `pixi.lock` is committed and is the
reproducibility guarantee.
