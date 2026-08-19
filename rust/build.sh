#!/usr/bin/env bash
#
# Build the crate for every supported platform inside the Docker environment.
#
#   ./build.sh                       # test, then build every target
#   ./build.sh linux-x86_64 windows  # only targets whose label matches
#   ./build.sh --no-test             # skip the test gate (debugging a link error)
#   ./build.sh --list                # show the target table and exit
#
# The test suite runs first and a failure stops the build, so dist/ never holds
# artifacts from code that does not pass its own tests. This is the same gate CI
# applies -- see .github/workflows/rust.yml.
#
# Artifacts land in ./dist. The rust/ directory is bind-mounted into the
# container, so the sources are never baked into the image.
#
# --in-container is the second half of this script: build.sh re-invokes itself
# with that flag from inside the container. It is not meant to be run by hand.

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="${RUST_XBUILD_IMAGE:-rust-xbuild:local}"

# label | rust target triple | linker driver | executable suffix
TARGETS="
linux-x86_64|x86_64-unknown-linux-musl|zigbuild|
linux-arm64|aarch64-unknown-linux-musl|zigbuild|
macos-x86_64|x86_64-apple-darwin|zigbuild|
macos-arm64|aarch64-apple-darwin|zigbuild|
macos-universal2|universal2-apple-darwin|zigbuild|
windows-x86_64|x86_64-pc-windows-gnu|build|.exe
"

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m==> %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[1;31m==> %s\033[0m\n' "$*" >&2; exit 1; }

list_targets() {
  printf '%-18s %-30s %s\n' LABEL TRIPLE LINKER
  printf '%s\n' "$TARGETS" | while IFS='|' read -r label triple linker ext; do
    [ -n "$label" ] || continue
    printf '%-18s %-30s %s\n' "$label" "$triple" "$linker"
  done
}

# ---------------------------------------------------------------- host side

run_on_host() {
  command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
  docker info >/dev/null 2>&1 || die "cannot talk to the docker daemon -- is Docker running?"

  say "building image $IMAGE"
  docker build \
    ${RUST_VERSION:+--build-arg "RUST_VERSION=$RUST_VERSION"} \
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
    -e CARGO_TERM_COLOR \
    "$IMAGE" \
    ./build.sh --in-container "$@"
}

# ----------------------------------------------------------- container side

# Does $label match any of the user's filters? No filters means "yes".
label_selected() {
  label="$1"; shift
  [ "$#" -eq 0 ] && return 0
  for pattern in "$@"; do
    case "$label" in
      *"$pattern"*) return 0 ;;
    esac
  done
  return 1
}

run_in_container() {
  mkdir -p "$CARGO_HOME" "$HOME" dist

  [ -f Cargo.toml ] || die "no Cargo.toml in /work -- nothing to build"

  # Split --no-test out of the argument list; whatever is left filters targets.
  run_tests=1
  filters=""
  for arg in "$@"; do
    case "$arg" in
      --no-test) run_tests=0 ;;
      *)         filters="$filters $arg" ;;
    esac
  done
  # Target labels contain no spaces, so word splitting is what we want here.
  # shellcheck disable=SC2086
  set -- $filters

  metadata="$(cargo metadata --no-deps --format-version 1)"
  version="$(printf '%s' "$metadata" | jq -r '.packages[0].version')"
  bins="$(printf '%s' "$metadata" \
    | jq -r '.packages[].targets[] | select(any(.kind[]; . == "bin")) | .name')"
  [ -n "$bins" ] || die "the crate declares no [[bin]] targets"

  say "crate version $version, binaries: $(echo $bins | tr '\n' ' ')"

  # Gate the artifacts on the tests. Only the container's own target can execute
  # here, but the code under test is identical across every target.
  if [ "$run_tests" -eq 1 ]; then
    say "running the test suite ($(rustc -vV | awk '/^host:/ {print $2}'))"
    cargo test --locked --all-features
  else
    warn "skipping the test suite (--no-test)"
  fi

  built=""
  failed=""

  printf '%s\n' "$TARGETS" | grep -v '^$' > /tmp/targets.txt
  while IFS='|' read -r label triple linker ext; do
    label_selected "$label" "$@" || continue

    say "building $label ($triple)"
    if cargo "$linker" --release --target "$triple"; then
      for bin in $bins; do
        src="target/$triple/release/$bin$ext"
        dst="dist/$bin-$version-$label$ext"
        if [ -f "$src" ]; then
          cp "$src" "$dst"
          built="$built $dst"
        else
          warn "$label: expected $src, but it was not produced"
          failed="$failed $label"
        fi
      done
    else
      warn "$label: build failed"
      failed="$failed $label"
    fi
  done < /tmp/targets.txt

  [ -n "$built" ] || die "no artifacts were produced"

  say "artifacts in dist/"
  for artifact in $built; do
    printf '  %s\n    %s\n' "$artifact" "$(file -b "$artifact")"
  done

  # A manifest is handy when these get handed around outside the container.
  ( cd dist && sha256sum ./* > SHA256SUMS 2>/dev/null ) || true

  if [ -n "$failed" ]; then
    warn "failed targets:$failed"
    exit 1
  fi
  say "all requested targets built"
}

# --------------------------------------------------------------- dispatch

case "${1:-}" in
  --list|-l)      list_targets; exit 0 ;;
  --in-container) shift; run_in_container "$@" ;;
  -h|--help)      sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^#\{1,\} \{0,1\}//'; exit 0 ;;
  *)              run_on_host "$@" ;;
esac
