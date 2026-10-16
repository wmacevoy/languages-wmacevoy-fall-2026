#pragma once

#include <string>

// Recognize a JSON number (RFC 8259, section 6) with a regular expression.
bool is_json_number(const std::string& text);
