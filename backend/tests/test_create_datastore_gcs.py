"""Tests for scripts.create_datastore_gcs."""

from unittest.mock import MagicMock, patch

import pytest
from google.api_core import exceptions as gcp_exceptions

from scripts.create_datastore_gcs import (
    GCS_DATA_SCHEMA,
    DatastoreError,
    _branch_path,
    _collection_path,
    _datastore_path,
    check_bucket_location_compat,
    create_datastore,
    delete_datastore,
    import_documents,
    main,
)


class TestPathHelpers:
    def test_collection_path(self):
        assert _collection_path("my-project", "global") == (
            "projects/my-project/locations/global/collections/default_collection"
        )

    def test_datastore_path(self):
        assert _datastore_path("my-project", "global", "my-ds") == (
            "projects/my-project/locations/global/collections/default_collection"
            "/dataStores/my-ds"
        )

    def test_branch_path(self):
        assert _branch_path("my-project", "us", "my-ds") == (
            "projects/my-project/locations/us/collections/default_collection"
            "/dataStores/my-ds/branches/default_branch"
        )


class TestCheckBucketLocationCompat:
    def _make_client(self, bucket_location: str) -> MagicMock:
        client = MagicMock()
        bucket = MagicMock()
        bucket.location = bucket_location
        client.get_bucket.return_value = bucket
        return client

    @pytest.mark.parametrize(
        "bucket_location,datastore_location",
        [
            ("US", "global"),
            ("EU", "global"),
            ("US-CENTRAL1", "global"),
            ("US", "us"),
            ("US-EAST1", "us"),
            ("EU", "eu"),
            ("EUROPE-WEST1", "eu"),
            ("EU-WEST1", "eu"),
        ],
    )
    def test_compatible_pairs_do_not_raise(self, bucket_location, datastore_location):
        client = self._make_client(bucket_location)
        check_bucket_location_compat(client, "my-bucket", datastore_location)

    @pytest.mark.parametrize(
        "bucket_location,datastore_location",
        [
            ("EU", "us"),
            ("EUROPE-WEST1", "us"),
            ("US", "eu"),
            ("US-CENTRAL1", "eu"),
        ],
    )
    def test_incompatible_pairs_raise_datastore_error(
        self, bucket_location, datastore_location
    ):
        client = self._make_client(bucket_location)
        with pytest.raises(DatastoreError, match="incompatible"):
            check_bucket_location_compat(client, "my-bucket", datastore_location)

    def test_error_message_includes_bucket_name_and_locations(self):
        client = self._make_client("EU")
        with pytest.raises(DatastoreError) as exc_info:
            check_bucket_location_compat(client, "my-bucket", "us")
        assert "my-bucket" in str(exc_info.value)
        assert "EU" in str(exc_info.value)
        assert "us" in str(exc_info.value)


class TestCreateDatastore:
    def _make_client(
        self,
        datastore_name: str = "projects/p/locations/global/collections/default_collection/dataStores/my-ds",
    ):
        client = MagicMock()
        operation = MagicMock()
        result = MagicMock()
        result.name = datastore_name
        operation.result.return_value = result
        client.create_data_store.return_value = operation
        return client

    def test_creates_and_returns_datastore(self):
        client = self._make_client()

        result = create_datastore(client, "my-project", "global", "my-ds", "My DS")

        client.create_data_store.assert_called_once()
        request = client.create_data_store.call_args.kwargs["request"]
        assert request.data_store_id == "my-ds"
        assert request.data_store.display_name == "My DS"
        assert request.parent == _collection_path("my-project", "global")
        assert result is client.create_data_store.return_value.result.return_value

    def test_already_exists_raises_datastore_error(self):
        client = MagicMock()
        client.create_data_store.side_effect = gcp_exceptions.AlreadyExists("exists")

        with pytest.raises(DatastoreError, match="already exists"):
            create_datastore(client, "my-project", "global", "my-ds", "My DS")


