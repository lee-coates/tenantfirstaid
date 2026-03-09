"""Generate a JSON Schema for all Pydantic models exported to the frontend.

Usage: uv run python scripts/generate_types.py | npx json2ts --unreachableDefinitions --additionalProperties false > frontend/src/types/models.ts
Or use: make generate-types
"""

import json

from pydantic import RootModel
from pydantic.json_schema import models_json_schema

from tenantfirstaid.location import Location
from tenantfirstaid.schema import LetterChunk, ReasoningChunk, TextChunk


class ResponseChunk(RootModel[TextChunk | ReasoningChunk | LetterChunk]):
    """Union of all possible streaming response chunk types."""


_, schema = models_json_schema(
    [
        (Location, "serialization"),
        (TextChunk, "serialization"),
        (ReasoningChunk, "serialization"),
        (LetterChunk, "serialization"),
        (ResponseChunk, "serialization"),
    ],
    title="TenantFirstAid Models",
)

print(json.dumps(schema, indent=2))
