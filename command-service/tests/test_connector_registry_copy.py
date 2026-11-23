from types import SimpleNamespace

from command import connector_registry
from command.connector_registry import ConnectorRegistry


def _registry(monkeypatch, fail_on=None):
    calls = []

    def fake_run(cmd, stdin=None, **kwargs):
        calls.append((cmd, stdin.read() if stdin else None))
        failed = fail_on is not None and fail_on in " ".join(cmd)
        return SimpleNamespace(returncode=1 if failed else 0, stdout=b"", stderr=b"boom")

    monkeypatch.setattr(connector_registry.subprocess, "run", fake_run)
    # __init__ opens a DB connection and reads config; stream_copy_to_pod uses neither.
    return ConnectorRegistry.__new__(ConnectorRegistry), calls


def test_stream_copy_recreates_the_tree_without_kubectl_cp(tmp_path, monkeypatch):
    (tmp_path / "lib").mkdir()
    (tmp_path / "main.py").write_bytes(b"print(1)")
    (tmp_path / "lib" / "connector.jar").write_bytes(b"\x00jar")
    registry, calls = _registry(monkeypatch)

    assert registry.stream_copy_to_pod(str(tmp_path), "spark", "spark-0", "/data/connectors/pg-1.0.0")

    commands = [cmd for cmd, _ in calls]
    assert all(cmd[:2] == ["kubectl", "exec"] for cmd in commands)
    assert ["kubectl", "exec", "pod/spark-0", "-n", "spark", "--", "mkdir", "-p", "/data/connectors/pg-1.0.0/lib"] in commands
    streamed = {cmd[-1]: data for cmd, data in calls if data is not None}
    assert streamed == {
        "/data/connectors/pg-1.0.0/main.py": b"print(1)",
        "/data/connectors/pg-1.0.0/lib/connector.jar": b"\x00jar",
    }


def test_stream_copy_reports_failure_when_a_file_cannot_be_written(tmp_path, monkeypatch):
    (tmp_path / "main.py").write_bytes(b"print(1)")
    registry, _ = _registry(monkeypatch, fail_on="cat >")

    assert registry.stream_copy_to_pod(str(tmp_path), "spark", "spark-0", "/data/connectors/pg-1.0.0") is False


def test_stream_copy_passes_the_path_as_an_argument_not_shell_text(tmp_path, monkeypatch):
    (tmp_path / "it's.py").write_bytes(b"x")
    registry, calls = _registry(monkeypatch)

    assert registry.stream_copy_to_pod(str(tmp_path), "spark", "spark-0", "/data/c")

    cat = next(cmd for cmd, data in calls if data is not None)
    assert cat[-4:] == ["-c", 'cat > "$1"', "sh", "/data/c/it's.py"]
