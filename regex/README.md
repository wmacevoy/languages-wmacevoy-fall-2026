# JSON number regex, four ways

One regular expression recognizes a JSON number
([RFC 8259 §6](https://www.rfc-editor.org/rfc/rfc8259#section-6)). It is written
in Python, JavaScript, Rust and C++, and all four are checked against **one**
shared test set, [`cases.txt`](cases.txt). There is a single list of cases, so
the four can't quietly drift apart: if one disagrees, its tests fail.

```
-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?
```

| piece                  | means                                               |
| ---------------------- | --------------------------------------------------- |
| `-?`                   | optional minus sign (JSON has no leading `+`)       |
| `(?:0\|[1-9][0-9]*)`   | integer part: `0`, or a digit 1–9 then any digits (no leading zeros) |
| `(?:\.[0-9]+)?`        | optional fraction: `.` then at least one digit      |
| `(?:[eE][+-]?[0-9]+)?` | optional exponent: `e`/`E`, optional sign, at least one digit |

`(?:...)` is a *non-capturing group*: it groups the pattern inside it so a `?`
applies to the whole group, without saving the matched text. Each source file
starts with a short guide to the notation it uses.

## Layout

```
cases.txt                  the shared test set: 28 must match, 55 must not
test.sh                    run all four, one line each
time.md                    when each piece reads, compiles and lists things, and why it matters
python/                    json_number.py          test_json_number.py   (unittest)
javascript/                json_number.mjs         json_number.test.mjs  (node:test)
rust/                      src/lib.rs              tests/cases.rs        (cargo test, regex crate)
cpp/                       json_number.{hpp,cpp}   json_number_test.cpp  (GoogleTest)
```

| language   | function         | whole-string match           | regex compiled          |
| ---------- | ---------------- | ---------------------------- | ----------------------- |
| Python     | `is_json_number` | `re.fullmatch`               | at import               |
| JavaScript | `isJsonNumber`   | `^…$`, no `g` or `m` flag    | at module load          |
| Rust       | `is_json_number` | `^…$`, `regex` crate         | first call (`LazyLock`) |
| C++        | `is_json_number` | `std::regex_match`           | first call (`static`)   |

## Same pattern, different results

The pattern is identical in all four languages; agreement still has to be
earned. `cases.txt` includes the inputs where the obvious spelling goes wrong in
some languages and not in others:

- **`\d` vs `[0-9]`.** In Python (on `str`) and Rust, `\d` matches every Unicode
  decimal digit, so `1٢` would count as a number. In JavaScript and C++, `\d` is
  ASCII only. `[0-9]` means the same thing in all four.
- **`$`.** In Python, `$` also matches just before a trailing newline, so
  `re.match(r"…$", "1\n")` succeeds. `re.fullmatch` doesn't.
- **The `g` flag.** A global JavaScript regex remembers `lastIndex` between
  `test()` calls, so the same input alternates between true and false.

We checked that the tests catch each of these: put the wrong spelling back and
a named case fails.

## Running

```sh
./test.sh
```

```
ok    python
ok    javascript
ok    rust
ok    c++
```

Or run one language at a time:

```sh
cd python     && python3 -m unittest -v
cd javascript && node --test json_number.test.mjs
cd rust       && cargo test
cd cpp        && cmake -S . -B build && cmake --build build && ctest --test-dir build --verbose
```

The C++ build downloads GoogleTest 1.15.2 through CMake's `FetchContent`, so
GoogleTest doesn't need to be installed. `ctest` shows the C++ suite as a
single test; `--verbose` lists every case. [`time.md`](time.md) explains why.

## Adding a case

Add one line to `cases.txt`: `+ input` must match, `- input` must not. Every
language picks it up the next time its tests run; no other file changes. Use
`\xHH` for whitespace and control characters and `\\` for a backslash. The
header of `cases.txt` has the details.

## CI

[`.github/workflows/regex.yml`](../.github/workflows/regex.yml) runs when
something under `regex/` changes:

- **C++** builds and runs natively on Linux (GCC), macOS (Clang) and Windows
  (MSVC). Those are three different `std::regex` implementations, and on
  Windows `cases.txt` is checked out with `\r\n` line endings.
- **Python, JavaScript and Rust** run on Linux against the same `cases.txt`.
