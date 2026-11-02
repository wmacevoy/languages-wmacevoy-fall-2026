"""Stage 2: chars -> tokens.

Token kinds:

    {  }  [  ]  ,  :         punctuation; the kind is the character
    true  false  null        keywords; the kind is the word
    STRING  NUMBER           JSON literals
    HOLE                     ${index:type}, one token even though it has parts
    EOF                      end of input, so parsers always have a next token

A token keeps its exact source text. The compiler copies that text to the
output, so 1e3 stays 1e3 and "Zo\\u00eb" stays escaped. Nothing goes through a
float or a decoded string, which keeps the CRC stable.

Digits are tested against "0123456789" rather than with str.isdigit, because
isdigit also accepts characters like the Arabic-Indic digit three, and JSON
does not.
"""

from dataclasses import dataclass

from errors import CjError

DIGITS = "0123456789"
HEX_DIGITS = "0123456789abcdefABCDEF"
LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
WHITESPACE = " \t\n\r"
PUNCTUATION = "{}[],:"
KEYWORDS = ("true", "false", "null")
HOLE_TYPES = ("int", "number", "string", "bool", "null")
SIMPLE_ESCAPES = '"\\/bfnrt'
MAX_HOLE_INDEX_DIGITS = 6


@dataclass(frozen=True)
class Token:
    kind: str
    text: str
    line: int
    col: int
    hole: tuple = None  # (index, type), only on HOLE tokens


def describe_kind(kind):
    """How a token kind reads in an error message."""
    return {"STRING": "string", "NUMBER": "number", "HOLE": "hole", "EOF": "end of input"}.get(
        kind, f"'{kind}'"
    )


def unexpected(token, expected):
    """The syntax error for `token`. Both parsers build their errors here."""
    wanted = sorted(describe_kind(kind) for kind in expected)
    if len(wanted) > 1:
        wanted_text = ", ".join(wanted[:-1]) + " or " + wanted[-1]
    else:
        wanted_text = wanted[0]
    got = "end of input" if token.kind == "EOF" else token.text
    return CjError("syntax", f"expected {wanted_text}, got {got}", token.line, token.col)


class Lexer:
    def __init__(self, chars):
        self.chars = chars
        self.i = 0
        if not chars:
            self.end = (1, 1)
        elif chars[-1].value == "\n":
            self.end = (chars[-1].line + 1, 1)
        else:
            self.end = (chars[-1].line, chars[-1].col + 1)

    def peek(self):
        """The next character, or "" at the end of input."""
        return self.chars[self.i].value if self.i < len(self.chars) else ""

    def where(self):
        if self.i < len(self.chars):
            return self.chars[self.i].line, self.chars[self.i].col
        return self.end

    def error(self, message, at=None):
        line, col = at or self.where()
        return CjError("lexical", message, line, col)

    def accept_all(self, allowed):
        """Consume characters while they are in `allowed`; return how many."""
        count = 0
        while self.peek() and self.peek() in allowed:
            self.i += 1
            count += 1
        return count

    def text_from(self, start):
        return "".join(c.value for c in self.chars[start : self.i])

    def run(self):
        tokens = []
        while True:
            self.accept_all(WHITESPACE)
            start = self.where()
            c = self.peek()
            if c == "":
                tokens.append(Token("EOF", "", *start))
                return tokens
            if c in PUNCTUATION:
                self.i += 1
                tokens.append(Token(c, c, *start))
            elif c == '"':
                tokens.append(self.string(start))
            elif c == "-" or c in DIGITS:
                tokens.append(self.number(start))
            elif c in LETTERS:
                tokens.append(self.word(start))
            elif c == "$":
                tokens.append(self.hole(start))
            else:
                raise self.error(f"unexpected character {c!r} (U+{ord(c):04X})")

    def string(self, start):
        first = self.i
        self.i += 1  # opening quote
        while True:
            c = self.peek()
            if c == "":
                raise self.error("unterminated string", at=start)
            if c == '"':
                self.i += 1
                return Token("STRING", self.text_from(first), *start)
            if ord(c) < 0x20:
                raise self.error(f"control character U+{ord(c):04X} in string; escape it")
            self.i += 1
            if c == "\\":
                self.escape()

    def escape(self):
        c = self.peek()
        if c == "":
            return  # the string loop reports it as unterminated
        if c == "u":
            self.i += 1
            for _ in range(4):
                if not self.peek() or self.peek() not in HEX_DIGITS:
                    raise self.error("expected 4 hex digits after \\u")
                self.i += 1
        elif c in SIMPLE_ESCAPES:
            self.i += 1
        else:
            raise self.error(f"invalid escape \\{c}")

    def number(self, start):
        first = self.i
        if self.peek() == "-":
            self.i += 1
        if self.peek() == "0":
            self.i += 1
            if self.peek() and self.peek() in DIGITS:
                raise self.error("numbers cannot have leading zeros")
        elif self.accept_all(DIGITS) == 0:
            raise self.error("expected a digit after '-'")
        if self.peek() == ".":
            self.i += 1
            if self.accept_all(DIGITS) == 0:
                raise self.error("expected a digit after '.'")
        if self.peek() and self.peek() in "eE":
            self.i += 1
            if self.peek() and self.peek() in "+-":
                self.i += 1
            if self.accept_all(DIGITS) == 0:
                raise self.error("expected a digit in the exponent")
        return Token("NUMBER", self.text_from(first), *start)

    def word(self, start):
        first = self.i
        self.accept_all(LETTERS)
        text = self.text_from(first)
        if text not in KEYWORDS:
            raise self.error(f"unknown word '{text}'", at=start)
        return Token(text, text, *start)

    def hole(self, start):
        first = self.i
        self.i += 1  # $
        self.require("{", "expected '{' after '$'")
        digits_at = self.i
        if self.peek() == "0":
            self.i += 1
        elif self.accept_all(DIGITS) == 0:
            raise self.error("expected a hole index")
        digits = self.text_from(digits_at)
        if len(digits) > MAX_HOLE_INDEX_DIGITS:
            raise self.error("hole index is too large", at=start)
        self.require(":", "expected ':' after the hole index")
        type_at = self.i
        type_start = self.where()
        self.accept_all(LETTERS)
        hole_type = self.text_from(type_at)
        if hole_type not in HOLE_TYPES:
            raise self.error(
                f"unknown hole type '{hole_type}'; use one of {', '.join(HOLE_TYPES)}",
                at=type_start,
            )
        self.require("}", "expected '}' to close the hole")
        return Token("HOLE", self.text_from(first), *start, hole=(int(digits), hole_type))

    def require(self, c, message):
        if self.peek() != c:
            raise self.error(message)
        self.i += 1


def tokenize(chars):
    """Turn a list of Char into a list of Token ending in EOF."""
    return Lexer(chars).run()
