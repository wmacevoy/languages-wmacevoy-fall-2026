#!/bin/sh
# Run all four implementations against the shared cases.txt.
set -eu
cd "$(dirname "$0")"

echo "== python";     (cd python && python3 -m unittest)
echo "== javascript"; (cd javascript && node --test json_number.test.mjs | tail -8)
echo "== rust";       (cd rust && cargo test --quiet)
echo "== c++";        (cd cpp && cmake -S . -B build -DCMAKE_BUILD_TYPE=Release >/dev/null &&
                       cmake --build build --config Release >/dev/null &&
                       ctest --test-dir build --build-config Release --output-on-failure | tail -3)
