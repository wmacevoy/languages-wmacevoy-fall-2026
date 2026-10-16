#!/bin/sh
# Run all four implementations against the shared cases.txt.
# Prints one line per language; on a failure, prints that language's full
# output and exits non-zero.
set -u
cd "$(dirname "$0")"

log=$(mktemp)
trap 'rm -f "$log"' EXIT
status=0

run() {
    name=$1
    shift
    if (eval "$*") >"$log" 2>&1; then
        echo "ok    $name"
    else
        echo "FAIL  $name"
        cat "$log"
        status=1
    fi
}

run python     'cd python && python3 -m unittest'
run javascript 'cd javascript && node --test json_number.test.mjs'
run rust       'cd rust && cargo test'
run c++        'cd cpp && cmake -S . -B build -DCMAKE_BUILD_TYPE=Release &&
                cmake --build build --config Release &&
                ctest --test-dir build --build-config Release --output-on-failure'

exit $status
