"""Tests for scripts/generate_types.py."""

import pytest

from scripts.generate_types import (
    HEADER,
    enum_to_ts_type,
    make_file,
    model_to_interface,
    py_annotation_to_ts,
)
from tenantfirstaid.location import Location, OregonCity, UsaState


def test_py_annotation_to_ts_str():
    assert py_annotation_to_ts(str) == "string"


def test_py_annotation_to_ts_str_enum():
    assert py_annotation_to_ts(OregonCity) == "TOregonCity"
    assert py_annotation_to_ts(UsaState) == "TUsaState"


def test_py_annotation_to_ts_literal():
    from typing import Literal

    assert py_annotation_to_ts(Literal["foo", "bar"]) == '"foo" | "bar"'


def test_py_annotation_to_ts_optional():
    from typing import Optional

    result = py_annotation_to_ts(Optional[str])
    assert "string" in result
    assert "null" in result


def test_py_annotation_to_ts_unsupported():
    with pytest.raises(TypeError, match="Unsupported annotation"):
        py_annotation_to_ts(int)


def test_enum_to_ts_type_oregon_city():
    result = enum_to_ts_type(OregonCity)
    assert result == 'type TOregonCity = "portland" | "eugene";'


def test_enum_to_ts_type_usa_state():
    result = enum_to_ts_type(UsaState)
    assert result == 'type TUsaState = "or" | "other";'


def test_model_to_interface_location():
    result = model_to_interface(Location)
    assert "interface ILocation {" in result
    assert "  city: TOregonCity | null;" in result
    assert "  state: TUsaState | null;" in result
    assert "}" in result


def test_make_file_structure():
    result = make_file(["type Foo = string;"], ["Foo"])
    assert result.startswith(HEADER)
    assert "type Foo = string;" in result
    assert "export type { Foo };" in result
    assert result.endswith("\n")


def test_make_file_multiple_exports():
    result = make_file(["type A = string;", "type B = string;"], ["A", "B"])
    assert "export type { A, B };" in result
