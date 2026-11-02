"""Tests for the cj compiler. Run with: python3 -m unittest

The two parsers are run against each other: on any input they must build equal
trees or report the same error at the same place. Independent oracles check the
rest: Python's own UTF-8 decoder for stage 1, and json.loads for the output.
"""

import json
import os
import random
import subprocess
import sys
import unittest
import zlib

import backend
import chars
import parse_rd
import parse_sr
import slr
import tokens
from errors import CjError

HERE = os.path.dirname(os.path.abspath(__file__))
PEOPLE = os.path.join(HERE, "examples", "people.cj")
PARSERS = {"rd": parse_rd.parse, "sr": parse_sr.parse}

# A backslash-u escape as source text: six characters, not the letter it names.
ESCAPED_E = chr(92) + "u00eb"


def read_people():
    with open(PEOPLE, encoding="utf-8") as f:
        return f.read()


def lex(source):
    data = source.encode("utf-8") if isinstance(source, str) else source
    return tokens.tokenize(chars.decode(data))


def kinds(source):
    return [t.kind for t in lex(source)]


def outcome(parse, source):
    """A parse result in a form two parsers can be compared on."""
    try:
        return ("tree", parse(lex(source)))
    except CjError as error:
        return ("error", error.stage, error.message, error.line, error.col)


def compile_source(source, parser="rd"):
    return backend.compile_program(PARSERS[parser](lex(source)))


def encode_source(source, parser="rd"):
    return backend.encode_program(PARSERS[parser](lex(source)))


def crc(text):
    return f"{zlib.crc32(text.encode('utf-8')):08x}"


class Stage1Chars(unittest.TestCase):
    def test_tracks_line_column_offset_and_size(self):
        decoded = chars.decode('ë\nx'.encode("utf-8"))
        self.assertEqual(
            [(c.value, c.line, c.col, c.offset, c.size) for c in decoded],
            [("ë", 1, 1, 0, 2), ("\n", 1, 2, 2, 1), ("x", 2, 1, 3, 1)],
        )

    def test_all_sequence_lengths(self):
        text = "aé€\U0001f600"
        self.assertEqual("".join(c.value for c in chars.decode(text.encode())), text)
        self.assertEqual([c.size for c in chars.decode(text.encode())], [1, 2, 3, 4])

    def test_boundary_code_points(self):
        for code in (0, 0x7F, 0x80, 0x7FF, 0x800, 0xD7FF, 0xE000, 0xFFFF, 0x10000, 0x10FFFF):
            text = chr(code)
            self.assertEqual(chars.decode(text.encode())[0].value, text)

    def test_rejects_invalid_utf8(self):
        bad = {
            "lead byte": b"\xff",
            "stray continuation": b"\x80",
            "truncated": b"\xc3",
            "bad continuation": b"\xc3(",
            "overlong": b"\xc0\xaf",
            "overlong 3": b"\xe0\x80\xaf",
            "surrogate": b"\xed\xa0\x80",
            "too large": b"\xf4\x90\x80\x80",
        }
        for name, data in bad.items():
            with self.subTest(name), self.assertRaises(CjError) as caught:
                chars.decode(data)
            self.assertEqual(caught.exception.stage, "encoding")

    def test_error_location_counts_characters(self):
        with self.assertRaises(CjError) as caught:
            chars.decode("ë\nab\xff".encode("latin-1").replace(b"\xeb", b"\xc3\xab"))
        self.assertEqual((caught.exception.line, caught.exception.col), (2, 3))

    def test_agrees_with_python_on_random_bytes(self):
        rng = random.Random(330)
        # Mostly bytes near the interesting boundaries, so sequences often form.
        pool = [0x41, 0x7F, 0x80, 0x8F, 0x90, 0x9F, 0xA0, 0xBF, 0xC0, 0xC1, 0xC2, 0xDF,
                0xE0, 0xE1, 0xEC, 0xED, 0xEE, 0xEF, 0xF0, 0xF1, 0xF3, 0xF4, 0xF5, 0xFF]
        valid = 0
        for _ in range(20000):
            data = bytes(rng.choice(pool) for _ in range(rng.randint(0, 6)))
            try:
                expected = data.decode("utf-8")
            except UnicodeDecodeError:
                expected = None
            try:
                got = "".join(c.value for c in chars.decode(data))
            except CjError:
                got = None
            self.assertEqual(got, expected, data.hex())
            valid += expected is not None
        self.assertGreater(valid, 1000)  # the test must exercise both outcomes


