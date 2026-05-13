"""Create a Vertex AI Search app and link it to an existing datastore.

Companion to scripts.create_datastore_gcs: assumes `make create-datastore-gcs` has
already created the datastore. Creates a new Search app, attaches the datastore to
it, and enables search queries against it.

To run:
  make create-app-gcs DATASTORE_ID=my-ds APP_NAME=my-app
  make create-app-gcs DATASTORE_ID=my-ds APP_NAME=my-app LOCATION=us
  make create-app-gcs DATASTORE_ID=my-ds APP_NAME=my-app APP_OPTIONS=--dry-run
"""

import argparse
import sys
from typing import cast

from google.api_core import exceptions as gcp_exceptions
from google.cloud import discoveryengine_v1 as discoveryengine

from scripts.shared import validate_resource_name
from tenantfirstaid.constants import SINGLETON
from tenantfirstaid.google_auth import (
    discoveryengine_client_options,
    load_gcp_credentials,
)

DEFAULT_LOCATION = "us"


class AppError(RuntimeError):
    """Raised when the app creation pipeline cannot proceed."""


def _collection_path(project: str, location: str) -> str:
    return f"projects/{project}/locations/{location}/collections/default_collection"


def _engine_path(project: str, location: str, engine_id: str) -> str:
    return f"{_collection_path(project, location)}/engines/{engine_id}"


def create_app(
    client: discoveryengine.EngineServiceClient,
    project: str,
    location: str,
    engine_id: str,
    display_name: str,
    datastore_id: str,
) -> discoveryengine.Engine:
    """Create a Search app linked to datastore_id. Fails if engine_id already exists."""
    parent = _collection_path(project, location)
    engine = discoveryengine.Engine(
        display_name=display_name,
        solution_type=discoveryengine.SolutionType.SOLUTION_TYPE_SEARCH,
        data_store_ids=[datastore_id],
        search_engine_config=discoveryengine.Engine.SearchEngineConfig(
            # Standard is sufficient for keyword + semantic search; upgrade to Enterprise
            # if advanced LLM features are needed.
            search_tier=discoveryengine.SearchTier.SEARCH_TIER_STANDARD,
        ),
    )
    request = discoveryengine.CreateEngineRequest(
        parent=parent,
        engine=engine,
        engine_id=engine_id,
    )
    try:
        operation = client.create_engine(request=request)
    except gcp_exceptions.AlreadyExists as e:
        raise AppError(
            f"App {engine_id!r} already exists under {parent}. "
            "Pick a different APP_NAME or delete the existing app first."
        ) from e

    return cast(discoveryengine.Engine, operation.result())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--datastore-id",
        required=True,
        help="Datastore ID to attach to the app (the ID printed by create-datastore-gcs).",
    )
    parser.add_argument(
        "--app-name",
        required=True,
        type=validate_resource_name,
        help="Name for the new Search app. Lowercase letters, digits, hyphens (1-63 chars). You choose this.",
    )
    parser.add_argument(
        "--display-name",
        default=None,
        help="Human-readable display name (default: app name).",
    )
    parser.add_argument(
        "--location",
        default=DEFAULT_LOCATION,
        help=(
            f"Vertex AI Search location (default: {DEFAULT_LOCATION}). "
            "Must match the location used in create-datastore-gcs."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the resolved plan but do not call the Discovery Engine API.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project = SINGLETON.GOOGLE_CLOUD_PROJECT
    display_name = args.display_name or args.app_name

    print(
        f"Plan: create Search app {_engine_path(project, args.location, args.app_name)!r} "
        f"(display_name={display_name!r}) linked to datastore {args.datastore_id!r}."
    )

    if args.dry_run:
        print("[dry-run] no Discovery Engine API calls made.")
        return

    credentials = load_gcp_credentials(SINGLETON.GOOGLE_APPLICATION_CREDENTIALS)
    client_options = discoveryengine_client_options(args.location)

    engine_client = discoveryengine.EngineServiceClient(
        credentials=credentials, client_options=client_options
    )
    created = create_app(
        engine_client,
        project,
        args.location,
        args.app_name,
        display_name,
        args.datastore_id,
    )
    app_id = created.name.split("/")[-1]
    console_url = (
        f"https://console.cloud.google.com/gen-app-builder/locations/{args.location}"
        f"/collections/default_collection/engines/{app_id}"
        f"?project={project}"
    )
    print(
        f"\nDone. Your app ID is: {app_id}\n"
        f"View it in the GCP console: {console_url}\n"
        f"Set VERTEX_AI_DATASTORE_LAWS={args.datastore_id} in your .env."
    )


if __name__ == "__main__":
    try:
        main()
    except AppError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
