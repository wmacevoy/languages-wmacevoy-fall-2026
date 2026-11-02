"""An SLR(1) table builder. It knows nothing about this language.

Input is a list of productions. Output is the two tables a shift-reduce parser
runs on:

    action[state][terminal]    = ("shift", state) | ("reduce", production) | ("accept",)
    goto[state][nonterminal]   = state

The steps are the textbook ones:

1. An *item* is a production with a dot marking how much has been seen:
   `array -> [ . elements ]`. Items are stored as (production index, dot).
2. A *state* is a set of items the parser could be in at once. `closure` adds
   the items implied by a dot just before a nonterminal, and following each
   symbol from a state leads to the next state. That gives the LR(0) automaton.
3. A finished item means "reduce", but only when the next token could follow
   that nonterminal, which is what FOLLOW computes. That lookahead is what
   makes it SLR(1) rather than LR(0).

If one table cell would need two actions the grammar is not SLR(1), and the
builder raises GrammarConflict instead of picking one.
"""

from dataclasses import dataclass, field

EOF = "EOF"
AUGMENTED_START = "$start"


@dataclass(frozen=True)
class Production:
    head: str
    body: tuple
    action: object = field(default=None, compare=False)

    def __str__(self):
        return f"{self.head} -> {' '.join(self.body) or '(empty)'}"


class GrammarConflict(Exception):
    pass


@dataclass
class Table:
    productions: list
    states: list
    action: list
    goto: list


def nullable_and_first(productions, nonterminals):
    """Which nonterminals derive nothing, and FIRST of each nonterminal."""
    nullable = set()
    first = {n: set() for n in nonterminals}
    changed = True
    while changed:
        changed = False
        for p in productions:
            before = len(first[p.head])
            all_nullable = True
            for symbol in p.body:
                if symbol in nonterminals:
                    first[p.head] |= first[symbol]
                    if symbol not in nullable:
                        all_nullable = False
                        break
                else:
                    first[p.head].add(symbol)
                    all_nullable = False
                    break
            if all_nullable and p.head not in nullable:
                nullable.add(p.head)
                changed = True
            changed = changed or len(first[p.head]) != before
    return nullable, first


def follow_sets(productions, nonterminals):
    """FOLLOW of each nonterminal: the terminals that can come right after it."""
    nullable, first = nullable_and_first(productions, nonterminals)
    follow = {n: set() for n in nonterminals}
    follow[AUGMENTED_START].add(EOF)
    changed = True
    while changed:
        changed = False
        for p in productions:
            for i, symbol in enumerate(p.body):
                if symbol not in nonterminals:
                    continue
                before = len(follow[symbol])
                rest_nullable = True
                for after in p.body[i + 1 :]:
                    if after in nonterminals:
                        follow[symbol] |= first[after]
                        if after not in nullable:
                            rest_nullable = False
                            break
                    else:
                        follow[symbol].add(after)
                        rest_nullable = False
                        break
                if rest_nullable:
                    follow[symbol] |= follow[p.head]
                changed = changed or len(follow[symbol]) != before
    return follow


def build(productions, start):
    """Build the SLR(1) tables for `productions`, beginning at `start`."""
    productions = [Production(AUGMENTED_START, (start,))] + list(productions)
    nonterminals = {p.head for p in productions}
    by_head = {}
    for index, p in enumerate(productions):
        by_head.setdefault(p.head, []).append(index)

    def closure(items):
        result = set(items)
        pending = list(items)
        while pending:
            index, dot = pending.pop()
            body = productions[index].body
            if dot < len(body) and body[dot] in nonterminals:
                for added in by_head[body[dot]]:
                    if (added, 0) not in result:
                        result.add((added, 0))
                        pending.append((added, 0))
        return frozenset(result)

    def next_symbols(state):
        """The symbols right after a dot, in a repeatable order."""
        symbols = []
        for index, dot in sorted(state):
            body = productions[index].body
            if dot < len(body) and body[dot] not in symbols:
                symbols.append(body[dot])
        return symbols

    def advance(state, symbol):
        moved = [
            (index, dot + 1)
            for index, dot in state
            if dot < len(productions[index].body) and productions[index].body[dot] == symbol
        ]
        return closure(moved)

    # The LR(0) automaton, numbered in the order the states are discovered.
    states = [closure([(0, 0)])]
    numbers = {states[0]: 0}
    edges = []
    for state in states:  # the list grows as the loop runs
        edges.append({})
        for symbol in next_symbols(state):
            target = advance(state, symbol)
            if target not in numbers:
                numbers[target] = len(states)
                states.append(target)
            edges[-1][symbol] = numbers[target]

    follow = follow_sets(productions, nonterminals)
    action = [{} for _ in states]
    goto = [{} for _ in states]

    def set_action(number, terminal, entry):
        existing = action[number].get(terminal)
        if existing is not None and existing != entry:
            raise GrammarConflict(
                f"state {number} on {terminal}: {describe(existing, productions)} "
                f"vs {describe(entry, productions)}"
            )
        action[number][terminal] = entry

    for number, state in enumerate(states):
        for symbol, target in edges[number].items():
            if symbol in nonterminals:
                goto[number][symbol] = target
            else:
                set_action(number, symbol, ("shift", target))
        for index, dot in sorted(state):
            p = productions[index]
            if dot == len(p.body):
                if index == 0:
                    set_action(number, EOF, ("accept",))
                else:
                    for terminal in sorted(follow[p.head]):
                        set_action(number, terminal, ("reduce", index))

    return Table(productions, states, action, goto)


def describe(entry, productions):
    if entry[0] == "shift":
        return f"shift {entry[1]}"
    if entry[0] == "reduce":
        return f"reduce {productions[entry[1]]}"
    return "accept"


def show_item(item, productions):
    index, dot = item
    p = productions[index]
    return f"{p.head} -> {' '.join(p.body[:dot] + ('.',) + p.body[dot:])}"


def dump(table):
    """Render the productions, states and tables as lines of text."""
    lines = ["Productions:"]
    for index, p in enumerate(table.productions):
        lines.append(f"  {index:2}  {p}")
    for number, state in enumerate(table.states):
        lines.append("")
        lines.append(f"State {number}:")
        for item in sorted(state):
            lines.append(f"    {show_item(item, table.productions)}")
        for terminal, entry in table.action[number].items():
            lines.append(f"  on {terminal}: {describe(entry, table.productions)}")
        for nonterminal, target in table.goto[number].items():
            lines.append(f"  goto {nonterminal}: {target}")
    return lines
