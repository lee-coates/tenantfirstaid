"""Generate metadata.jsonl for Vertex AI RAG ingestion from the documents directory.

Walks backend/scripts/documents/or/ recursively, infers city/state metadata
from the directory structure, and writes a flat metadata.jsonl file where all
GCS URIs point to the bucket root (files are uploaded flat, not mirrored).

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
from pathlib import Path

from dotenv import load_dotenv

DOCUMENTS_DIR = Path(__file__).parent / "documents" / "or"
OUTPUT_FILE = DOCUMENTS_DIR / "metadata.jsonl"

CITY_DIRS = {"eugene", "portland"}

# Section sign (§) entries are handled in enforce_ascii via re.sub so that
# trailing whitespace is collapsed: both "§ 90" and "§90" become "Section 90".
ASCII_REPLACEMENTS = [
    ("’", "'"),
    ("“", '"'),
    ("”", '"'),
    ("—", "--"),
    ("–", "-"),
    ("•", "-"),
]


def enforce_ascii(path: Path) -> None:
    """Apply known ASCII replacements to path, rewriting the file in-place.

    Rewrites the file on disk whenever any substitution is made.
    Raises RuntimeError if unrecognized non-ASCII bytes remain after substitution.
    """
    try:
        path.read_text(encoding="ascii")
        return
    except UnicodeDecodeError:
        pass

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raise RuntimeError(
            f"{path.name}: file is not valid UTF-8 — re-save as UTF-8 before running."
        )

    # Use regex so trailing whitespace is collapsed: both "§ 90" and "§90"
    # become "Section 90". Double-sign pattern must precede single-sign.
    section_sign = "§"
    text = re.sub(section_sign * 2 + r"\s*", "Sections ", text)
    text = re.sub(section_sign + r"\s*", "Section ", text)

    for src, dst in ASCII_REPLACEMENTS:
        text = text.replace(src, dst)

    try:
        text.encode("ascii")
    except UnicodeEncodeError as e:
        raise RuntimeError(
            f"{path.name}: unrecognized non-ASCII character {repr(text[e.start])} "
            f"at position {e.start} — add it to ASCII_REPLACEMENTS or fix the source file."
        )

    path.write_text(text, encoding="ascii")


def infer_city(path: Path) -> str:
    for part in path.parts:
        if part in CITY_DIRS:
            return part
    return "null"


def build_entries(documents_dir: Path, bucket: str, scopes: set[str]) -> list[dict]:
    entries = []
    seen_ids: set[str] = set()
    non_ascii: list[str] = []

    for txt_file in sorted(documents_dir.rglob("*.txt")):
        city = infer_city(txt_file.relative_to(documents_dir))
        scope = "or" if city == "null" else city
        if scopes and scope not in scopes:
            continue

        try:
            enforce_ascii(txt_file)
        except RuntimeError as e:
            non_ascii.append(str(e))

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

    if non_ascii:
        raise RuntimeError(
            f"Document validation failed in {len(non_ascii)} file(s) — Vertex AI RAG ingestion requires pure ASCII:\n"
            + "\n".join(f"  {p}" for p in non_ascii)
        )

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
