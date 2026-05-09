"""Tests for scripts.generate_metadata_jsonl."""

import json
from pathlib import Path
from unittest.mock import patch

import pytest

from scripts.generate_metadata_jsonl import build_entries, enforce_ascii, infer_city


class TestInferCity:
    def test_state_level_file_returns_null(self):
        assert infer_city(Path("ORS090.txt")) == "null"

    def test_portland_returns_portland(self):
        assert infer_city(Path("portland/PCC30.01.txt")) == "portland"

    def test_eugene_returns_eugene(self):
        assert infer_city(Path("eugene/EHC8.txt")) == "eugene"

    def test_city_in_nested_subdir(self):
        assert infer_city(Path("portland/2025/PCC30.01.txt")) == "portland"

    def test_year_subdir_only_returns_null(self):
        assert infer_city(Path("2025/ORS090.txt")) == "null"


class TestBuildEntries:
    @pytest.fixture
    def doc_tree(self, tmp_path: Path) -> Path:
        (tmp_path / "2025").mkdir()
        (tmp_path / "portland").mkdir()
        (tmp_path / "eugene").mkdir()
        (tmp_path / "2025" / "ORS090.txt").write_text("state doc")
        (tmp_path / "portland" / "PCC30.01.txt").write_text("portland doc")
        (tmp_path / "eugene" / "EHC8.txt").write_text("eugene doc")
        return tmp_path

    def test_empty_scopes_returns_all(self, doc_tree: Path):
        assert len(build_entries(doc_tree, "my-bucket", set())) == 3

    def test_or_scope_returns_state_only(self, doc_tree: Path):
        entries = build_entries(doc_tree, "my-bucket", {"or"})
        assert len(entries) == 1
        assert entries[0]["id"] == "ORS090"

    def test_portland_scope_returns_portland_only(self, doc_tree: Path):
        entries = build_entries(doc_tree, "my-bucket", {"portland"})
        assert len(entries) == 1
        assert entries[0]["id"] == "PCC30.01"

    def test_multiple_scopes(self, doc_tree: Path):
        entries = build_entries(doc_tree, "my-bucket", {"portland", "eugene"})
        assert {e["id"] for e in entries} == {"PCC30.01", "EHC8"}

    def test_state_entry_structure(self, doc_tree: Path):
        entries = build_entries(doc_tree, "my-bucket", {"or"})
        entry = entries[0]
        assert entry["id"] == "ORS090"
        assert entry["structData"] == {"city": "null", "state": "or"}
        assert entry["content"]["mimeType"] == "text/plain"
        assert entry["content"]["uri"] == "gs://my-bucket/ORS090.txt"

    def test_city_entry_structure(self, doc_tree: Path):
        entries = build_entries(doc_tree, "my-bucket", {"portland"})
        entry = entries[0]
        assert entry["structData"] == {"city": "portland", "state": "or"}

    def test_uri_is_flat_not_mirrored(self, doc_tree: Path):
        """GCS files are uploaded flat; URIs must point to the bucket root."""
        entries = build_entries(doc_tree, "my-bucket", {"portland"})
        assert entries[0]["content"]["uri"] == "gs://my-bucket/PCC30.01.txt"

    def test_duplicate_basename_raises(self, tmp_path: Path):
        (tmp_path / "2024").mkdir()
        (tmp_path / "2025").mkdir()
        (tmp_path / "2024" / "ORS090.txt").write_text("old")
        (tmp_path / "2025" / "ORS090.txt").write_text("new")
        with pytest.raises(RuntimeError, match="Duplicate document id"):
            build_entries(tmp_path, "my-bucket", set())

    def test_unknown_non_ascii_excluded_from_metadata(self, tmp_path: Path):
        (tmp_path / "ORS090.txt").write_text("café", encoding="utf-8")
        entries = build_entries(tmp_path, "my-bucket", set())
        assert entries == []

    def test_unknown_non_ascii_warns_all_offenders(self, tmp_path: Path, capsys: pytest.CaptureFixture):
        (tmp_path / "A.txt").write_text("café", encoding="utf-8")
        (tmp_path / "B.txt").write_text("résumé", encoding="utf-8")
        build_entries(tmp_path, "my-bucket", set())
        err = capsys.readouterr().err
        assert "A.txt" in err
        assert "B.txt" in err

    def test_partial_conversion_applied_on_unrecognized(self, tmp_path: Path):
        """Known replacements are written even when unrecognized chars remain."""
        (tmp_path / "A.txt").write_text("Chapter 90 — café", encoding="utf-8")
        build_entries(tmp_path, "my-bucket", set())
        result = (tmp_path / "A.txt").read_text(encoding="utf-8")
        assert "--" in result
        assert "—" not in result  # em-dash was converted
        assert "é" in result      # unrecognized char still present

    def test_valid_files_still_converted_alongside_invalid(self, tmp_path: Path):
        (tmp_path / "A.txt").write_text("Chapter 90 — Rights", encoding="utf-8")
        (tmp_path / "B.txt").write_text("café", encoding="utf-8")
        entries = build_entries(tmp_path, "my-bucket", set())
        assert len(entries) == 1
        assert entries[0]["id"] == "A"
        assert (tmp_path / "A.txt").read_text(encoding="ascii") == "Chapter 90 -- Rights"

    def test_known_non_ascii_is_converted(self, tmp_path: Path):
        (tmp_path / "ORS090.txt").write_text(
            "Chapter 90 — Tenant Rights", encoding="utf-8"
        )
        build_entries(tmp_path, "my-bucket", set())
        assert (tmp_path / "ORS090.txt").read_text(
            encoding="ascii"
        ) == "Chapter 90 -- Tenant Rights"


