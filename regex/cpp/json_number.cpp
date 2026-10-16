#include "json_number.hpp"

#include <regex>

bool is_json_number(const std::string& text) {
    // regex_match, not regex_search: it must match the whole string, so the
    // pattern needs no anchors. std::regex works on bytes, so a UTF-8
    // non-ASCII digit is never in [0-9].
    static const std::regex json_number(
        R"(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)");
    return std::regex_match(text, json_number);
}
