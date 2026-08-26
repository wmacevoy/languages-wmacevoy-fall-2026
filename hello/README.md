# hello — the standard C++ hello world, built six ways

[![hello](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/hello.yml/badge.svg)](https://github.com/wmacevoy/languages-wmacevoy-fall-2026/actions/workflows/hello.yml)

The program is the textbook one, unchanged:

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

Everything else here exists to answer two different questions about that file,
which are easy to confuse:

| question | answered by | what it gives you |
| --- | --- | --- |
| Can one machine reproduce this build exactly? | `Dockerfile` + `build.sh` | a pinned compiler, pinned image, no dependence on what you happen to have installed |
| Does this source build *everywhere*? | `.github/workflows/hello.yml` | GCC, Clang and MSVC, on x86-64 and arm64, each running its own binary |

A container answers the first well and the second not at all: it pins *one*
toolchain, so a green containerized build tells you nothing about MSVC. The
matrix answers the second and not the first: the runner images change under you
every month. You want both, which is why both are here.

## Usage

```sh
./build.sh              # configure, build, test in the container -> ./dist
./build.sh --no-test    # skip the test gate (debugging a build error)
./build.sh --clean      # discard ./build first
./run.sh                # run the artifact for the container's architecture
./run.sh --list         # list ./dist
```

Neither script needs a local C++ toolchain or CMake — only Docker. The source is
**bind-mounted**, not copied into the image, so editing `src/hello.cpp` and
rerunning `./build.sh` picks up the change with no image rebuild.

To build without Docker, the ordinary CMake incantation works and is exactly
what CI runs:

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build --build-config Release --output-on-failure
```

## The test

There is one test, and it is a smoke test rather than a test suite — the program
has one function and it takes no input. What it is there to prove is narrower
and more useful than "the code is correct": that the binary *this platform just
produced* actually executes and prints the right thing.

That is the claim cross-compilation cannot make about itself. `../rust` builds a
macOS binary on a Linux host, and nothing in that pipeline ever runs it. Here
every matrix leg runs on a machine whose CPU really is that architecture, so the
test is a real execution on real hardware.

The gate is in `build.sh`, not only in the workflow, so a local build cannot
quietly produce an artifact that CI would reject. (Verified: with the string
changed to `Goodbye, World!`, `./build.sh` fails with exit code 8 and leaves
`dist/` empty.)

## Continuous integration

`.github/workflows/hello.yml` runs on every push or pull request that touches
`hello/`. Two jobs, answering the two questions above.

**`build`** — six legs, `fail-fast: false` so a break tells you *which*
platforms broke:

| label | runner | arch | compiler |
| --- | --- | --- | --- |
| `linux-x86_64` | `ubuntu-24.04` | x86-64 | GCC |
| `linux-arm64` | `ubuntu-24.04-arm` | arm64 | GCC |
| `macos-x86_64` | `macos-15-intel` | x86-64 | Clang |
| `macos-arm64` | `macos-15` | arm64 | Clang |
| `windows-x86_64` | `windows-2025` | x86-64 | MSVC |
| `windows-arm64` | `windows-11-arm` | arm64 | MSVC |

All six are GitHub-hosted and free for public repositories, so "as available"
turns out to be *all* of them — which was not true as recently as 2024, when
arm64 runners were self-hosted-only.

Every step in that job is a bare `cmake` invocation with no shell syntax, so the
same six lines run identically under bash and PowerShell. The workflow never
sets `shell:`, and there is no per-platform branch anywhere in it. Two details
do the work:

- `cmake --build --config Release` — required by multi-config generators
  (Visual Studio), ignored by single-config ones (Ninja, Makefiles).
- `cmake --install --prefix dist` — knows where each generator puts the binary
  (`build/hello` vs `build/Release/hello.exe`) and what the executable suffix
  is, so no path is hard-coded.

**`container`** — runs `./build.sh`, the same command you run locally. There is
no parallel CI recipe to drift out of sync with the local one.

Both jobs upload their binaries as downloadable artifacts.

### Why the container does not build all six

It could build three of them — mingw-w64 reaches Windows x86-64, and a cross-GCC
reaches arm64 Linux. It cannot reach either macOS target without an Apple SDK,
which is licensed and not redistributable in an image.

That wall is the interesting part, and `../rust` already climbs it: Rust's
`cargo-zigbuild` bundles libc stubs for glibc, musl *and* macOS, so it emits
Mach-O binaries from a Linux container. C++ has no equivalent — so this demo
splits the job the way most C++ projects actually do, containerizing the
reproducible part and renting real hardware for the rest.

### One dated caveat

`macos-15-intel` is the **last** x86-64 macOS image GitHub plans to offer; it is
scheduled to go away in **August 2027**, after which Actions is arm64-only for
macOS. (Its predecessor, `macos-13`, was retired in December 2025.) When that
happens, drop the `macos-x86_64` row — the matrix is a list of five instead of
six, and nothing else changes.

## Layout

```
hello/
├── CMakeLists.txt   the portable build: one recipe for GCC, Clang and MSVC
├── Dockerfile       pinned GCC + CMake + Ninja; bind-mounts, copies nothing
├── build.sh         host side builds the image; container side does the build
├── run.sh           runs the built artifact in the container
└── src/hello.cpp    the program
```

`build/`, `dist/` and `.docker-cache/` are generated and git-ignored.
