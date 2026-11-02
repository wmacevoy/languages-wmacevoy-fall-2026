"""Stage 1: bytes -> chars.

A file is bytes, but a language is defined over characters. This stage is a
strict UTF-8 decoder written out by hand so the step is visible: `bytes.decode`
would do the same job in one call (the tests check that they agree).

    lead byte   bytes  payload bits  smallest legal code point
    0xxxxxxx    1      7             U+0000
    110xxxxx    2      5 + 6         U+0080
    1110xxxx    3      4 + 6 + 6     U+0800
    11110xxx    4      3 + 6 + 6 + 6 U+10000

Every following byte must look like 10xxxxxx. Each character remembers its line
and column, which is how a later stage can point at the source.
"""

from dataclasses import dataclass

from errors import CjError


@dataclass(frozen=True)
class Char:
    value: str
    line: int
    col: int
    offset: int  # position of the first byte
    size: int  # how many bytes encoded it


def decode(data):
    """Turn bytes into a list of Char, or raise CjError on invalid UTF-8."""
    chars = []
    line, col = 1, 1
    i = 0

    def bad(message):
        return CjError("encoding", f"{message} at byte {i}", line, col)

    while i < len(data):
        lead = data[i]
        if lead < 0x80:
            extra, smallest, code = 0, 0, lead
        elif lead & 0b1110_0000 == 0b1100_0000:
            extra, smallest, code = 1, 0x80, lead & 0b0001_1111
        elif lead & 0b1111_0000 == 0b1110_0000:
            extra, smallest, code = 2, 0x800, lead & 0b0000_1111
        elif lead & 0b1111_1000 == 0b1111_0000:
            extra, smallest, code = 3, 0x10000, lead & 0b0000_0111
        else:
            raise bad(f"invalid UTF-8 lead byte 0x{lead:02x}")

        for k in range(1, extra + 1):
            if i + k >= len(data):
                raise bad("truncated UTF-8 sequence")
            following = data[i + k]
            if following & 0b1100_0000 != 0b1000_0000:
                raise bad(f"invalid UTF-8 continuation byte 0x{following:02x}")
            code = (code << 6) | (following & 0b0011_1111)

        if code < smallest:
            raise bad("overlong UTF-8 encoding")
        if 0xD800 <= code <= 0xDFFF:
            raise bad("UTF-8 encoded surrogate")
        if code > 0x10FFFF:
            raise bad("code point beyond U+10FFFF")

        value = chr(code)
        chars.append(Char(value, line, col, i, extra + 1))
        i += extra + 1
        if value == "\n":
            line, col = line + 1, 1
        else:
            col += 1
    return chars