class Stage2Tokens(unittest.TestCase):
    def test_kinds(self):
        self.assertEqual(
            kinds('{ "a" : [1, true, false, null, ${0:int}] }'),
            ["{", "STRING", ":", "[", "NUMBER", ",", "true", ",", "false", ",",
             "null", ",", "HOLE", "]", "}", "EOF"],
        )

    def test_hole_is_one_token(self):
        token = lex("${12:string}")[0]
        self.assertEqual((token.kind, token.text, token.hole),
                         ("HOLE", "${12:string}", (12, "string")))

    def test_positions(self):
        self.assertEqual([(t.line, t.col) for t in lex('[\n  1]')],
                         [(1, 1), (2, 3), (2, 4), (2, 5)])

    def test_eof_position_after_trailing_newline(self):
        token = lex("1\n")[-1]
        self.assertEqual((token.kind, token.line, token.col), ("EOF", 2, 1))

    def test_valid_numbers_keep_their_text(self):
        for text in ("0", "-0", "7", "-12", "1.5", "0.25", "1e3", "1E+3", "1e-3", "-1.5e10"):
            token = lex(text)[0]
            self.assertEqual((token.kind, token.text), ("NUMBER", text))

    def test_invalid_numbers(self):
        for text in ("01", "-", "1.", ".5", "1e", "1e+", "+1", "-x", chr(0x663)):
            with self.subTest(text), self.assertRaises(CjError) as caught:
                lex(text)
            self.assertEqual(caught.exception.stage, "lexical")

    def test_strings_keep_their_escapes(self):
        for text in (r'""', r'"a"', r'"\" \\ \/ \b \f \n \r \t"', f'"{ESCAPED_E}"', '"Zoë 😀"'):
            token = lex(text)[0]
            self.assertEqual((token.kind, token.text), ("STRING", text))

    def test_invalid_strings(self):
        for text in ('"', '"abc', '"\\', r'"\x"', r'"\u12"', r'"\u123"', r'"\u12G4"', '"a\nb"', '"a\tb"'):
            with self.subTest(text), self.assertRaises(CjError) as caught:
                lex(text)
            self.assertEqual(caught.exception.stage, "lexical")

    def test_invalid_holes(self):
        for text in ("$", "$0", "${", "${}", "${x:int}", "${01:int}", "${0}", "${0:}",
                     "${0:float}", "${0:int", "${ 0:int}", "${0: int}", "${0:int }",
                     "${9999999:int}"):
            with self.subTest(text), self.assertRaises(CjError) as caught:
                lex(text)
            self.assertEqual(caught.exception.stage, "lexical")

    def test_invalid_words_and_characters(self):
        for text in ("True", "nul", "nullx", "@", "é", chr(0xFEFF) + "1", chr(0xA0) + "1"):
            with self.subTest(text), self.assertRaises(CjError) as caught:
                lex(text)
            self.assertEqual(caught.exception.stage, "lexical")


# Each entry: source, and text the error message from both parsers must contain.
SYNTAX_ERRORS = [
    ("", "expected"),
    ("}", "expected"),
    ('{"a"}', "expected ':', got }"),
    ('{"a":}', "expected"),
    ('{"a":1,}', "expected string, got }"),
    ('{1:2}', "expected '}' or string, got 1"),
    ('{"a":1 "b":2}', "expected ',' or '}', got \"b\""),
    ("[1,]", "expected"),
    ("[1 2]", "expected ',' or ']', got 2"),
    ("[", "expected"),
    ("1 2", "expected '[' or end of input, got 2"),
    ("1 [1", "expected ',' or ']', got end of input"),
    ("1 [1,", "got end of input"),
    ("1 [1,]", "got ]"),
    ("1 {}", "expected '[' or end of input, got {"),
    ("1 [[1]]", "got ["),
    ('1 [{"a":1}]', "got {"),
    ("1 [${0:int}]", "got ${0:int}"),
    ("1 [1,${0:int}]", "got ${0:int}"),
    ("1 [1] 2", "expected '[' or end of input, got 2"),
    ("1 [1]]", "got ]"),
    ('{"a":${0:int}} ["x"] ,', "got ,"),
    ('{"a":[1,{"b":[}]}', "got }"),
]

