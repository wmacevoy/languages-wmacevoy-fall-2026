"""Recognize a JSON number (RFC 8259, section 6) with a regular expression.

Regex notation used below:

    -?          an optional "-" (? = zero or one of the thing before it)
    [1-9]       one character from the set: a digit 1 through 9
    [0-9]*      zero or more digits (* = zero or more)
    [0-9]+      one or more digits (+ = one or more)
    [eE]        "e" or "E"
    [+-]?       an optional "+" or "-"
    \\.          a literal "." (a bare "." would match any character)
    a|b         a or b
    (?:...)     a group: treats ... as one unit, so ?, * or | can apply to
                the whole of it. The "?:" makes it non-capturing -- plain
                (...) would also save the matched text for later retrieval,
                which this code never asks for.

Read as a whole:

    -?                          optional minus sign
    (?:0|[1-9][0-9]*)           integer part: "0", or a digit 1-9 then any digits
    (?:\\.[0-9]+)?               optional fraction: "." then at least one digit
    (?:[eE][+-]?[0-9]+)?        optional exponent: e/E, optional sign, digits
"""

import re

# r"..." is a raw string: Python leaves backslashes alone, so the regex
# engine receives \. as written. Without the r, you would have to write \\.
#
# [0-9], not \d: on a str, \d also matches Arabic-Indic, fullwidth and every
# other Unicode decimal digit.
JSON_NUMBER = re.compile(r"-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?")


def is_json_number(text: str) -> bool:
    # fullmatch, not match + "$": "$" also matches before a trailing "\n".
    return JSON_NUMBER.fullmatch(text) is not None
