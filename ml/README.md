# ml — pixi, for a stack that cannot be containerized

[![ml](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/ml.yml)

The companion to [`../rust`](../rust), which argues the opposite case. There, a
container is exactly right: the build is hermetic, hardware-independent, and
reproducing it everywhere is the goal. Here it is exactly wrong.

An ML stack should use the GPU it finds. Which GPU that is — and therefore which
build of PyTorch is correct — differs per machine. A `Dockerfile` has to pick
one answer for everyone; a pixi manifest describes the *constraints* and lets
each platform resolve them. Same argument applies to any toolchain that is too
large, too GUI-bound, or too hardware-bound to live in a container: Android and
Flutter SDKs, RStudio, anything with a real UI.

## Usage

```sh
pixi run device     # what THIS machine resolved to
pixi run resolved   # what EVERY platform resolved to, read from pixi.lock
pixi run train      # fit a small model on the best available device
pixi run bench      # time a matmul on the accelerator against the CPU
pixi run test       # the test suite
```

Nothing to install first beyond pixi itself — `pixi run` builds the environment
from `pixi.lock` on first use.

## The point, in one table

`pixi run resolved` reads the committed lock file and prints what each platform
got. One manifest, five resolutions:

```
environment  platform   version  accelerator  build
---------------------------------------------------
cuda         linux-64   2.13.0   CUDA 12.9    cuda129_mkl_py312_h0509a7e_302
cuda         win-64     2.13.0   CUDA 12.8    cuda128_mkl_py313_h2820626_302
default      linux-64   2.13.0   CPU          cpu_mkl_py312_h999dc20_102
default      osx-arm64  2.13.0   Metal (MPS)  cpu_generic_py313_hc574c4b_2
default      win-64     2.13.0   CPU          cpu_mkl_py313_h71f30b3_102
```

Note the asymmetry, which is worth a minute of lecture time: on Linux and
Windows, using the GPU means installing a **different package build**. On macOS
it does not — Metal is compiled into every `osx-arm64` build, so the same
`cpu_generic` artifact is the GPU build. The drift is real but not uniform, and
a package name alone does not tell you which hardware you are about to use.

On an M-series Mac the payoff is measurable:

```
$ pixi run bench
2048x2048 matmul, mean of 10 runs
  cpu :    46.08 ms
  mps :     5.99 ms  (Apple arm64 GPU via Metal)

speedup: 7.7x
```

None of that speedup survives a container on this machine: Docker Desktop runs a
Linux VM with no Metal passthrough, so a containerized run gets the `linux`
row — CPU — no matter what hardware is underneath.

## How the manifest is put together

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

The `system-requirements` line is what lets a Mac solve for "linux-64 *with* a
CUDA 12 GPU present" without owning one. pixi records it in the lock as a
synthetic platform (`p1`, `p2`) whose `subdir` is the real target and whose
virtual packages include `__cuda=12`. That is also why `pixi run resolved` can
report on hardware this machine does not have.

## Why TensorFlow is not used here

It cannot express the thesis. On conda-forge today:

| platform | TensorFlow | PyTorch |
| --- | --- | --- |
| `osx-arm64` | 2.19.1, **CPU only** | 2.13.0, Metal |
| `linux-64` | 2.19.1 `cuda128` | 2.13.0 `cuda129` |
| `win-64` | **1.14.0, from 2020** | 2.13.0 `cuda130` |

A Windows student has no usable TensorFlow at all, and a Mac student never sees
a GPU. PyTorch gives all three platforms a current build and a real accelerator.

## A pixi bug worth knowing about

`[feature.cuda.system-requirements]` emits a deprecation warning suggesting you
write the requirement inline instead:

```toml
platforms = [{ platform = "linux-64", cuda = "12" }]   # does NOT work on a feature
```

That suggestion does not parse. `pixi info` accepts it, but `pixi lock` fails
with `expected a string, found table` — verified on pixi 0.76.2 and 0.77.0. And
the requirement is not optional: drop it and the solve fails outright with
`pytorch 2.13.0 would require __cuda *, for which no candidates were found`.
So the deprecated spelling is currently the only one that works. `pixi run -q`
silences the warning, which is what the CI steps use.

## Continuous integration

`.github/workflows/ml.yml` runs the suite on **ubuntu-latest, windows-latest and
macos-latest**. The matrix is not incidental — the claim is that one manifest
resolves correctly on three operating systems, so three real runners are the
evidence for it. Each prints the accelerator it resolved to before testing.

Every push that touches `ml/` therefore checks two things on three operating
systems: **that the environment installs**, and **that a small model actually
trains and generalises** on whatever backend that machine has.

Reliability choices, and their reasons:

- **`locked: true`** — CI fails if `pixi.lock` does not match `pixi.toml`,
  instead of quietly re-solving. The run therefore reproduces the committed
  lock rather than whatever conda-forge happens to hold today.
- **`cache: false`** — deliberately. Caching would restore a previously-good
  environment and skip the install on any push that does not change the lock,
  but installing from the lock is one of the things being tested, and it is
  what every student does on a fresh clone. A cold install costs 13-41s per OS.
- **The install is asserted, not assumed.** `test_installed_build_matches_the_lock`
  reads `conda-meta/` in the live environment and compares the artifact actually
  installed against the one the lock names for this platform. A stale cache,
  a partial install or a stray `pip install` fails the build.
- **The model must generalise, not just converge.**
  `test_generalizes_on_the_selected_device` scores the trained model on data it
  never saw, on CUDA, Metal or CPU as available, and
  `test_predicts_sine_at_known_points` checks it against values known by hand.
  A backend whose arithmetic is silently wrong fails these even though its loss
  curve looked healthy.
- **`pixi-version: v0.76.2`** — pinned to the version that produced the lock, so
  a pixi release cannot change the answer underneath the course. Upgrading is a
  deliberate one-line edit.
- **`fail-fast: false`** — when this breaks, "which platforms broke" is the
  whole question, and fail-fast would hide it.
- **The thesis is a test.** `tests/test_resolved.py` asserts the lock really
  does resolve to different builds per platform, that the `cuda` environment
  picks `cuda*` builds and the default one does not, and that a macOS `cpu_*`
  build is reported as Metal rather than CPU. If pixi ever stopped doing this,
  the build fails rather than the README quietly becoming untrue.

Two limits worth stating plainly. Hosted runners have no NVIDIA GPU, so CI
proves *resolution and correctness*, not CUDA execution — the `cuda`
environment is verified through the lock file, not by running it. And macOS
runners are virtualized, so whether they report Metal or CPU depends on the
runner image; the tests adapt to whichever they get rather than assuming.

## Layout

```
pixi.toml          the manifest: platforms, features, environments, tasks
pixi.lock          committed; the per-platform resolutions above live here
mldemo/device.py   pick the best device and describe it
mldemo/resolved.py parse pixi.lock and report every platform's answer
mldemo/train.py    fit a small MLP on a noisy sine
mldemo/bench.py    matmul timing, accelerator vs CPU
tests/             16 tests, including the thesis assertions
```

`.pixi/` is gitignored and regenerable; `pixi.lock` is committed and is the
reproducibility guarantee. `.gitattributes` marks the lock as generated so it
does not three-way-merge.
