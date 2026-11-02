"""Stage 3, version B: tokens -> parse tree by shift-reduce.

The grammar is data, and slr.py turns it into tables. The driver at the bottom
is one loop with an explicit stack that does one of three things each step:

    shift    push the next token and move to a new state
    reduce   the top of the stack is a whole rule's body: pop it, build the
             node with the rule's action, and push the result
    accept   the whole input is a program

Recursive descent decides which rule it is in *before* reading it. Shift-reduce
decides *after* reading it. That is why this grammar can use left recursion
(`rows -> rows row`) directly, and why the two `[` forms need no special care:
a `[` after the schema is a row and a `[` inside the schema is an array, because
the parser is in a different state for each.
"""

import slr
import tree
from tokens import unexpected


def snoc(items, item):
    """Append and return the list. Left-recursive rules build lists this way."""
    items.append(item)
    return items


# Each rule is "head -> body" plus what to build from the popped symbols.
RULES = [
    ("program -> value rows", lambda schema, rows: tree.program(schema, rows)),
    ("rows ->", lambda: []),
    ("rows -> rows row", snoc),
    ("row -> [ ]", lambda opening, _: tree.row(opening, [])),
    ("row -> [ cells ]", lambda opening, cells, _: tree.row(opening, cells)),
    ("cells -> scalar", lambda cell: [cell]),
    ("cells -> cells , scalar", lambda cells, _, cell: snoc(cells, cell)),
    ("value -> scalar", lambda value: value),
    ("value -> HOLE", tree.hole),
    ("value -> object", lambda value: value),
    ("value -> array", lambda value: value),
    ("object -> { }", lambda opening, _: tree.object_(opening, [])),
    ("object -> { members }", lambda opening, members, _: tree.object_(opening, members)),
    ("members -> member", lambda member: [member]),
    ("members -> members , member", lambda members, _, member: snoc(members, member)),
    ("member -> STRING : value", lambda key, _, value: tree.member(key, value)),
    ("array -> [ ]", lambda opening, _: tree.array(opening, [])),
    ("array -> [ elements ]", lambda opening, items, _: tree.array(opening, items)),
    ("elements -> value", lambda item: [item]),
    ("elements -> elements , value", lambda items, _, item: snoc(items, item)),
    ("scalar -> STRING", tree.scalar),
    ("scalar -> NUMBER", tree.scalar),
    ("scalar -> true", tree.scalar),
    ("scalar -> false", tree.scalar),
    ("scalar -> null", tree.scalar),
]


def productions():
    result = []
    for text, action in RULES:
        head, body = text.split("->")
        result.append(slr.Production(head.strip(), tuple(body.split()), action))
    return result


TABLE = slr.build(productions(), "program")


def can_continue(states, terminal):
    """Would `terminal` eventually be shifted from this stack?

    SLR tables can reduce on a token that is not really legal here, because
    FOLLOW merges every context a nonterminal appears in. Trying each terminal
    on a copy of the stack gives the exact list for the error message.
    """
    states = list(states)
    while True:
        entry = TABLE.action[states[-1]].get(terminal)
        if entry is None:
            return False
        if entry[0] != "reduce":
            return True
        p = TABLE.productions[entry[1]]
        if p.body:
            del states[-len(p.body) :]
        states.append(TABLE.goto[states[-1]][p.head])


def expected_terminals(states):
    terminals = {t for row in TABLE.action for t in row}
    return {t for t in terminals if can_continue(states, t)}


def parse(tokens, trace=None):
    """Turn a token list into a tree.Program, or raise CjError."""
    states = [0]  # the stack of parser states
    values = []  # the tokens and nodes those states stand for
    symbols = []  # their grammar symbols; only tracing reads these
    i = 0
    while True:
        token = tokens[i]
        entry = TABLE.action[states[-1]].get(token.kind)
        if entry is None:
            raise unexpected(token, expected_terminals(states))

        if trace is not None:
            trace(
                f"{' '.join(symbols) or '(empty)':<44} | {token.kind:<7} | "
                f"{slr.describe(entry, TABLE.productions)}"
            )

        if entry[0] == "shift":
            states.append(entry[1])
            values.append(token)
            symbols.append(token.kind)
            i += 1
        elif entry[0] == "reduce":
            p = TABLE.productions[entry[1]]
            size = len(p.body)
            popped = values[-size:] if size else []
            if size:
                del states[-size:], values[-size:], symbols[-size:]
            values.append(p.action(*popped))
            symbols.append(p.head)
            states.append(TABLE.goto[states[-1]][p.head])
        else:
            return values[0]