VALID_PROGRAMS = [
    "1",
    "null",
    '"x"',
    "${0:int}",
    "[]",
    "{}",
    "[[],[[]],{}]",
    '{"a":{"b":{"c":[1,[2,[3,${0:int}]]]}}}',
    "[] []",
    "[] [] [] []",
    "[[1]] [1]",
    '[${0:int},${1:string}] [1,"a","crc"] [2,"b","crc"]',
    read_people(),
]


class Stage3Parsers(unittest.TestCase):
    def test_the_table_has_no_conflicts_and_they_are_detected(self):
        # The table built at import, or that import would have failed.
        self.assertGreater(len(parse_sr.TABLE.states), 10)
        ambiguous = [
            slr.Production("e", ("e", "+", "e")),
            slr.Production("e", ("n",)),
        ]
        with self.assertRaises(slr.GrammarConflict):
            slr.build(ambiguous, "e")

    def test_syntax_errors(self):
        for source, message in SYNTAX_ERRORS:
            for name, parse in PARSERS.items():
                with self.subTest(source=source, parser=name):
                    result = outcome(parse, source)
                    self.assertEqual(result[:2], ("error", "syntax"))
                    self.assertIn(message, result[2])

    def test_parsers_agree_on_valid_programs(self):
        for source in VALID_PROGRAMS:
            with self.subTest(source):
                rd = outcome(parse_rd.parse, source)
                self.assertEqual(rd[0], "tree")
                self.assertEqual(rd, outcome(parse_sr.parse, source))

    def test_parsers_agree_on_syntax_errors(self):
        for source, _ in SYNTAX_ERRORS:
            with self.subTest(source):
                self.assertEqual(outcome(parse_rd.parse, source),
                                 outcome(parse_sr.parse, source))

    def test_parsers_agree_on_random_token_soup(self):
        rng = random.Random(330)
        pieces = ["{", "}", "[", "]", ",", ":", '"k"', "1", "true", "null", "${0:int}"]
        trees = 0
        for _ in range(20000):
            source = " ".join(rng.choice(pieces) for _ in range(rng.randint(0, 12)))
            rd = outcome(parse_rd.parse, source)
            self.assertEqual(rd, outcome(parse_sr.parse, source), source)
            trees += rd[0] == "tree"
        self.assertGreater(trees, 100)

    def test_parsers_agree_on_mutated_programs(self):
        rng = random.Random(331)
        base = lex(read_people())[:-1]
        pieces = ["{", "}", "[", "]", ",", ":", '"k"', "1", "true", "null", "${0:int}"]
        for _ in range(5000):
            words = [t.text for t in base]
            for _ in range(rng.randint(1, 3)):
                at = rng.randrange(len(words))
                choice = rng.randint(0, 2)
                if choice == 0:
                    del words[at]
                elif choice == 1:
                    words.insert(at, rng.choice(pieces))
                else:
                    words[at] = rng.choice(pieces)
            source = " ".join(words)
            self.assertEqual(outcome(parse_rd.parse, source),
                             outcome(parse_sr.parse, source), source)

    def test_tracing_does_not_change_the_result(self):
        source = read_people()
        for parse in PARSERS.values():
            lines = []
            self.assertEqual(parse(lex(source), trace=lines.append), parse(lex(source)))
            self.assertGreater(len(lines), 10)


