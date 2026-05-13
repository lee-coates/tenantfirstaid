"""Tests for scripts.shared."""

import argparse

import pytest

from scripts.shared import validate_resource_name


class TestValidateResourceName:
    @pytest.mark.parametrize("name", ["my-ds", "abc123", "a" * 63, "a-b-c"])
    def test_valid_names_pass(self, name):
        assert validate_resource_name(name) == name

    @pytest.mark.parametrize(
        "name", ["UPPERCASE", "a" * 64, "has space", "under_score", "", "-leading-hyphen"]
    )
    def test_invalid_names_raise(self, name):
        with pytest.raises(argparse.ArgumentTypeError):
            validate_resource_name(name)