class TestImportDocuments:
    def _make_client(
        self,
        success: int = 12,
        failure: int = 0,
        error_samples: list[MagicMock] | None = None,
    ):
        client = MagicMock()
        operation = MagicMock()
        operation.operation.name = "operations/import-123"
        operation.result.return_value = MagicMock(error_samples=error_samples or [])
        operation.metadata = MagicMock(success_count=success, failure_count=failure)
        client.import_documents.return_value = operation
        return client

    def test_wait_true_polls_and_prints_counts(self, capsys):
        client = self._make_client(success=10, failure=0)

        import_documents(
            client, "my-project", "global", "my-ds", "my-bucket", wait=True
        )

        client.import_documents.return_value.result.assert_called_once()
        out = capsys.readouterr().out
        assert "success=10" in out
        assert "failure=0" in out

    def test_wait_false_skips_polling(self, capsys):
        client = self._make_client()

        import_documents(
            client, "my-project", "global", "my-ds", "my-bucket", wait=False
        )

        client.import_documents.return_value.result.assert_not_called()
        assert "--no-wait" in capsys.readouterr().out

    def test_error_samples_are_printed(self, capsys):
        err = MagicMock()
        err.message = "bad doc"
        client = self._make_client(failure=1, error_samples=[err])

        import_documents(
            client, "my-project", "global", "my-ds", "my-bucket", wait=True
        )

        assert "bad doc" in capsys.readouterr().out

    def test_request_points_at_correct_bucket_and_branch(self):
        client = self._make_client()

        import_documents(
            client, "my-project", "global", "my-ds", "my-bucket", wait=False
        )

        request = client.import_documents.call_args.kwargs["request"]
        assert request.parent == _branch_path("my-project", "global", "my-ds")
        assert request.gcs_source.input_uris == ["gs://my-bucket/metadata.jsonl"]
        assert request.gcs_source.data_schema == GCS_DATA_SCHEMA


class TestDeleteDatastore:
    def test_calls_delete_and_waits(self):
        client = MagicMock()
        operation = MagicMock()
        client.delete_data_store.return_value = operation

        delete_datastore(client, "projects/p/locations/global/.../dataStores/my-ds")

        client.delete_data_store.assert_called_once()
        request = client.delete_data_store.call_args.kwargs["request"]
        assert request.name == "projects/p/locations/global/.../dataStores/my-ds"
        operation.result.assert_called_once()


