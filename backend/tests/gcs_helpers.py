"""Shared mock builders for the GCS provisioning script tests."""

from unittest.mock import MagicMock, patch


def patch_singleton(target: str):
    """Patch a script module's SINGLETON with a fake GCP project and credentials path.

    ``target`` is the dotted path to the module's SINGLETON, e.g.
    "scripts.create_app_gcs.SINGLETON".
    """
    singleton = MagicMock()
    singleton.GOOGLE_CLOUD_PROJECT = "my-project"
    singleton.GOOGLE_APPLICATION_CREDENTIALS = "/fake/creds.json"
    return patch(target, singleton)
