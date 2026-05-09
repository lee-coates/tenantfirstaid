"""Generate metadata.jsonl for Vertex AI RAG ingestion from the documents directory.

Walks backend/scripts/documents/or/ recursively, infers city/state metadata
from the directory structure, and writes a flat metadata.jsonl file where all
GCS URIs point to the bucket root (files are uploaded flat, not mirrored).

Also enforces ASCII compliance: any .txt file containing known non-ASCII characters
(curly quotes, em-dashes, section signs, etc.) is rewritten in place. Files with
unrecognized non-ASCII characters are warned about, excluded from metadata.jsonl,
and have known replacements applied in place where possible.

To run:
  make generate-metadata                                    # all documents
  make generate-metadata LOC_OPTIONS="--oregon"            # Oregon state only
  make generate-metadata LOC_OPTIONS="--portland"           # Portland only
  make generate-metadata LOC_OPTIONS="--oregon --eugene"    # multiple

Requires GCS_BUCKET_NAME in the environment (or .env file).
"""

import argparse
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

from dotenv import load_dotenv

DOCUMENTS_DIR = Path(__file__).parent / "documents" / "or"
OUTPUT_FILE = DOCUMENTS_DIR / "metadata.jsonl"

CITY_DIRS = {"eugene", "portland"}

# Section sign (§) entries are handled in enforce_ascii via re.sub so that
# trailing whitespace is collapsed: both "§ 90" and "§90" become "Section 90".
ASCII_REPLACEMENTS = [
    # Quotes
    ("‘", "'"),  # left single curly quote
    ("’", "'"),  # right single curly quote
    ("“", '"'),  # left double curly quote
    ("”", '"'),  # right double curly quote
    # Spaces
    (" ", " "),  # non-breaking space
    # Dashes and hyphens
    ("—", "--"),  # em-dash
    ("–", "-"),  # en-dash
    ("‐", "-"),  # hyphen (U+2010)
    ("‑", "-"),  # non-breaking hyphen
    ("‒", "-"),  # figure dash
    # Bullets
    ("•", "-"),  # bullet
    ("‣", "-"),  # triangular bullet
    ("·", "-"),  # middle dot
    # Symbols
    ("©", "(c)"),  # copyright
    ("®", "(R)"),  # registered trademark
    ("™", "(TM)"),  # trademark
    ("…", "..."),  # ellipsis
    ("°", " degrees"),  # degree sign (e.g. minimum heating requirements)
    # Fractions
    ("½", "1/2"),
    ("¼", "1/4"),
    ("¾", "3/4"),
]


def _apply_ascii_replacements(text: str) -> str:
    """Apply all known non-ASCII to ASCII substitutions to text."""
    section_sign = "§"
    text = re.sub(section_sign * 2 + r"\s*", "Sections ", text)
    text = re.sub(section_sign + r"\s*", "Section ", text)
    for orig, repl in ASCII_REPLACEMENTS:
        text = text.replace(orig, repl)
    return text


def _collect_unrecognized(text: str) -> dict[str, int]:
    """Return {char: first_position} for each non-ASCII character in text."""
    result: dict[str, int] = {}
    for i, c in enumerate(text):
        if ord(c) > 127 and c not in result:
            result[c] = i
    return result


def _suggest_ascii(char: str) -> str:
    """Return a plausible ASCII replacement for char, or empty string if none obvious."""
    base = (
        unicodedata.normalize("NFKD", char)
        .encode("ascii", errors="ignore")
        .decode("ascii")
    )
    return base


def enforce_ascii(path: Path) -> str | None:
    """Apply known ASCII replacements and validate the result.

    Returns the rewritten text if any substitution was made, or None if the file
    is already pure ASCII. Does NOT write to disk.
    Raises RuntimeError if the file is not valid UTF-8 or if unrecognized
    non-ASCII bytes remain after substitution.
    """
    try:
        path.read_text(encoding="ascii")
        return None
    except UnicodeDecodeError:
        pass

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raise RuntimeError(
            f"{path.name}: file is not valid UTF-8 — re-save as UTF-8 before running."
        )

    text = _apply_ascii_replacements(text)

    unrecognized = _collect_unrecognized(text)
    if unrecognized:
        lines = []
        for char, pos in unrecognized.items():
            suggestion = _suggest_ascii(char)
            if suggestion:
                lines.append(
                    f'    consider adding ("{char}", "{suggestion}") '
                    "to ASCII_REPLACEMENTS in scripts/generate_metadata_jsonl.py"
                )
            else:
                lines.append(
                    f"    {repr(char)} ({unicodedata.name(char, repr(char))}, pos {pos})"
                    " — no obvious replacement, fix the source file"
                )
        n = len(unrecognized)
        raise RuntimeError(
            f"{path.name}: {n} unrecognized non-ASCII character{'s' if n > 1 else ''}:\n"
            + "\n".join(lines)
        )

    return text