class Stage4And5Backend(unittest.TestCase):
    def both(self, source):
        results = [compile_source(source, name) for name in PARSERS]
        self.assertEqual(results[0], results[1])
        return results[0]

    def check_error(self, source, message):
        for name in PARSERS:
            with self.subTest(parser=name), self.assertRaises(CjError) as caught:
                compile_source(source, name)
            self.assertEqual(caught.exception.stage, "check")
            self.assertIn(message, caught.exception.message)
        return caught.exception

    def test_the_example(self):
        source = read_people()
        self.assertEqual(self.both(source), [
            '{"id":1,"name":"ada","at":{"x":1.5,"y":-2},"tags":["new"],"ok":true}',
            '{"id":2,"name":"Zoë","at":{"x":0,"y":4.25},"tags":["new"],"ok":false}',
        ])

    def test_no_rows_means_no_output(self):
        self.assertEqual(self.both('{"a":${0:int}}'), [])

    def test_no_holes(self):
        output = '{"a":1}'
        self.assertEqual(self.both(f'{output} ["{crc(output)}"]'), [output])

    def test_repeated_hole_uses_one_value(self):
        output = '[7,7]'
        self.assertEqual(self.both(f'[${{0:int}},${{0:int}}] [7,"{crc(output)}"]'), [output])

    def test_whitespace_in_source_does_not_reach_the_output(self):
        output = '{"a":[1,2]}'
        source = f'{{ "a" :\n\t[ 1 ,\r\n 2 ] }}\n\n[ "{crc(output)}" ]\n'
        self.assertEqual(self.both(source), [output])

    def test_literal_text_is_preserved(self):
        output = f'["Zo{ESCAPED_E}",1e3,1.50]'
        source = f'[${{0:string}},${{1:number}},1.50] ["Zo{ESCAPED_E}",1e3,"{crc(output)}"]'
        self.assertEqual(self.both(source), [output])

    def test_every_type_accepts_its_values(self):
        cases = [("int", "-3"), ("number", "3"), ("number", "2.5e1"), ("string", '"s"'),
                 ("bool", "true"), ("bool", "false"), ("null", "null")]
        for hole_type, value in cases:
            with self.subTest(hole_type, value=value):
                output = f"[{value}]"
                self.assertEqual(
                    self.both(f'[${{0:{hole_type}}}] [{value},"{crc(output)}"]'), [output])

    def test_every_type_rejects_other_values(self):
        cases = [("int", "1.5"), ("int", "1e3"), ("int", '"1"'), ("number", '"1"'),
                 ("number", "true"), ("string", "1"), ("string", "null"), ("bool", "1"),
                 ("bool", '"true"'), ("bool", "null"), ("null", "0"), ("null", "false")]
        for hole_type, value in cases:
            with self.subTest(hole_type, value=value):
                self.check_error(f'[${{0:{hole_type}}}] [{value},"00000000"]',
                                 f"expected {hole_type} for hole 0")

    def test_type_error_points_at_the_cell(self):
        error = self.check_error('[${0:number}]\n["x","00000000"]', "expected number for hole 0")
        self.assertEqual((error.line, error.col), (2, 2))

    def test_wrong_column_counts(self):
        self.check_error('[${0:int}] []', "row has 0 columns; expected 2")
        self.check_error('[${0:int}] ["00000000"]', "row has 1 columns; expected 2")
        self.check_error('[${0:int}] [1,2,"00000000"]', "row has 3 columns; expected 2")
        self.check_error('1 []', "row has 0 columns; expected 1")

    def test_crc_mismatch_names_both_values(self):
        error = self.check_error('[${0:int}] [1,"00000000"]', "CRC mismatch")
        self.assertIn(crc("[1]"), error.message)

    def test_crc_catches_a_changed_value_and_a_changed_schema(self):
        good = f'[${{0:int}}] [1,"{crc("[1]")}"]'
        self.assertEqual(self.both(good), ["[1]"])
        self.check_error(good.replace("[1,", "[2,"), "CRC mismatch")
        self.check_error(good.replace("[${0:int}]", "[0,${0:int}]"), "CRC mismatch")

    def test_crc_must_be_well_formed(self):
        for cell in ("12345678", "true", '"abc"', '"123456789"', '"ABCDEF12"', '"1234567g"'):
            with self.subTest(cell):
                self.check_error(f"[${{0:int}}] [1,{cell}]", "must be a string of 8")

    def test_a_bad_later_row_means_no_output(self):
        source = f'[${{0:int}}] [1,"{crc("[1]")}"] [2,"00000000"]'
        self.check_error(source, "CRC mismatch")

    def test_hole_numbering(self):
        self.check_error("${1:int}", "hole 0 is missing")
        self.check_error("[${0:int},${2:int}]", "hole 1 is missing")
        self.check_error("[${0:int},${0:string}]", "both int and string")

    def test_encode_reproduces_the_example(self):
        source = read_people()
        stripped = source.replace(',"95e088ab"', "").replace(',"1f730d27"', "")
        self.assertNotEqual(stripped, source)
        for name in PARSERS:
            with self.subTest(parser=name):
                self.assertEqual(encode_source(stripped, name), source.splitlines())

    def test_encode_replaces_old_crcs(self):
        self.assertEqual(encode_source('[${0:int}] [1,"00000000"] [2]'),
                         ["[${0:int}]", f'[1,"{crc("[1]")}"]', f'[2,"{crc("[2]")}"]'])

    def test_encode_output_compiles(self):
        draft = '{"a" : [${0:string}, ${1:bool}, ${0:string}], "b":{}} ["é",true] ["\\n",false]'
        encoded = "\n".join(encode_source(draft))
        self.assertEqual(self.both(encoded), [
            '{"a":["é",true,"é"],"b":{}}',
            '{"a":["\\n",false,"\\n"],"b":{}}',
        ])

    def test_encode_zero_hole_schema(self):
        self.assertEqual(encode_source("[1] []"), ["[1]", f'["{crc("[1]")}"]'])

    def test_encode_still_checks(self):
        for source, message in (('[${0:int}] ["x"]', "expected int"),
                                ('[${0:int}] []', "row has 0 columns"),
                                ('[${0:int}] [1,2,3]', "row has 3 columns"),
                                ("${1:int}", "hole 0 is missing")):
            with self.subTest(source), self.assertRaises(CjError) as caught:
                encode_source(source)
            self.assertIn(message, caught.exception.message)

    def test_random_schemas_against_json_loads(self):
        """Python's json module is the independent oracle for the output."""
        rng = random.Random(330)

        def scalar_value():
            return rng.choice([("int", -7), ("int", 0), ("number", 2.5), ("string", "é\n\"x"),
                               ("bool", True), ("bool", False), ("null", None)])

        def build(depth, holes):
            """Return (source text, expected Python value)."""
            shape = rng.choice(["hole", "hole", "scalar", "array", "object"] if depth else ["hole"])
            if shape == "hole":
                hole_type, value = scalar_value()
                index = len(holes)
                holes.append(value)
                return f"${{{index}:{hole_type}}}", value
            if shape == "scalar":
                value = scalar_value()[1]
                return json.dumps(value, ensure_ascii=False), value
            count = rng.randint(0, 3)
            parts = [build(depth - 1, holes) for _ in range(count)]
            if shape == "array":
                return "[" + " , ".join(p[0] for p in parts) + "]", [p[1] for p in parts]
            keys = [f"k{i}" for i in range(count)]
            text = ",".join(f'"{k}" : {p[0]}' for k, p in zip(keys, parts))
            return "{" + text + "}", {k: p[1] for k, p in zip(keys, parts)}

        for _ in range(500):
            holes = []
            schema, expected = build(4, holes)
            row = "[" + ",".join(json.dumps(v, ensure_ascii=False) for v in holes) + "]"
            encoded = "\n".join(encode_source(f"{schema}\n{row}"))
            outputs = self.both(encoded)
            self.assertEqual(len(outputs), 1)
            self.assertEqual(json.loads(outputs[0]), expected)
            self.assertNotIn(" :", outputs[0])  # no source whitespace survives
            stored = json.loads(encoded.splitlines()[-1])[-1]
            self.assertEqual(stored, crc(outputs[0]))


