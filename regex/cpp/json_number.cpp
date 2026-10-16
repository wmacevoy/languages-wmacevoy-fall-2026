// Recognize a JSON number (RFC 8259, section 6) with a regular expression.
//
// Regex notation used below:
//
//   -?          an optional "-" (? = zero or one of the thing before it)
//   [1-9]       one character from the set: a digit 1 through 9
//   [0-9]*      zero or more digits (* = zero or more)
//   [0-9]+      one or more digits (+ = one or more)
//   [eE]        "e" or "E"
//   [+-]?       an optional "+" or "-"
//   \.          a literal "." (a bare "." would match any character)
//   a|b         a or b
//   (?:...)     a group: treats ... as one unit, so ?, * or | can apply to
//               the whole of it. The "?:" makes it non-capturing -- plain
//               (...) would also save the matched text for later retrieval,
//               which this code never asks for.
//
// Read as a whole:
//
//   -?                          optional minus sign
//   (?:0|[1-9][0-9]*)           integer part: "0", or a digit 1-9 then any digits
//   (?:\.[0-9]+)?               optional fraction: "." then at least one digit
//   (?:[eE][+-]?[0-9]+)?        optional exponent: e/E, optional sign, digits

#include "json_number.hpp"

#include <regex>

bool is_json_number(const std::string& text) {
    // R"(...)" is a raw string literal: everything between "( and )" is taken
    // exactly as written, so the regex engine receives \. as written. In a
    // normal "..." string you would write \\. The parentheses are delimiters,
    // not part of the string -- the pattern starts at "-?".
    //
    // `static` makes this local variable built once, on the first call, and
    // reused after that; compiling a regex is expensive. C++11 and later
    // guarantee that first-call construction is thread-safe.
    //
    // regex_match, not regex_search: it must match the whole string, so the
    // pattern needs no ^ and $ anchors. std::regex works on bytes, so a UTF-8
    // non-ASCII digit is never in [0-9].
    static const std::regex json_number(
        R"(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)");
    return std::regex_match(text, json_number);
}
