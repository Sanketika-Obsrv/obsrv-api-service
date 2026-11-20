from types import SimpleNamespace

from command import connector_command
from command.connector_command import ConnectorCommand


class FakeConfig:
    def find(self, key):
        return {"spark": {"namespace": "spark"}, "flink": {"namespace": "flink-connectors"}}


def _command(monkeypatch, helm_ls_ok, releases=""):
    calls = []

    def fake_run(cmd, **kwargs):
        calls.append(cmd)
        if cmd[:2] == ["helm", "ls"]:
            return SimpleNamespace(returncode=0 if helm_ls_ok else 1, stdout=releases.encode(), stderr=b"boom")
        return SimpleNamespace(returncode=1 if cmd[0] == "kubectl" else 0, stdout=b"", stderr=b"")

    monkeypatch.setattr(connector_command.subprocess, "run", fake_run)
    command = ConnectorCommand(FakeConfig(), db_service=None)
    monkeypatch.setattr(command, "_get_registered_connectors", lambda runtime: [("kafka-connector-1.0.0", 0)])
    return command, calls


def _uninstalls(calls):
    return [c[2] for c in calls if c[:2] == ["helm", "uninstall"]]


def test_cleanup_skips_flink_uninstall_when_releases_cannot_be_listed(monkeypatch):
    command, calls = _command(monkeypatch, helm_ls_ok=False)
    command._stop_connector_jobs(is_masterdata=False, dataset_id="ds-1")
    assert _uninstalls(calls) == []


def test_cleanup_uninstalls_a_release_still_under_its_old_name(monkeypatch):
    command, calls = _command(monkeypatch, helm_ls_ok=True, releases="kafka-connector-1-0-0\n")
    command._stop_connector_jobs(is_masterdata=False, dataset_id="ds-1")
    assert _uninstalls(calls) == ["kafka-connector-1-0-0"]
