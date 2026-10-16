use json_number::is_json_number;

const CASES: &str = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../cases.txt"));

fn decode(raw: &str) -> String {
    let chars: Vec<char> = raw.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] != '\\' {
            out.push(chars[i]);
            i += 1;
        } else if chars.get(i + 1) == Some(&'\\') {
            out.push('\\');
            i += 2;
        } else if chars.get(i + 1) == Some(&'x')
            && chars.len() >= i + 4
            && chars[i + 2..i + 4].iter().all(|c| c.is_ascii_hexdigit())
        {
            let hex: String = chars[i + 2..i + 4].iter().collect();
            out.push(char::from(u8::from_str_radix(&hex, 16).unwrap()));
            i += 4;
        } else {
            panic!("bad escape in {raw:?}");
        }
    }
    out
}

fn load_cases() -> Vec<(usize, bool, String)> {
    let mut cases = Vec::new();
    for (index, raw_line) in CASES.split('\n').enumerate() {
        let line = raw_line.strip_suffix('\r').unwrap_or(raw_line);
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let sign = line.as_bytes()[0];
        if !(sign == b'+' || sign == b'-') || (line.len() > 1 && line.as_bytes()[1] != b' ') {
            panic!("cases.txt:{}: malformed line {line:?}", index + 1);
        }
        let text = line.get(2..).unwrap_or("");
        cases.push((index + 1, sign == b'+', decode(text)));
    }
    cases
}

// The standard harness has no parameterized tests, so run every case and
// report all the failures at once rather than stopping at the first.
#[test]
fn cases() {
    let cases = load_cases();
    assert!(cases.len() > 50, "cases.txt was not read");
    let failures: Vec<String> = cases
        .iter()
        .filter(|(_, expected, text)| is_json_number(text) != *expected)
        .map(|(number, expected, text)| {
            let verb = if *expected { "accept" } else { "reject" };
            format!("line {number}: should {verb} {text:?}")
        })
        .collect();
    assert!(failures.is_empty(), "\n{}", failures.join("\n"));
}
