import pytest
from unittest.mock import MagicMock
from app.services.namespace import NamespaceService
from app.schemas.namespace import NamespaceCreate


def test_upsert_namespace(mock_db):
    namespace_data = NamespaceCreate(name="namespace-test")

    new_namespace = NamespaceService.upsert_namespace(
        db=mock_db, namespace=namespace_data
    )

    mock_namespace = MagicMock()
    mock_namespace.name = "namespace-test"
    mock_namespace.uuid = new_namespace.uuid

    assert new_namespace.name == "namespace-test"
    assert new_namespace.uuid == mock_namespace.uuid

    mock_db.query.return_value.filter.return_value.first.return_value = mock_namespace
    get_namespace = NamespaceService.get_namespace(mock_db, new_namespace.uuid)

    assert get_namespace is not None
    assert get_namespace.uuid == new_namespace.uuid
    assert get_namespace.name == "namespace-test"
