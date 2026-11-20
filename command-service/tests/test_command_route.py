import asyncio
import importlib
import os
from types import SimpleNamespace

import pytest

from model.data_models import ActionResponse

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))


def _publish(monkeypatch, result):
    # routes builds a Config from a cwd-relative path at import; scoped to this test and undone after.
    monkeypatch.chdir(SRC_DIR)
    routes = importlib.import_module("routes")
    monkeypatch.setattr(routes.command_executor, "execute_command", lambda payload, ts: result)
    request = SimpleNamespace(id="req-1", data=SimpleNamespace(dataset_id="ds-1"))
    return asyncio.run(routes.publish_dataset(request))


def test_success_is_reported_only_for_200(monkeypatch):
    response = _publish(monkeypatch, ActionResponse(status="OK", status_code=200))
    assert (response.response_code, response.status_code) == ("OK", 200)


@pytest.mark.parametrize("code, message", [
    (400, "NO_LIVE_INSTANCES_FOUND"), (404, "DATASET_ID_NOT_FOUND"), (500, "FLINK_HELM_LIST_EXCEPTION"),
])
def test_any_non_200_status_is_reported_as_an_error(monkeypatch, code, message):
    response = _publish(monkeypatch, ActionResponse(status="ERROR", status_code=code, error_message=message))
    assert (response.response_code, response.status_code, response.result.message) == ("ERROR", code, message)
