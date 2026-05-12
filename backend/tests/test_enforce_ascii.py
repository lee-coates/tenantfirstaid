"""Tests for scripts.enforce_ascii."""

from pathlib import Path
from unittest.mock import patch

import pytest

from scripts.enforce_ascii import (
    InvalidUtf8Error,
    UnrecognizedAsciiError,
    enforce_ascii,
    validate_and_rewrite_tree,
)


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
        with pytest.raises(UnrecognizedAsciiError, match="unrecognized non-ASCII"):
            enforce_ascii(p)

    def test_invalid_utf8_raises(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_bytes(b"invalid \x80 utf8")
        with pytest.raises(InvalidUtf8Error, match="not valid UTF-8"):
            enforce_ascii(p)

    def test_idempotent(self, tmp_path: Path):
        p = tmp_path / "f.txt"
        p.write_text("Chapter 90 — Rights", encoding="utf-8")
        rewritten = enforce_ascii(p)
        assert rewritten is not None
        p.write_text(rewritten, encoding="ascii")
        assert enforce_ascii(p) is None


class TestValidateAndRewriteTree:
    def test_clean_tree_no_changes(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("pure ascii", encoding="ascii")
        validate_and_rewrite_tree(tmp_path)
        assert (tmp_path / "a.txt").read_text() == "pure ascii"

    def test_known_replacements_applied(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("Chapter 90 — Rights", encoding="utf-8")
        validate_and_rewrite_tree(tmp_path)
        assert (tmp_path / "a.txt").read_text(
            encoding="ascii"
        ) == "Chapter 90 -- Rights"

    def test_unrecognized_char_raises_and_partial_rewrite_applied(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("Chapter 90 — café", encoding="utf-8")
        with pytest.raises(RuntimeError, match="failed ASCII validation"):
            validate_and_rewrite_tree(tmp_path)
        result = (tmp_path / "a.txt").read_text(encoding="utf-8")
        assert "--" in result
        assert "—" not in result
        assert "é" in result

    def test_valid_files_still_converted_when_others_fail(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("Chapter 90 — Rights", encoding="utf-8")
        (tmp_path / "b.txt").write_text("café", encoding="utf-8")
        with pytest.raises(RuntimeError, match="failed ASCII validation"):
            validate_and_rewrite_tree(tmp_path)
        assert (tmp_path / "a.txt").read_text(
            encoding="ascii"
        ) == "Chapter 90 -- Rights"

    def test_check_only_does_not_write(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("Chapter 90 — Rights", encoding="utf-8")
        with pytest.raises(RuntimeError, match="ASCII validation failed"):
            validate_and_rewrite_tree(tmp_path, check_only=True)
        assert (tmp_path / "a.txt").read_text(encoding="utf-8") == "Chapter 90 — Rights"

    def test_check_only_passes_when_clean(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("pure ascii", encoding="ascii")
        validate_and_rewrite_tree(tmp_path, check_only=True)

    def test_file_filter_skips_excluded(self, tmp_path: Path):
        (tmp_path / "a.txt").write_text("café", encoding="utf-8")
        (tmp_path / "b.txt").write_text("ok", encoding="ascii")
        validate_and_rewrite_tree(tmp_path, file_filter=lambda p: p.name != "a.txt")
        assert (tmp_path / "a.txt").read_text(encoding="utf-8") == "café"

    def test_warning_table_prints_all_offenders(
        self, tmp_path: Path, capsys: pytest.CaptureFixture
    ):
        (tmp_path / "A.txt").write_text("café", encoding="utf-8")
        (tmp_path / "B.txt").write_text("résumé", encoding="utf-8")
        with pytest.raises(RuntimeError):
            validate_and_rewrite_tree(tmp_path)
        err = capsys.readouterr().err
        assert "A.txt" in err
        assert "B.txt" in err


class TestMain:
    def test_check_flag_validates_only(
        self, tmp_path: Path, capsys: pytest.CaptureFixture
    ):
        (tmp_path / "a.txt").write_text("pure ascii", encoding="ascii")
        with patch("sys.argv", ["enforce_ascii", str(tmp_path), "--check"]):
            from scripts.enforce_ascii import main

            main()
        out = capsys.readouterr().out
        assert "OK" in out