class TestEnforceAscii:
    def test_already_ascii_is_unchanged(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("plain ascii", encoding="ascii")
        assert enforce_ascii(p) is None
        assert p.read_text() == "plain ascii"

    def test_section_sign_converted(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("See § 90.100", encoding="utf-8")
        assert enforce_ascii(p) == "See Section 90.100"

    def test_double_section_sign_converted(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("See §§ 90.100, 90.200", encoding="utf-8")
        assert enforce_ascii(p) == "See Sections 90.100, 90.200"

    def test_smart_quotes_converted(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("“quoted” and it’s fine", encoding="utf-8")
        assert enforce_ascii(p) == '"quoted" and it\'s fine'

    def test_em_dash_converted(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("Chapter 90 — Rights", encoding="utf-8")
        assert enforce_ascii(p) == "Chapter 90 -- Rights"

    def test_unknown_char_raises(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("café", encoding="utf-8")
        with pytest.raises(RuntimeError, match="unrecognized non-ASCII"):
            enforce_ascii(p)

    def test_invalid_utf8_raises(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_bytes(b"invalid \x80 utf8")
        with pytest.raises(RuntimeError, match="not valid UTF-8"):
            enforce_ascii(p)


class TestMain:
    def test_missing_bucket_raises(self):
        with patch.dict("os.environ", {}, clear=True):
            with patch("scripts.generate_metadata_jsonl.load_dotenv"):
                from scripts.generate_metadata_jsonl import main

                with pytest.raises(RuntimeError, match="GCS_BUCKET_NAME"):
                    main()

    def test_writes_valid_jsonl(self, tmp_path: Path):
        (tmp_path / "ORS090.txt").write_text("doc")
        output = tmp_path / "out.jsonl"

        with (
            patch.dict("os.environ", {"GCS_BUCKET_NAME": "test-bucket"}),
            patch("scripts.generate_metadata_jsonl.load_dotenv"),
            patch("scripts.generate_metadata_jsonl.DOCUMENTS_DIR", tmp_path),
            patch("scripts.generate_metadata_jsonl.OUTPUT_FILE", output),
            patch("sys.argv", ["generate_metadata_jsonl"]),
        ):
            from scripts.generate_metadata_jsonl import main

            main()

        lines = output.read_text().splitlines()
        assert len(lines) == 1
        entry = json.loads(lines[0])
        assert entry["id"] == "ORS090"
        assert entry["content"]["uri"] == "gs://test-bucket/ORS090.txt"
