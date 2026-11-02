"""Stages 4 and 5: check the tree, then generate the JSON strings.

Checking comes first and covers every row, so the compiler prints all of its
output or none of it.
"""

import zlib

from errors import CjError
from tree import Array, Hole, Object, Scalar

CRC_LENGTH = 8
LOWER_HEX = "0123456789abcdef"


def check_error(message, node):
    return CjError("check", message, node.line, node.col)


def walk_holes(node):
    """Every Hole in a schema, in source order."""
    if isinstance(node, Hole):
        yield node
    elif isinstance(node, Object):
        for member in node.members:
            yield from walk_holes(member.value)
    elif isinstance(node, Array):
        for item in node.items:
            yield from walk_holes(item)


def hole_types(schema):
    """Map each hole index to its type, checking the holes are consistent."""
    types = {}
    for hole in walk_holes(schema):
        if types.setdefault(hole.index, hole.type) != hole.type:
            raise check_error(
                f"hole {hole.index} is declared as both {types[hole.index]} and {hole.type}",
                hole,
            )
    for index in range(len(types)):
        if index not in types:
            raise check_error(
                f"holes must be numbered 0 to {len(types) - 1} with no gaps; "
                f"hole {index} is missing",
                schema,
            )
    return types


def is_integer(text):
    return not any(c in text for c in ".eE")


def fits(cell, hole_type):
    if hole_type == "int":
        return cell.kind == "NUMBER" and is_integer(cell.text)
    if hole_type == "number":
        return cell.kind == "NUMBER"
    if hole_type == "string":
        return cell.kind == "STRING"
    if hole_type == "bool":
        return cell.kind in ("true", "false")
    return cell.kind == "null"


def check_cells(cells, types):
    for index, cell in enumerate(cells):
        if not fits(cell, types[index]):
            raise check_error(
                f"expected {types[index]} for hole {index}, got {cell.text}", cell
            )


def expand(node, cells):
    """The compact JSON text of `node`, with holes filled in from `cells`."""
    parts = []
    write_json(node, cells, parts)
    return "".join(parts)


def write_json(node, cells, parts):
    if isinstance(node, Scalar):
        parts.append(node.text)
    elif isinstance(node, Hole):
        parts.append(cells[node.index].text)
    elif isinstance(node, Object):
        parts.append("{")
        for i, member in enumerate(node.members):
            parts.append("," if i else "")
            parts.append(member.key + ":")
            write_json(member.value, cells, parts)
        parts.append("}")
    else:
        parts.append("[")
        for i, item in enumerate(node.items):
            parts.append("," if i else "")
            write_json(item, cells, parts)
        parts.append("]")


def crc_text(text):
    """CRC-32 of the UTF-8 bytes of `text`, as 8 lowercase hex digits."""
    return f"{zlib.crc32(text.encode('utf-8')):08x}"


def check_crc(cell, computed):
    stored = cell.text[1:-1] if cell.kind == "STRING" else ""
    if len(stored) != CRC_LENGTH or any(c not in LOWER_HEX for c in stored):
        raise check_error(
            f"the CRC column must be a string of {CRC_LENGTH} lowercase hex digits, "
            f"got {cell.text}",
            cell,
        )
    if stored != computed:
        raise check_error(f"CRC mismatch: the row says {stored}, computed {computed}", cell)


def compile_program(program):
    """Check a program and return its list of JSON strings."""
    types = hole_types(program.schema)
    outputs = []
    for row in program.rows:
        if len(row.cells) != len(types) + 1:
            raise check_error(
                f"row has {len(row.cells)} columns; expected {len(types) + 1} "
                f"({len(types)} values and the CRC)",
                row,
            )
        values, crc = row.cells[:-1], row.cells[-1]
        check_cells(values, types)
        output = expand(program.schema, values)
        check_crc(crc, crc_text(output))
        outputs.append(output)
    return outputs


def schema_text(node):
    """The schema as compact source text, with its holes written back out."""
    if isinstance(node, Hole):
        return f"${{{node.index}:{node.type}}}"
    if isinstance(node, Scalar):
        return node.text
    if isinstance(node, Object):
        return "{" + ",".join(f"{m.key}:{schema_text(m.value)}" for m in node.members) + "}"
    return "[" + ",".join(schema_text(item) for item in node.items) + "]"


def encode_program(program):
    """Return the source lines of a program with its CRCs filled in.

    A row may leave the CRC off or carry an old one. An old one is replaced,
    which is the way to re-bless rows after editing the schema or a value.
    """
    types = hole_types(program.schema)
    lines = [schema_text(program.schema)]
    for row in program.rows:
        if len(row.cells) not in (len(types), len(types) + 1):
            raise check_error(
                f"row has {len(row.cells)} columns; expected {len(types)} values, "
                f"optionally followed by a CRC",
                row,
            )
        values = row.cells[: len(types)]
        check_cells(values, types)
        crc = crc_text(expand(program.schema, values))
        lines.append("[" + ",".join([v.text for v in values] + [f'"{crc}"']) + "]")
    return lines
