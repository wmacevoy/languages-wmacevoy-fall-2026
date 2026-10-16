# JSON number regex, four ways

One regular expression for a JSON number ([RFC 8259 §6](https://www.rfc-editor.org/rfc/rfc8259#section-6)),
in four languages, checked against **one** shared test set, [`cases.txt`](cases.txt):

```
-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?
```

| language   | function                 | whole-string match            | tests                          |
| ---------- | ------------------------ | ----------------------------- | ------------------------------ |
| Python     | `is_json_number`         | `re.fullmatch`                | `unittest`, one `subTest` per case |
| JavaScript | `isJsonNumber`           | `^…$`, no `g` or `m` flag     | `node:test`, one test per case |
| Rust       | `is_json_number`         | `^…$` with the `regex` crate  | `cargo test`, all failures reported together |
| C++        | `is_json_number`         | `std::regex_match`            | GoogleTest, value-parameterized |

The pattern is the same everywhere; the *agreement* is not automatic. The cases
include the inputs where the obvious spelling goes wrong in some languages
and not others:

- **`\d` vs `[0-9]`.** In Python (on `str`) and Rust, `\d` matches every Unicode
  decimal digit, so `1٢` would be a "number". In JavaScript and C++ it is ASCII
  only. `[0-9]` means the same thing in all four.
- **`$`.** In Python, `$` also matches just before a trailing newline, so
  `re.match(r"…$", "1\n")` succeeds. `fullmatch` does not.
- **The `g` flag.** A global JavaScript regex remembers `lastIndex` between
  `test()` calls, so the same input alternates between true and false.

## Running

```sh
./test.sh          # all four
```

or one at a time:

```sh
cd python     && python3 -m unittest
cd javascript && node --test json_number.test.mjs
cd rust       && cargo test
cd cpp        && cmake -S . -B build && cmake --build build && ctest --test-dir build
```

The C++ build downloads GoogleTest 1.15.2 with CMake's `FetchContent`, so it
needs no system install.

## Adding a case

Add a line to `cases.txt` — `+ input` must match, `- input` must not — and
every language picks it up. Use `\xHH` for whitespace and control characters
and `\\` for a backslash; see the header of the file.
