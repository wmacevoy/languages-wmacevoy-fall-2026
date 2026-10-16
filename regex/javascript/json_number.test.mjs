import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { isJsonNumber } from "./json_number.mjs";

const CASES = new URL("../cases.txt", import.meta.url);

function decode(raw) {
  let out = "";
  for (let i = 0; i < raw.length; ) {
    if (raw[i] !== "\\") {
      out += raw[i];
      i += 1;
    } else if (raw[i + 1] === "\\") {
      out += "\\";
      i += 2;
    } else if (raw[i + 1] === "x" && /^[0-9A-Fa-f]{2}$/.test(raw.slice(i + 2, i + 4))) {
      out += String.fromCharCode(parseInt(raw.slice(i + 2, i + 4), 16));
      i += 4;
    } else {
      throw new Error(`bad escape in ${JSON.stringify(raw)}`);
    }
  }
  return out;
}

function loadCases() {
  const cases = [];
  readFileSync(CASES, "utf8")
    .split("\n")
    .forEach((rawLine, index) => {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      if (line === "" || line.startsWith("#")) return;
      if (!"+-".includes(line[0]) || (line.length > 1 && line[1] !== " ")) {
        throw new Error(`cases.txt:${index + 1}: malformed line ${JSON.stringify(line)}`);
      }
      cases.push({ number: index + 1, expected: line[0] === "+", text: decode(line.slice(2)) });
    });
  return cases;
}

const cases = loadCases();

test("cases.txt was read", () => assert.ok(cases.length > 50));

for (const { number, expected, text } of cases) {
  test(`line ${number}: ${expected ? "accept" : "reject"} ${JSON.stringify(text)}`, () => {
    assert.equal(isJsonNumber(text), expected);
  });
}
