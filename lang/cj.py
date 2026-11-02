#!/usr/bin/env python3
"""cj: compressed JSON. A small compiler for teaching.

    bytes -> chars -> tokens -> parse tree -> check -> JSON strings

    python3 cj.py examples/people.cj                compile (recursive descent)
    python3 cj.py --parser sr examples/people.cj    compile (shift-reduce)
    python3 cj.py --encode draft.cj                 fill in the CRC column
    python3 cj.py --dump tokens examples/people.cj  stop and show one stage
"""

import argparse
import os
import sys

import backend
import chars
import parse_rd
import parse_sr
import slr
import tokens
import tree
from errors import CjError

PARSERS = {"rd": parse_rd.parse, "sr": parse_sr.parse}
STAGES = ("bytes", "chars", "tokens", "tree", "trace", "table")


def dump_bytes(data):
    for offset in range(0, len(data), 16):
        chunk = data[offset : offset + 16]
        hex_part = " ".join(f"{b:02x}" for b in chunk)
        text_part = "".join(chr(b) if 0x20 <= b < 0x7F else "." for b in chunk)
        print(f"{offset:08x}  {hex_part:<47}  {text_part}")


def dump_chars(decoded):
    for c in decoded:
        print(f"{c.line}:{c.col}\t{c.value!r}\tU+{ord(c.value):04X}\t{c.size} byte(s)")


def dump_tokens(lexed):
    for t in lexed:
        print(f"{t.line}:{t.col}\t{t.kind}\t{t.text}")


def run(args, data):
    """Run the pipeline as far as asked, printing the result."""
    if args.dump == "bytes":
        return dump_bytes(data)

    decoded = chars.decode(data)
    if args.dump == "chars":
        return dump_chars(decoded)

    lexed = tokens.tokenize(decoded)
    if args.dump == "tokens":
        return dump_tokens(lexed)

    parse = PARSERS[args.parser]
    if args.dump == "trace":
        parse(lexed, trace=print)
        return None

    program = parse(lexed)
    if args.dump == "tree":
        print("\n".join(tree.dump(program)))
        return None

    produce = backend.encode_program if args.encode else backend.compile_program
    for line in produce(program):
        print(line)
    return None


def read_input(path):
    if path == "-":
        return sys.stdin.buffer.read()
    with open(path, "rb") as f:
        return f.read()


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Compile compressed JSON (a schema with holes, then rows) to JSON strings."
    )
    parser.add_argument("file", nargs="?", help="input file, or - for stdin")
    parser.add_argument(
        "--parser", choices=sorted(PARSERS), default="rd",
        help="rd = recursive descent (default), sr = shift-reduce",
    )
    parser.add_argument(
        "--dump", choices=STAGES,
        help="show one stage and stop; trace follows --parser, table is the sr tables",
    )
    parser.add_argument(
        "--encode", action="store_true",
        help="print the source with its CRC column filled in",
    )
    args = parser.parse_args(argv)

    # The output is defined as UTF-8, and its CRC depends on that.
    sys.stdout.reconfigure(encoding="utf-8", newline="\n")

    if args.dump == "table":
        print("\n".join(slr.dump(parse_sr.TABLE)))
        return 0
    if args.file is None:
        parser.error("an input file is required")

    label = "<stdin>" if args.file == "-" else args.file
    try:
        run(args, read_input(args.file))
    except CjError as error:
        print(f"{label}:{error}", file=sys.stderr)
        return 1
    except OSError as error:
        print(f"{label}: {error.strerror}", file=sys.stderr)
        return 1
    except RecursionError:
        print(f"{label}: error: nesting is too deep", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    try:
        status = main()
        sys.stdout.flush()
    except BrokenPipeError:  # e.g. piping a dump into head
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
        status = 0
    sys.exit(status)
