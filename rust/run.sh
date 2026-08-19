#!/usr/bin/env bash
#
# Run a built artifact inside the Docker environment.
#
#   ./run.sh                      # run the artifact matching the container's arch
#   ./run.sh -- --name Ada        # everything after -- goes to the program
#   ./run.sh --bin hello -- args  # pick a binary when the crate has several
#   ./run.sh --list               # list what is in dist/
#
# Only the Linux artifacts can execute here -- the macOS and Windows ones are
# cross-compiled, so this reports them rather than pretending to run them.
# If the needed artifact is missing, build.sh is invoked first.

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="${RUST_XBUILD_IMAGE:-rust-xbuild:local}"

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m==> %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- host side

run_on_host() {
  command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
  docker info >/dev/null 2>&1 || die "cannot talk to the docker daemon -- is Docker running?"

  if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    say "image $IMAGE not present yet -- building it"
    docker build \
      ${RUST_VERSION:+--build-arg "RUST_VERSION=$RUST_VERSION"} \
      -t "$IMAGE" -f "$PROJECT_DIR/Dockerfile" "$PROJECT_DIR"
  fi

  # Keep stdin attached so the program can be interactive.
  tty_flag=""
  [ -t 0 ] && [ -t 1 ] && tty_flag="-t"

  say "starting container with $PROJECT_DIR mounted at /work"
  # shellcheck disable=SC2086
  exec docker run --rm -i $tty_flag \
    -v "$PROJECT_DIR:/work" \
    -w /work \
    -u "$(id -u):$(id -g)" \
    -e CARGO_TERM_COLOR \
    "$IMAGE" \
    ./run.sh --in-container "$@"
}

# ----------------------------------------------------------- container side

native_label() {
  case "$(uname -m)" in
    x86_64)          echo linux-x86_64 ;;
    aarch64|arm64)   echo linux-arm64 ;;
    *) die "no Linux artifact is built for $(uname -m)" ;;
  esac
}

run_in_container() {
  mkdir -p "$CARGO_HOME" "$HOME"

  bin=""
  if [ "${1:-}" = "--bin" ]; then
    [ -n "${2:-}" ] || die "--bin needs a binary name"
    bin="$2"; shift 2
  fi
  [ "${1:-}" = "--" ] && shift

  label="$(native_label)"

  # Rebuild only what this host can actually execute.
  matches="$(ls dist/*-"$label" 2>/dev/null || true)"
  if [ -z "$matches" ]; then
    say "no $label artifact in dist/ yet -- building it"
    ./build.sh --in-container "$label"
    matches="$(ls dist/*-"$label" 2>/dev/null || true)"
  fi
  [ -n "$matches" ] || die "still no $label artifact after building"

  if [ -n "$bin" ]; then
    matches="$(printf '%s\n' "$matches" | grep "/$bin-" || true)"
    [ -n "$matches" ] || die "no artifact for binary '$bin' at $label"
  fi

  count="$(printf '%s\n' "$matches" | wc -l | tr -d ' ')"
  if [ "$count" -gt 1 ]; then
    printf 'several binaries built for %s -- pick one with --bin:\n' "$label" >&2
    printf '%s\n' "$matches" >&2
    exit 1
  fi

  artifact="$matches"
  say "$artifact"
  printf '\033[1;34m==>\033[0m %s\n\n' "$(file -b "$artifact")"
  exec "./$artifact" "$@"
}

list_dist() {
  [ -d "$PROJECT_DIR/dist" ] || die "nothing built yet -- run ./build.sh first"
  for artifact in "$PROJECT_DIR"/dist/*; do
    [ -f "$artifact" ] || continue
    case "$artifact" in */SHA256SUMS) continue ;; esac
    printf '  %s\n' "$(basename "$artifact")"
  done
}

# --------------------------------------------------------------- dispatch

case "${1:-}" in
  --list|-l)      list_dist; exit 0 ;;
  --in-container) shift; run_in_container "$@" ;;
  -h|--help)      sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *)              run_on_host "$@" ;;
esac