class TestMain:
    _ARGV_BASE = [
        "create_datastore_gcs",
        "--bucket",
        "my-bucket",
        "--datastore-name",
        "my-ds",
    ]

    def _patch_singleton(self):
        singleton = MagicMock()
        singleton.GOOGLE_CLOUD_PROJECT = "my-project"
        singleton.GOOGLE_APPLICATION_CREDENTIALS = "/fake/creds.json"
        return patch("scripts.create_datastore_gcs.SINGLETON", singleton)

    def _patch_storage_client(self, bucket_location: str = "US"):
        storage_client = MagicMock()
        bucket = MagicMock()
        bucket.location = bucket_location
        storage_client.get_bucket.return_value = bucket
        return patch(
            "scripts.create_datastore_gcs.storage.Client",
            return_value=storage_client,
        )

    def test_dry_run_does_not_call_api(self, capsys):
        with (
            self._patch_singleton(),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DataStoreServiceClient"
            ) as ds_cls,
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DocumentServiceClient"
            ) as doc_cls,
            patch("sys.argv", [*self._ARGV_BASE, "--dry-run"]),
        ):
            main()

        ds_cls.assert_not_called()
        doc_cls.assert_not_called()
        assert "[dry-run]" in capsys.readouterr().out

    def test_happy_path_creates_datastore_and_imports(self):
        ds_client = MagicMock()
        doc_client = MagicMock()

        created_ds = MagicMock()
        created_ds.name = "projects/my-project/locations/global/.../dataStores/my-ds"
        ds_operation = MagicMock()
        ds_operation.result.return_value = created_ds
        ds_client.create_data_store.return_value = ds_operation

        import_operation = MagicMock()
        import_operation.operation.name = "operations/import-1"
        import_operation.result.return_value = MagicMock(error_samples=[])
        import_operation.metadata = MagicMock(success_count=12, failure_count=0)
        doc_client.import_documents.return_value = import_operation

        with (
            self._patch_singleton(),
            patch("scripts.create_datastore_gcs.load_gcp_credentials"),
            self._patch_storage_client(),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DataStoreServiceClient",
                return_value=ds_client,
            ),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DocumentServiceClient",
                return_value=doc_client,
            ),
            patch("sys.argv", self._ARGV_BASE),
        ):
            main()

        ds_client.create_data_store.assert_called_once()
        doc_client.import_documents.assert_called_once()

    def test_incompatible_bucket_location_raises_before_api_calls(self):
        ds_client = MagicMock()

        with (
            self._patch_singleton(),
            patch("scripts.create_datastore_gcs.load_gcp_credentials"),
            self._patch_storage_client(bucket_location="EU"),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DataStoreServiceClient",
                return_value=ds_client,
            ),
            patch("scripts.create_datastore_gcs.discoveryengine.DocumentServiceClient"),
            patch("sys.argv", [*self._ARGV_BASE, "--location", "us"]),
        ):
            with pytest.raises(DatastoreError, match="incompatible"):
                main()

        ds_client.create_data_store.assert_not_called()

    def test_already_exists_raises_datastore_error(self):
        ds_client = MagicMock()
        ds_client.create_data_store.side_effect = gcp_exceptions.AlreadyExists("exists")

        with (
            self._patch_singleton(),
            patch("scripts.create_datastore_gcs.load_gcp_credentials"),
            self._patch_storage_client(),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DataStoreServiceClient",
                return_value=ds_client,
            ),
            patch("scripts.create_datastore_gcs.discoveryengine.DocumentServiceClient"),
            patch("sys.argv", self._ARGV_BASE),
        ):
            with pytest.raises(DatastoreError, match="already exists"):
                main()

    def test_import_failure_rolls_back_datastore(self):
        ds_client = MagicMock()
        doc_client = MagicMock()

        created_ds = MagicMock()
        created_ds.name = (
            "projects/my-project/locations/global/collections/default_collection"
            "/dataStores/my-ds"
        )
        ds_operation = MagicMock()
        ds_operation.result.return_value = created_ds
        ds_client.create_data_store.return_value = ds_operation

        doc_client.import_documents.side_effect = RuntimeError("network timeout")

        with (
            self._patch_singleton(),
            patch("scripts.create_datastore_gcs.load_gcp_credentials"),
            self._patch_storage_client(),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DataStoreServiceClient",
                return_value=ds_client,
            ),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DocumentServiceClient",
                return_value=doc_client,
            ),
            patch("sys.argv", self._ARGV_BASE),
        ):
            with pytest.raises(DatastoreError, match="Import failed"):
                main()

        ds_client.delete_data_store.assert_called_once()

    def test_import_failure_with_cleanup_error_reports_manual_step(self, capsys):
        ds_client = MagicMock()
        doc_client = MagicMock()

        created_ds = MagicMock()
        created_ds.name = (
            "projects/my-project/locations/global/collections/default_collection"
            "/dataStores/my-ds"
        )
        ds_operation = MagicMock()
        ds_operation.result.return_value = created_ds
        ds_client.create_data_store.return_value = ds_operation
        ds_client.delete_data_store.side_effect = RuntimeError("permission denied")

        doc_client.import_documents.side_effect = RuntimeError("network timeout")

        with (
            self._patch_singleton(),
            patch("scripts.create_datastore_gcs.load_gcp_credentials"),
            self._patch_storage_client(),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DataStoreServiceClient",
                return_value=ds_client,
            ),
            patch(
                "scripts.create_datastore_gcs.discoveryengine.DocumentServiceClient",
                return_value=doc_client,
            ),
            patch("sys.argv", self._ARGV_BASE),
        ):
            with pytest.raises(DatastoreError, match="Import failed"):
                main()

        err = capsys.readouterr().err
        assert "Rollback failed" in err
        assert created_ds.name in err
