// Check is_json_number against every case in ../cases.txt with GoogleTest.
//
// CASES_FILE is the absolute path to cases.txt, set by CMakeLists.txt. The
// file is read when the binary runs, so a new case needs no rebuild. Each
// case becomes one value-parameterized test, named after its line number.

#include "json_number.hpp"

#include <gtest/gtest.h>

#include <cctype>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

struct Case {
    int number;
    bool expected;
    std::string text;
};

std::string decode(const std::string& raw) {
    std::string out;
    for (std::size_t i = 0; i < raw.size();) {
        if (raw[i] != '\\') {
            out += raw[i];
            i += 1;
        } else if (i + 1 < raw.size() && raw[i + 1] == '\\') {
            out += '\\';
            i += 2;
        } else if (i + 3 < raw.size() && raw[i + 1] == 'x' &&
                   std::isxdigit(static_cast<unsigned char>(raw[i + 2])) &&
                   std::isxdigit(static_cast<unsigned char>(raw[i + 3]))) {
            out += static_cast<char>(std::stoi(raw.substr(i + 2, 2), nullptr, 16));
            i += 4;
        } else {
            throw std::runtime_error("bad escape in " + raw);
        }
    }
    return out;
}

std::vector<Case> load_cases() {
    // Binary mode, so Windows does not translate "\r\n" behind our back; the
    // "\r" is stripped below exactly as the other three languages do it.
    std::ifstream file(CASES_FILE, std::ios::binary);
    if (!file) throw std::runtime_error("cannot open " CASES_FILE);
    std::stringstream buffer;
    buffer << file.rdbuf();
    const std::string contents = buffer.str();

    std::vector<Case> cases;
    int number = 0;
    std::size_t start = 0;
    while (start <= contents.size()) {
        std::size_t end = contents.find('\n', start);
        if (end == std::string::npos) end = contents.size();
        std::string line = contents.substr(start, end - start);
        start = end + 1;
        ++number;
        if (!line.empty() && line.back() == '\r') line.pop_back();
        if (line.empty() || line[0] == '#') continue;
        if ((line[0] != '+' && line[0] != '-') || (line.size() > 1 && line[1] != ' ')) {
            throw std::runtime_error("cases.txt:" + std::to_string(number) +
                                     ": malformed line " + line);
        }
        cases.push_back({number, line[0] == '+', decode(line.size() > 2 ? line.substr(2) : "")});
    }
    return cases;
}

const std::vector<Case>& cases() {
    static const std::vector<Case> loaded = load_cases();
    return loaded;
}

class JsonNumberTest : public testing::TestWithParam<Case> {};

TEST(JsonNumberCases, FileWasRead) { EXPECT_GT(cases().size(), 50u); }

TEST_P(JsonNumberTest, AgreesWithCasesFile) {
    const Case& c = GetParam();
    EXPECT_EQ(is_json_number(c.text), c.expected)
        << "cases.txt line " << c.number << ": "
        << (c.expected ? "should accept " : "should reject ") << testing::PrintToString(c.text);
}

INSTANTIATE_TEST_SUITE_P(
    CasesFile, JsonNumberTest, testing::ValuesIn(cases()),
    [](const testing::TestParamInfo<Case>& info) {
        return "line_" + std::to_string(info.param.number) +
               (info.param.expected ? "_accept" : "_reject");
    });

}  // namespace