def infer_city(path: Path) -> str:
    for part in path.parts:
        if part in CITY_DIRS:
            return part
    return "null"


def _print_warning_table(
    file_issues: list[tuple[str, dict[str, int] | None]],
) -> None:
    rows: list[tuple[str, str, str, str]] = []
    for filename, unrecognized in file_issues:
        if unrecognized is None:
            rows.append(
                (filename, "-", "invalid UTF-8", "re-save as UTF-8 before running")
            )
        else:
            for j, (char, _pos) in enumerate(unrecognized.items()):
                fname = filename if j == 0 else ""
                name = unicodedata.name(char, f"U+{ord(char):04X}")
                suggestion = _suggest_ascii(char)
                repl = (
                    f'("{char}", "{suggestion}")'
                    if suggestion
                    else "no obvious replacement — fix source file"
                )
                rows.append((fname, char, name, repl))

    if not rows:
        return

    headers = ["File", "Char", "Unicode Name", "Add to ASCII_REPLACEMENTS"]
    widths = [max(max(len(r[i]) for r in rows), len(headers[i])) for i in range(4)]
    sep = "  ".join("-" * w for w in widths)
    header_line = "  ".join(h.ljust(widths[i]) for i, h in enumerate(headers))

    n = len(file_issues)
    print(
        f"\nWarning: {n} file(s) had unrecognized non-ASCII characters and were "
        "excluded from metadata.jsonl. Known replacements were applied where possible.\n"
        f"{header_line}\n{sep}",
        file=sys.stderr,
    )
    for row in rows:
        print(
            "  ".join(row[i].ljust(widths[i]) for i in range(4)),
            file=sys.stderr,
        )
    print(
        "To add replacements, edit ASCII_REPLACEMENTS in scripts/generate_metadata_jsonl.py.",
        file=sys.stderr,
    )


def build_entries(documents_dir: Path, bucket: str, scopes: set[str]) -> list[dict]:
    entries = []
    seen_ids: set[str] = set()
    file_issues: list[tuple[str, dict[str, int] | None]] = []
    ascii_rewrites: list[tuple[Path, str]] = []

    for txt_file in sorted(documents_dir.rglob("*.txt")):
        city = infer_city(txt_file.relative_to(documents_dir))
        scope = "or" if city == "null" else city
        if scopes and scope not in scopes:
            continue

        try:
            rewritten = enforce_ascii(txt_file)
            if rewritten is not None:
                ascii_rewrites.append((txt_file, rewritten))
        except RuntimeError as e:
            if "not valid UTF-8" in str(e):
                file_issues.append((txt_file.name, None))
            else:
                try:
                    raw = txt_file.read_text(encoding="utf-8")
                    partial = _apply_ascii_replacements(raw)
                    txt_file.write_text(partial, encoding="utf-8")
                    file_issues.append((txt_file.name, _collect_unrecognized(partial)))
                except UnicodeDecodeError:
                    file_issues.append((txt_file.name, None))
            continue  # exclude from metadata.jsonl

        if txt_file.stem in seen_ids:
            raise RuntimeError(
                f"Duplicate document id '{txt_file.stem}': two .txt files share the same basename. "
                "Files are uploaded flat to GCS, so one would overwrite the other."
            )
        seen_ids.add(txt_file.stem)

        entries.append(
            {
                "id": txt_file.stem,
                "structData": {"city": city, "state": "or"},
                "content": {
                    "mimeType": "text/plain",
                    "uri": f"gs://{bucket}/{txt_file.name}",
                },
            }
        )

    for path, text in ascii_rewrites:
        path.write_text(text, encoding="ascii")

    if file_issues:
        _print_warning_table(file_issues)

    return entries


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--oregon",
        dest="include_or",
        action="store_true",
        help="Include Oregon state documents.",
    )
    parser.add_argument(
        "--portland",
        dest="include_portland",
        action="store_true",
        help="Include Portland documents.",
    )
    parser.add_argument(
        "--eugene",
        dest="include_eugene",
        action="store_true",
        help="Include Eugene documents.",
    )
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    bucket = os.environ.get("GCS_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("GCS_BUCKET_NAME is not set. Add it to your .env file.")

    args = parse_args()
    scopes: set[str] = set()
    if args.include_or:
        scopes.add("or")
    if args.include_portland:
        scopes.add("portland")
    if args.include_eugene:
        scopes.add("eugene")

    entries = build_entries(DOCUMENTS_DIR, bucket, scopes)

    with OUTPUT_FILE.open("w") as f:
        for entry in entries:
            f.write(json.dumps(entry) + "\n")
            print(f"  {entry['id']} -> {entry['content']['uri']}")

    print(f"Wrote {len(entries)} entries to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
