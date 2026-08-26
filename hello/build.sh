#!/usr/bin/env bash
#
# Build and test the program inside the Docker environment.
#
#   ./build.sh              # configure, build, test -> ./dist
#   ./build.sh --no-test    # skip the test gate (debugging a build error)
#   ./build.sh --clean      # discard ./build first
#
# The test runs before anything is staged, so dist/ never holds a binary that
# failed its own test. This is the same gate CI applies -- see
# .github/workflows/hello.yml.
#
# The container builds for the container's own architecture: a Linux image
# produces Linux binaries, and on Apple silicon Docker runs it as arm64, so
# you get linux-arm64. It does not cross-compile -- see README.md, "Why the
# container does not build all six".
#
# --in-container is the second half of this script: build.sh re-invokes itself
# with that flag from inside the container. It is not meant to be run by hand.

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="${HELLO_BUILD_IMAGE:-hello-cxx:local}"

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m==> %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[1;31m==> %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- host side

run_on_host() {
  command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
  docker info >/dev/null 2>&1 || die "cannot talk to the docker daemon -- is Docker running?"

  say "building image $IMAGE"
  docker build \
    ${GCC_VERSION:+--build-arg "GCC_VERSION=$GCC_VERSION"} \
    -t "$IMAGE" \
    -f "$PROJECT_DIR/Dockerfile" \
    "$PROJECT_DIR"

  # -t only when we actually have a terminal, so CI logs stay clean.
  tty_flag=""
  [ -t 1 ] && tty_flag="-t"

  say "starting container with $PROJECT_DIR mounted at /work"
  # shellcheck disable=SC2086
  exec docker run --rm $tty_flag \
    -v "$PROJECT_DIR:/work" \
    -w /work \
    -u "$(id -u):$(id -g)" \
    "$IMAGE" \
    ./build.sh --in-container "$@"
}

# ----------------------------------------------------------- container side

arch_label() {
  case "$(uname -m)" in
    x86_64)        echo linux-x86_64 ;;
    aarch64|arm64) echo linux-arm64 ;;
    *)             die "unsupported container architecture: $(uname -m)" ;;
  esac
}

run_in_container() {
  mkdir -p "$HOME" dist

  [ -f CMakeLists.txt ] || die "no CMakeLists.txt in /work -- nothing to build"

  run_tests=1
  for arg in "$@"; do
    case "$arg" in
      --no-test) run_tests=0 ;;
      --clean)   say "discarding ./build"; rm -rf build ;;
      *)         die "unknown option: $arg" ;;
    esac
  done

  label="$(arch_label)"
  say "$label, $(g++ -dumpversion | sed 's/^/gcc /'), $(cmake --version | head -1)"

  say "configuring"
  cmake -S . -B build -DCMAKE_BUILD_TYPE=Release

  say "building"
  cmake --build build --config Release

  # Gate the artifact on the test. The container can execute what it just
  # built, so this is a real run, not a link check.
  if [ "$run_tests" -eq 1 ]; then
    say "testing"
    ctest --test-dir build --build-config Release --output-on-failure
  else
    warn "skipping the test (--no-test)"
  fi

  version="$(awk -F= '/^CMAKE_PROJECT_VERSION:/ {print $2}' build/CMakeCache.txt)"
  [ -n "$version" ] || version=0.0.0

  src="build/hello"
  [ -f "$src" ] || die "expected $src, but it was not produced"
  dst="dist/hello-$version-$label"
  cp "$src" "$dst"

  say "artifact in dist/"
  printf '  %s\n    %s\n' "$dst" "$(file -b "$dst")"

  # A manifest is handy when these get handed around outside the container.
  ( cd dist && sha256sum ./* > SHA256SUMS 2>/dev/null ) || true
}

# --------------------------------------------------------------- dispatch

case "${1:-}" in
  --in-container) shift; run_in_container "$@" ;;
  -h|--help)      sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^#\{1,\} \{0,1\}//'; exit 0 ;;
  *)              run_on_host "$@" ;;
esac
