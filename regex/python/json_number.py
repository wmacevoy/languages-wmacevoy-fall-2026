"""Recognize a JSON number (RFC 8259, section 6) with a regular expression."""

import re

# [0-9], not \d: on a str, \d also matches Arabic-Indic, fullwidth and every
# other Unicode decimal digit.
JSON_NUMBER = re.compile(r"-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?")


def is_json_number(text: str) -> bool:
    # fullmatch, not match + "$": "$" also matches before a trailing "\n".
    return JSON_NUMBER.fullmatch(text) is not None
