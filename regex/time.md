# When things happen

Four test harnesses share one data file, `cases.txt`. That only works if every
harness sees the *current* file. Each tool reads it, compiles it or lists tests
from it at a different moment. If that moment comes before your edit, the
harness tests an old copy, and it still reports success.

This file records when each step happens, which tool decides that something is
out of date, and the two times that went wrong while building this demo.

## The rule

> Anything derived from `cases.txt` must be re-derived whenever `cases.txt`
> changes, by the same command you already run to test.

"Remember to rebuild" doesn't count. A test that passes because it never saw
the new case is worse than no test.

## When each language reads `cases.txt`

| language   | reads `cases.txt`                      | lists the tests              | after editing `cases.txt`, run |
| ---------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Python     | at run time, when the test runs        | at run time (one `subTest` per case) | `python3 -m unittest` |
| JavaScript | at run time, when the module loads     | at run time (one `test()` per case)  | `node --test json_number.test.mjs` |
| Rust       | **at compile time** (`include_str!`)   | inside one `#[test]`         | `cargo test` (it recompiles) |
| C++        | at run time, from an absolute path     | at run time, by GoogleTest   | `ctest` (no rebuild needed) |

Rust is the odd one out. `include_str!` copies the file's bytes into the test
binary, so the binary contains a snapshot of `cases.txt`. That's still safe
because cargo records `cases.txt` as an input of that binary. Edit the file
and `cargo test` prints `Compiling json_number` before it runs anything. We
checked this by adding a case and watching cargo recompile.

C++ reads the file at run time, but the *path* is fixed at configure time.
`CASES_FILE` is an absolute path compiled into the binary, so the binary only
works next to this checkout. That's fine for a test binary; it would be wrong
for something you ship.

## Incident 1: GoogleTest listed the tests before the cases existed

`gtest_discover_tests()` gives each GoogleTest case its own `ctest` entry. To
do that, it runs the binary with `--gtest_list_tests` and saves the list.
Then `ctest` runs whatever is on the saved list.

**What happened.** Two cases were added to `cases.txt`. Python, JavaScript and
Rust all reported 84 tests; `ctest` reported 82. Nothing failed. The two new
cases simply were not run.

**Why.** Discovery is tied to the *binary*, not to the data. By default
(`POST_BUILD`) the list is made right after linking. Editing `cases.txt`
doesn't relink anything, so the list stayed at 82.

**The first fix was wrong.** `DISCOVERY_MODE PRE_TEST` looks like it should
help, since it lists the tests when `ctest` starts. But it caches that list and
only rebuilds it when the binary is newer than the cache. Same bug, later.
We caught it only by adding a case and checking the count again.

**The real fix.** `ctest` now runs the whole GoogleTest binary as a single
test:

```cmake
add_test(NAME json_number_test COMMAND json_number_test)
```

The binary reads `cases.txt` and creates its parameterized tests each time it
starts, so nothing can be out of date. The cost is that `ctest` reports "1
test" rather than 84. Run `ctest --verbose` (or the binary directly) to see
each case. CI runs it verbosely, so each case appears in the log.

## Incident 2: restoring a file restored its old timestamp

Build tools decide what to rebuild by comparing file modification times
(mtimes). If a source file is newer than its output, they rebuild.
Otherwise they don't.

**What happened.** To check that the tests could catch a `\d` bug, we changed
`lib.rs` with `sed -i.bak` and confirmed `cargo test` failed. Then we
restored it with `mv lib.rs.bak lib.rs`. The next `cargo test` *still
failed*, while running the correct source.

**Why.** `sed -i.bak` keeps the original file, untouched, as the backup, with
its original mtime. `mv` keeps that mtime. So the restored `lib.rs` was
*older* than the binary built from the broken version. Cargo decided nothing
had changed and re-ran the broken binary.

**The fix.** After restoring a file by moving or copying it, `touch` it, or
restore with `git checkout -- file`, which writes it fresh. The general
point: an mtime records when the bytes were last written, not whether they
differ from what was built. Build tools trust mtimes because they're cheap,
and putting back an old mtime breaks that.

## Same reasoning, smaller: `DOWNLOAD_EXTRACT_TIMESTAMP`

The C++ build downloads GoogleTest as a `.tar.gz`. CMake can extract it with
the archive's original timestamps or with the time of extraction.

```cmake
FetchContent_Declare(googletest
    URL https://github.com/google/googletest/archive/refs/tags/v1.15.2.tar.gz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE)
```

`TRUE` means "stamp with the extraction time". If you change the URL to a
different GoogleTest version, the new files are newer than the old build
output, so everything that depends on them rebuilds. With the archive's own
timestamps, which can be years old, the new headers could look older than
the objects built from the previous version. That's incident 2 again.

## When the regex is compiled

The same question applies to the regex itself. Turning the pattern into a
matcher is the expensive step, so every version does it once rather than once
per call. Each language puts that moment somewhere different:

| language   | compiled                          | by                                     |
| ---------- | --------------------------------- | -------------------------------------- |
| Python     | when the module is imported       | `re.compile` at module level           |
| JavaScript | when the module is evaluated      | the `/.../` literal at module level    |
| Rust       | on the first call to `is_json_number` | `LazyLock` (thread-safe)          |
| C++        | on the first call to `is_json_number` | a function-local `static` (thread-safe since C++11) |

Rust and C++ build it lazily because neither can run `Regex::new` or the
`std::regex` constructor while compiling. A `static` has to be built at run
time, and the first call is the natural time to do it.
