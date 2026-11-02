"""Stage 3's output: the parse tree both parsers build.

The grammar, in the form the shift-reduce parser uses (`parse_sr.py` has it as
data, and `parse_rd.py` writes the same language as functions):

    program  -> value rows
    rows     -> (empty) | rows row
    row      -> [ ] | [ cells ]
    cells    -> scalar | cells , scalar
    value    -> scalar | HOLE | object | array
    object   -> { } | { members }
    members  -> member | members , member
    member   -> STRING : value
    array    -> [ ] | [ elements ]
    elements -> value | elements , value
    scalar   -> STRING | NUMBER | true | false | null

The first value is the schema. Holes can only appear there, and row cells can
only be scalars, so a hole in a row or a list in a cell is a syntax error.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Scalar:
    kind: str  # STRING, NUMBER, true, false or null
    text: str
    line: int
    col: int


@dataclass(frozen=True)
class Hole:
    index: int
    type: str
    line: int
    col: int


@dataclass(frozen=True)
class Member:
    key: str  # source text of the key, quotes included
    value: object
    line: int
    col: int


@dataclass(frozen=True)
class Object:
    members: tuple
    line: int
    col: int


@dataclass(frozen=True)
class Array:
    items: tuple
    line: int
    col: int


@dataclass(frozen=True)
class Row:
    cells: tuple  # the values, then the CRC
    line: int
    col: int


@dataclass(frozen=True)
class Program:
    schema: object
    rows: tuple


# Both parsers build nodes from tokens through these, so their trees match.


def scalar(token):
    return Scalar(token.kind, token.text, token.line, token.col)


def hole(token):
    return Hole(token.hole[0], token.hole[1], token.line, token.col)


def member(key, value):
    return Member(key.text, value, key.line, key.col)


def object_(opening, members):
    return Object(tuple(members), opening.line, opening.col)


def array(opening, items):
    return Array(tuple(items), opening.line, opening.col)


def row(opening, cells):
    return Row(tuple(cells), opening.line, opening.col)


def program(schema, rows):
    return Program(schema, tuple(rows))


def dump(node, indent=0):
    """Render a tree as indented lines of text."""
    pad = "  " * indent
    if isinstance(node, Program):
        lines = ["Program", "  schema:"] + dump(node.schema, 2) + ["  rows:"]
        for r in node.rows:
            lines += dump(r, 2)
        return lines
    if isinstance(node, Scalar):
        return [f"{pad}{node.kind} {node.text}"]
    if isinstance(node, Hole):
        return [f"{pad}Hole {node.index}:{node.type}"]
    if isinstance(node, Member):
        return [f"{pad}Member {node.key}"] + dump(node.value, indent + 1)
    children = {Object: "members", Array: "items", Row: "cells"}[type(node)]
    lines = [f"{pad}{type(node).__name__}"]
    for child in getattr(node, children):
        lines += dump(child, indent + 1)
    return lines
