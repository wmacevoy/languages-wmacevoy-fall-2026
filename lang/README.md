# cj: a small compiled language

A teaching demo of a compiler front end, not a production format. `cj`
("compressed JSON") is a schema with fill-in holes, followed by one list of
values per record. The compiler expands each list into a full JSON string:

```
bytes -> chars -> tokens -> parse tree -> check -> JSON strings
```

There are **two parsers for the same language**, recursive descent and
shift-reduce. Everything before and after the parser is shared, so the parsers
are the only difference between the two versions.

## The language

[`examples/people.cj`](examples/people.cj):

```
{"id":${0:int},"name":${1:string},"at":{"x":${2:number},"y":${3:number}},"tags":["new"],"ok":${4:bool}}
[1,"ada",1.5,-2,true,"95e088ab"]
[2,"Zoë",0,4.25,false,"1f730d27"]
```

```
$ python3 cj.py examples/people.cj
{"id":1,"name":"ada","at":{"x":1.5,"y":-2},"tags":["new"],"ok":true}
{"id":2,"name":"Zoë","at":{"x":0,"y":4.25},"tags":["new"],"ok":false}
```

- **Schema:** the first value. It is JSON, except that a value can also be a hole,
  `${index:type}`. Types are `int`, `number`, `string`, `bool` and `null`.
- **Holes:** numbered 0 to n-1 with no gaps. A hole can repeat, and every use takes
  the same value.
- **Rows:** one list per output string, holding the hole values in index order and
  then the CRC. Cells must be simple values.
- **CRC:** CRC-32 of the UTF-8 bytes of the *expanded output string*, as 8 lowercase
  hex digits. It covers the schema and the values, so editing either one fails the
  check.
- **Exact text:** numbers and strings are copied from the source as written, so
  `1e3` stays `1e3` and an escaped `\u` stays escaped. Whitespace between tokens
  doesn't matter and never reaches the output.

Nothing is printed unless every row checks out.

## Running it

It needs only Python 3 and has no dependencies.

```sh
python3 cj.py examples/people.cj              # compile with recursive descent
python3 cj.py --parser sr examples/people.cj  # compile with shift-reduce
python3 cj.py --encode draft.cj               # fill in or replace the CRC column
python3 -m unittest                           # run the tests
```

You can't write a CRC by hand, so write rows without one and let `--encode` add it:

```
$ cat draft.cj
{"name": ${0:string}, "ok": ${1:bool}}
["ada", true]

$ python3 cj.py --encode draft.cj
{"name":${0:string},"ok":${1:bool}}
["ada",true,"cfdd3b1d"]
```

## Looking inside each stage

`--dump` stops at a stage and shows its result:

| `--dump` | shows | code |
| --- | --- | --- |
| `bytes` | the raw file as hex | |
| `chars` | each character, its position, and how many bytes encoded it | [`chars.py`](chars.py) |
| `tokens` | each token, its kind and its exact text | [`tokens.py`](tokens.py) |
| `tree` | the parse tree | [`tree.py`](tree.py) |
| `trace` | the parser working, step by step (follows `--parser`) | [`parse_rd.py`](parse_rd.py), [`parse_sr.py`](parse_sr.py) |
| `table` | the shift-reduce parser's states and tables | [`slr.py`](slr.py) |

Checking and output generation are in [`backend.py`](backend.py).

Each stage can reject input, and errors name the stage and the place:

```
draft.cj:1:3: encoding error: invalid UTF-8 lead byte 0xff at byte 2
draft.cj:1:2: lexical error: numbers cannot have leading zeros
draft.cj:2:2: syntax error: expected ']', 'false', 'null', 'true', number or string, got ${0:int}
draft.cj:2:2: check error: expected number for hole 0, got "x"
draft.cj:2:4: check error: CRC mismatch: the row says 00000000, computed 4c2f32b8
```

## The two parsers

The traces show the difference best. Recursive descent decides which rule it is
in *before* reading it, and its position is the call stack:

```
$ python3 cj.py --dump trace examples/people.cj
program  (next: {)
  value  (next: {)
    object  (next: {)
      member  (next: "id")
        value  (next: ${0:int})
      member  (next: "name")
```

Shift-reduce decides *after* reading it, and its position is an explicit stack:

```
$ python3 cj.py --dump trace --parser sr examples/people.cj
(empty)                                      | {       | shift 7
{                                            | STRING  | shift 18
{ STRING                                     | :       | shift 26
{ STRING :                                   | HOLE    | shift 4
{ STRING : HOLE                              | ,       | reduce value -> HOLE
{ STRING : value                             | ,       | reduce member -> STRING : value
{ member                                     | ,       | reduce members -> member
```

| | recursive descent ([`parse_rd.py`](parse_rd.py)) | shift-reduce ([`parse_sr.py`](parse_sr.py), [`slr.py`](slr.py)) |
| --- | --- | --- |
| the grammar is | code: one function per rule | data: a list of rules |
| remembering position | the call stack | an explicit stack of states |
| `rows -> rows row` | must become a loop, or it would never return | used directly |
| an ambiguous grammar | the code quietly picks whichever branch comes first | the builder raises `GrammarConflict` |
| a good error message | written by hand at each point | worked out from the table |
| nesting depth | limited by Python's call stack | limited only by memory |

**Nesting depth, measured.** With Python's default recursion limit, recursive
descent fails past 247 levels of `[`. The shift-reduce parser alone handled
200,000. The whole compiler still stops at 995 with shift-reduce, because the
checker and generator walk the tree recursively. Both report `nesting is too
deep` rather than crashing.

**Exact error lists.** An SLR table can reduce on a token that isn't really legal
in the current context, because FOLLOW merges all the contexts a rule appears in.
That never accepts bad input, but listing the table's entries would give a
misleading "expected" list. So `can_continue` in `parse_sr.py` tries each terminal
on a copy of the stack. This extra step is why both parsers report identical
errors.

## How it's tested

`test_cj.py` has 54 tests:

- **The parsers against each other:** on every input, including 25,000 random or
  mutated ones, they must build equal trees or give the same error at the same place.
- **Python's UTF-8 decoder against `chars.py`:** they must agree on 20,000 random
  byte strings chosen to land near the encoding's edge cases.
- **`json.loads` against the output:** 500 random schemas must expand to exactly the
  expected values.

## Limits

These are left out on purpose, to keep the demo small:

- The compiler reads the whole file into memory rather than streaming.
- It stops at the first error rather than recovering and reporting more.
- Duplicate object keys are allowed, as JSON's grammar allows them.
- `\u` escapes are checked for shape only, so a lone surrogate like `\ud800` passes.
- CRC-32 catches accidental changes. It offers no protection against deliberate tampering.
