"""Generate metadata.jsonl for Vertex AI RAG ingestion from the documents directory.

Walks backend/scripts/documents/or/ recursively, infers city/state metadata
from the directory structure, and writes a flat metadata.jsonl file where all
GCS URIs point to the bucket root (files are uploaded flat, not mirrored).

To run:
  make generate-metadata                                    # all documents
  make generate-metadata LOC_OPTIONS="--or"               # Oregon state only
  make generate-metadata LOC_OPTIONS="--portland"          # Portland only
  make generate-metadata LOC_OPTIONS="--or --eugene"       # multiple

Requires GCS_BUCKET_NAME in the environment (or .env file).
"""

import argparse
import json
import os
from pathlib import Path

from dotenv import load_dotenv

DOCUMENTS_DIR = Path(__file__).parent / "documents" / "or"
OUTPUT_FILE = DOCUMENTS_DIR / "metadata.jsonl"

CITY_DIRS = {"eugene", "portland"}


def infer_city(path: Path) -> str:
    for part in path.parts:
        if part in CITY_DIRS:
            return part
    return "null"


def build_entries(documents_dir: Path, bucket: str, scopes: set[str]) -> list[dict]:
    entries = []
    for txt_file in sorted(documents_dir.rglob("*.txt")):
        city = infer_city(txt_file.relative_to(documents_dir))
        scope = "or" if city == "null" else city
        if scopes and scope not in scopes:
            continue
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
    return entries


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--or",
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
