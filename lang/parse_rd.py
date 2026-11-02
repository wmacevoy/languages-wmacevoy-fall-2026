"""Stage 3, version A: tokens -> parse tree by recursive descent.

There is one function per grammar rule, and the program's own call stack
remembers where it is. Each function looks at the next token to decide what to
do. The left-recursive rules (`rows -> rows row`) become loops, because a
function that called itself first would never return.

Compare with parse_sr.py, which accepts the same language with an explicit
stack and a table. The tests hold them to the same trees and the same errors.
"""

import functools

import tree
from tokens import unexpected

SCALARS = {"STRING", "NUMBER", "true", "false", "null"}
VALUE_START = SCALARS | {"HOLE", "{", "["}


def rule(method):
    """Log each rule on entry when tracing, indented by call depth."""

    @functools.wraps(method)
    def traced(self):
        if self.trace is None:
            return method(self)
        token = self.current()
        self.trace(f"{'  ' * self.depth}{method.__name__}  (next: {token.text or 'EOF'})")
        self.depth += 1
        try:
            return method(self)
        finally:
            self.depth -= 1

    return traced


class Parser:
    def __init__(self, tokens, trace=None):
        self.tokens = tokens
        self.i = 0
        self.trace = trace
        self.depth = 0

    def current(self):
        return self.tokens[self.i]

    def at(self, kind):
        return self.current().kind == kind

    def advance(self):
        token = self.current()
        self.i += 1
        return token

    def expect(self, kind, *alternatives):
        """Consume `kind`. The alternatives only add to the error message:
        they are what the caller would also have accepted here."""
        if not self.at(kind):
            raise unexpected(self.current(), {kind, *alternatives})
        return self.advance()

    # program -> value rows
    @rule
    def program(self):
        schema = self.value()
        rows = self.rows()
        return tree.program(schema, rows)

    # rows -> (empty) | rows row
    @rule
    def rows(self):
        rows = []
        while self.at("["):
            rows.append(self.row())
        self.expect("EOF", "[")
        return rows

    # row -> [ ] | [ cells ]
    # cells -> scalar | cells , scalar
    @rule
    def row(self):
        opening = self.expect("[")
        cells = []
        if self.at("]"):
            self.advance()
            return tree.row(opening, cells)
        if self.current().kind not in SCALARS:
            raise unexpected(self.current(), SCALARS | {"]"})
        cells.append(self.scalar())
        while self.at(","):
            self.advance()
            cells.append(self.scalar())
        self.expect("]", ",")
        return tree.row(opening, cells)

    # value -> scalar | HOLE | object | array
    @rule
    def value(self):
        kind = self.current().kind
        if kind == "{":
            return self.object()
        if kind == "[":
            return self.array()
        if kind == "HOLE":
            return tree.hole(self.advance())
        if kind in SCALARS:
            return self.scalar()
        raise unexpected(self.current(), VALUE_START)

    # object -> { } | { members }
    # members -> member | members , member
    @rule
    def object(self):
        opening = self.expect("{")
        members = []
        if self.at("}"):
            self.advance()
            return tree.object_(opening, members)
        if not self.at("STRING"):
            raise unexpected(self.current(), {"STRING", "}"})
        members.append(self.member())
        while self.at(","):
            self.advance()
            members.append(self.member())
        self.expect("}", ",")
        return tree.object_(opening, members)

    # member -> STRING : value
    @rule
    def member(self):
        key = self.expect("STRING")
        self.expect(":")
        return tree.member(key, self.value())

    # array -> [ ] | [ elements ]
    # elements -> value | elements , value
    @rule
    def array(self):
        opening = self.expect("[")
        items = []
        if self.at("]"):
            self.advance()
            return tree.array(opening, items)
        if self.current().kind not in VALUE_START:
            raise unexpected(self.current(), VALUE_START | {"]"})
        items.append(self.value())
        while self.at(","):
            self.advance()
            items.append(self.value())
        self.expect("]", ",")
        return tree.array(opening, items)

    # scalar -> STRING | NUMBER | true | false | null
    @rule
    def scalar(self):
        if self.current().kind not in SCALARS:
            raise unexpected(self.current(), SCALARS)
        return tree.scalar(self.advance())


def parse(tokens, trace=None):
    """Turn a token list into a tree.Program, or raise CjError."""
    return Parser(tokens, trace).program()