class CommandLine(unittest.TestCase):
    def run_cj(self, *args, stdin=None):
        return subprocess.run(
            [sys.executable, os.path.join(HERE, "cj.py"), *args],
            input=stdin, capture_output=True, cwd=HERE,
            env={**os.environ, "PYTHONIOENCODING": ""},
        )

    def test_both_parsers_print_the_same_bytes(self):
        rd = self.run_cj(PEOPLE)
        sr = self.run_cj("--parser", "sr", PEOPLE)
        self.assertEqual((rd.returncode, sr.returncode), (0, 0))
        self.assertEqual(rd.stdout, sr.stdout)
        lines = rd.stdout.decode("utf-8").splitlines()
        self.assertEqual(lines[1], '{"id":2,"name":"Zoë","at":{"x":0,"y":4.25},"tags":["new"],"ok":false}')
        self.assertEqual(f"{zlib.crc32(lines[1].encode('utf-8')):08x}", "1f730d27")

    def test_error_format_and_status(self):
        result = self.run_cj("-", stdin=b'[${0:number}]\n["x","00000000"]')
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, b"")
        self.assertEqual(result.stderr.decode().strip(),
                         '<stdin>:2:2: check error: expected number for hole 0, got "x"')

    def test_no_partial_output_on_failure(self):
        source = f'[${{0:int}}] [1,"{crc("[1]")}"] [2,"00000000"]'.encode()
        result = self.run_cj("-", stdin=source)
        self.assertEqual((result.returncode, result.stdout), (1, b""))

    def test_encoding_error_reaches_the_user(self):
        result = self.run_cj("-", stdin=b'["\xff"]')
        self.assertEqual(result.returncode, 1)
        self.assertIn(b"<stdin>:1:3: encoding error: invalid UTF-8 lead byte 0xff at byte 2",
                      result.stderr)

    def test_missing_file(self):
        result = self.run_cj("no-such-file.cj")
        self.assertEqual(result.returncode, 1)
        self.assertIn(b"no-such-file.cj: No such file", result.stderr)
        self.assertNotIn(b"Traceback", result.stderr)

    def test_no_file_is_a_usage_error(self):
        self.assertEqual(self.run_cj().returncode, 2)

    def test_encode_round_trip(self):
        draft = '[${0:string}] ["Zoë"]'.encode("utf-8")
        encoded = self.run_cj("--encode", "-", stdin=draft)
        self.assertEqual(encoded.returncode, 0, encoded.stderr)
        compiled = self.run_cj("-", stdin=encoded.stdout)
        self.assertEqual(compiled.returncode, 0, compiled.stderr)
        self.assertEqual(compiled.stdout.decode("utf-8"), '["Zoë"]\n')

    def test_every_dump_runs(self):
        for stage, marker in (("bytes", b"00000000  7b"), ("chars", b"U+00EB"),
                              ("tokens", b"HOLE"), ("tree", b"Hole 4:bool"),
                              ("table", b"State 0:")):
            with self.subTest(stage):
                result = self.run_cj("--dump", stage, PEOPLE)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn(marker, result.stdout)

    def test_traces_differ_by_parser(self):
        rd = self.run_cj("--dump", "trace", "--parser", "rd", PEOPLE)
        sr = self.run_cj("--dump", "trace", "--parser", "sr", PEOPLE)
        self.assertIn(b"program  (next: {)", rd.stdout)
        self.assertIn(b"reduce scalar -> NUMBER", sr.stdout)
        self.assertIn(b"accept", sr.stdout)

    def test_deep_nesting_is_a_clean_error_on_both_parsers(self):
        depth = 100000
        source = ("[" * depth + "]" * depth).encode()
        for name in PARSERS:
            with self.subTest(parser=name):
                result = self.run_cj("--parser", name, "-", stdin=source)
                self.assertEqual(result.returncode, 1, result.stderr[-300:])
                self.assertIn(b"nesting is too deep", result.stderr)
                self.assertNotIn(b"Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
