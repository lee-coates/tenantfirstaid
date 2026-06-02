"""Shared utilities for the GCS and Vertex AI Search scripts."""

import argparse
import re

_NAME_PATTERN = re.compile(r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")


def validate_resource_name(value: str) -> str:
    if not _NAME_PATTERN.match(value):
        raise argparse.ArgumentTypeError(
            f"{value!r} is not a valid resource name. "
            "Use lowercase letters, digits, and hyphens only (1-63 chars); "
            "must begin and end with a letter or digit."
        )
    return value


def collection_path(project: str, location: str) -> str:
    return f"projects/{project}/locations/{location}/collections/default_collection"


def datastore_path(project: str, location: str, datastore_id: str) -> str:
    return f"{collection_path(project, location)}/dataStores/{datastore_id}"
