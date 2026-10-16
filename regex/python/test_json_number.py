"""Check is_json_number against every case in ../cases.txt.

cases.txt is read when the test runs, so a new case needs no other change.
Each case is a subTest, so one failure does not hide the others.
"""

import pathlib
import re
import unittest

from json_number import is_json_number

CASES = pathlib.Path(__file__).resolve().parent.parent / "cases.txt"


def decode(raw: str) -> str:
    out, i = [], 0
    while i < len(raw):
        if raw[i] != "\\":
            out.append(raw[i])
            i += 1
        elif raw[i + 1 : i + 2] == "\\":
            out.append("\\")
            i += 2
        elif raw[i + 1 : i + 2] == "x" and re.fullmatch("[0-9A-Fa-f]{2}", raw[i + 2 : i + 4]):
            out.append(chr(int(raw[i + 2 : i + 4], 16)))
            i += 4
        else:
            raise ValueError(f"bad escape in {raw!r}")
    return "".join(out)


def load_cases():
    # Split on "\n" only: str.splitlines() would also split on \x0b, \x1c,
    # U+2028 and friends, which the other three languages do not.
    text = CASES.read_text(encoding="utf-8")
    for number, line in enumerate(text.split("\n"), start=1):
        line = line.removesuffix("\r")
        if not line or line.startswith("#"):
            continue
        if line[0] not in "+-" or (len(line) > 1 and line[1] != " "):
            raise ValueError(f"cases.txt:{number}: malformed line {line!r}")
        yield number, line[0] == "+", decode(line[2:])


class JsonNumberTest(unittest.TestCase):
    def test_cases(self):
        cases = list(load_cases())
        self.assertGreater(len(cases), 50)
        for number, expected, text in cases:
            with self.subTest(line=number, text=text):
                self.assertEqual(is_json_number(text), expected)


if __name__ == "__main__":
    unittest.main()
