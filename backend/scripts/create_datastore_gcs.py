"""Create a Vertex AI Search datastore and import documents from a GCS bucket.

Companion to scripts.upload_to_gcs: assumes `make upload-to-gcs` has already
populated gs://<bucket>/ with the law documents and metadata.jsonl. Creates a
new (unstructured, search-only) datastore configured for GCS ingestion and
triggers an import from gs://<bucket>/metadata.jsonl. A sibling script could
configure a different content source (e.g. website URLs for advanced site
search) -- this one is GCS-specific.

Imports are long-running on the Vertex side; this script polls until the
operation finishes unless --no-wait is passed.

To run:
  make create-datastore-gcs GCS_BUCKET_NAME=<bucket> DATASTORE_NAME=<name>
  make create-datastore-gcs GCS_BUCKET_NAME=<bucket> DATASTORE_NAME=<name> LOCATION=us
  make create-datastore-gcs GCS_BUCKET_NAME=<bucket> DATASTORE_NAME=<name> DATASTORE_OPTIONS=--dry-run
  make create-datastore-gcs GCS_BUCKET_NAME=<bucket> DATASTORE_NAME=<name> DATASTORE_OPTIONS=--no-wait
"""

import argparse
import sys
from typing import cast

from google.api_core import exceptions as gcp_exceptions
from google.cloud import discoveryengine_v1 as discoveryengine

from tenantfirstaid.constants import SINGLETON
from tenantfirstaid.google_auth import (
    discoveryengine_client_options,
    load_gcp_credentials,
)

DEFAULT_LOCATION = "global"
METADATA_OBJECT_NAME = "metadata.jsonl"
# The Discovery Engine document schema for metadata.jsonl entries that are full
# Document protos (produced by generate_metadata_jsonl.py). Other valid values
# are "content" and "custom", but those require different metadata formats.
GCS_DATA_SCHEMA = "document"


class DatastoreError(RuntimeError):
    """Raised when the datastore pipeline cannot proceed."""


def _collection_path(project: str, location: str) -> str:
    return f"projects/{project}/locations/{location}/collections/default_collection"


def _datastore_path(project: str, location: str, datastore_id: str) -> str:
    return f"{_collection_path(project, location)}/dataStores/{datastore_id}"


def _branch_path(project: str, location: str, datastore_id: str) -> str:
    return f"{_datastore_path(project, location, datastore_id)}/branches/default_branch"


def create_datastore(
    client: discoveryengine.DataStoreServiceClient,
    project: str,
    location: str,
    datastore_id: str,
    display_name: str,
) -> discoveryengine.DataStore:
    """Create an unstructured, search-only datastore. Fails if datastore_id already exists."""
    parent = _collection_path(project, location)
    data_store = discoveryengine.DataStore(
        display_name=display_name,
        industry_vertical=discoveryengine.IndustryVertical.GENERIC,
        solution_types=[discoveryengine.SolutionType.SOLUTION_TYPE_SEARCH],
        content_config=discoveryengine.DataStore.ContentConfig.CONTENT_REQUIRED,
    )
    request = discoveryengine.CreateDataStoreRequest(
        parent=parent,
        data_store=data_store,
        data_store_id=datastore_id,
    )
    try:
        operation = client.create_data_store(request=request)
    except gcp_exceptions.AlreadyExists as e:
        raise DatastoreError(
            f"Datastore {datastore_id!r} already exists under {parent}. "
            "Pick a different DATASTORE_ID or delete the existing datastore first."
        ) from e

    # create_data_store is a fast LRO; waiting keeps the script linear.
    return cast(discoveryengine.DataStore, operation.result())


def import_documents(
    client: discoveryengine.DocumentServiceClient,
    project: str,
    location: str,
    datastore_id: str,
    bucket: str,
    wait: bool,
) -> None:
    """Trigger import of gs://<bucket>/metadata.jsonl into the datastore's default branch."""
    parent = _branch_path(project, location, datastore_id)
    gcs_uri = f"gs://{bucket}/{METADATA_OBJECT_NAME}"
    request = discoveryengine.ImportDocumentsRequest(
        parent=parent,
        gcs_source=discoveryengine.GcsSource(
            input_uris=[gcs_uri],
            data_schema=GCS_DATA_SCHEMA,
        ),
        reconciliation_mode=discoveryengine.ImportDocumentsRequest.ReconciliationMode.INCREMENTAL,
    )
    operation = client.import_documents(request=request)
    print(f"Started import: {operation.operation.name}")

    if not wait:
        print("Skipping wait (--no-wait). Check the operation status in the console.")
        return

    print("Waiting for import to finish (this can take several minutes)...")
    response = operation.result()
    metadata = cast(discoveryengine.ImportDocumentsMetadata, operation.metadata)
    print(
        "Import finished. "
        f"success={metadata.success_count} failure={metadata.failure_count}"
    )
    if response.error_samples:
        print(f"First {len(response.error_samples)} error sample(s):")
        for err in response.error_samples:
            print(f"  - {err.message}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--bucket",
        required=True,
        help="GCS bucket holding metadata.jsonl and the document objects.",
    )
    parser.add_argument(
        "--datastore-name",
        required=True,
        help="Name for the new datastore. Lowercase letters, digits, hyphens (1-63 chars). You choose this; it becomes the resource ID.",
    )
    parser.add_argument(
        "--display-name",
        default=None,
        help="Human-readable display name (default: datastore ID).",
    )
    parser.add_argument(
        "--location",
        default=DEFAULT_LOCATION,
        help=(
            f"Vertex AI Search location (default: {DEFAULT_LOCATION}). "
            "Typical values: global, us, eu."
        ),
    )
    parser.add_argument(
        "--no-wait",
        dest="wait",
        action="store_false",
        help="Return as soon as the import is queued instead of polling to completion.",
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
    display_name = args.display_name or args.datastore_name

    print(
        f"Plan: create datastore {_datastore_path(project, args.location, args.datastore_name)!r} "
        f"(display_name={display_name!r}) and import from "
        f"gs://{args.bucket}/{METADATA_OBJECT_NAME}."
    )

    if args.dry_run:
        print("[dry-run] no Discovery Engine API calls made.")
        return

    credentials = load_gcp_credentials(SINGLETON.GOOGLE_APPLICATION_CREDENTIALS)
    client_options = discoveryengine_client_options(args.location)

    datastore_client = discoveryengine.DataStoreServiceClient(
        credentials=credentials, client_options=client_options
    )
    created = create_datastore(
        datastore_client, project, args.location, args.datastore_name, display_name
    )
    datastore_id = created.name.split("/")[-1]
    print(f"Created datastore: {created.name}")

    document_client = discoveryengine.DocumentServiceClient(
        credentials=credentials, client_options=client_options
    )
    import_documents(
        document_client,
        project,
        args.location,
        datastore_id,
        args.bucket,
        wait=args.wait,
    )
    console_url = (
        f"https://console.cloud.google.com/gen-app-builder/locations/{args.location}"
        f"/collections/default_collection/data-stores/{datastore_id}"
        f"/data/documents?project={project}"
    )
    print(
        f"\nDone. Your datastore ID is: {datastore_id}\n"
        f"View it in the GCP console: {console_url}\n"
        f"Next: run make create-app-gcs DATASTORE_ID={datastore_id} APP_NAME=<name> to create and attach a Search app."
    )


if __name__ == "__main__":
    try:
        main()
    except DatastoreError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
