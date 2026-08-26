#!/usr/bin/env bash
#
# Run the built artifact inside the Docker environment.
#
#   ./run.sh          # run the artifact for the container's architecture
#   ./run.sh --list   # list what is in dist/
#
# If the artifact is missing, build.sh is invoked first.
#
# --in-container is the second half of this script: run.sh re-invokes itself
# with that flag from inside the container. It is not meant to be run by hand.

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="${HELLO_BUILD_IMAGE:-hello-cxx:local}"

say() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m==> %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- host side

run_on_host() {
  command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
  docker info >/dev/null 2>&1 || die "cannot talk to the docker daemon -- is Docker running?"

  if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    say "image $IMAGE not present yet -- building it"
    docker build \
      ${GCC_VERSION:+--build-arg "GCC_VERSION=$GCC_VERSION"} \
      -t "$IMAGE" -f "$PROJECT_DIR/Dockerfile" "$PROJECT_DIR"
  fi

  tty_flag=""
  [ -t 0 ] && [ -t 1 ] && tty_flag="-t"

  say "starting container with $PROJECT_DIR mounted at /work"
  # shellcheck disable=SC2086
  exec docker run --rm -i $tty_flag \
    -v "$PROJECT_DIR:/work" \
    -w /work \
    -u "$(id -u):$(id -g)" \
    "$IMAGE" \
    ./run.sh --in-container "$@"
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
  mkdir -p "$HOME"

  label="$(arch_label)"

  matches="$(ls dist/*-"$label" 2>/dev/null || true)"
  if [ -z "$matches" ]; then
    say "no $label artifact in dist/ yet -- building it"
    ./build.sh --in-container
    matches="$(ls dist/*-"$label" 2>/dev/null || true)"
  fi
  [ -n "$matches" ] || die "still no $label artifact after building"

  artifact="$(printf '%s\n' "$matches" | head -1)"
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
  -h|--help)      sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *)              run_on_host "$@" ;;
esac
