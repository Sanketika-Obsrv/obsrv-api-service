# 1. Helm release naming for connectors

## Status

Accepted

## Context

Connector Helm release names were built inline in several places in management-api-service and here with different rules. The Flink paths only replaced dots, the Spark paths only replaced underscores, and none lowercased consistently or respected Kubernetes length limits. Ids like `postgres_connector.1.0` or a long dataset id produced invalid names, and install and uninstall could compute different names for the same connector.

## Decision

- `sanitize_helm_name` (`command-service/src/util/helm_naming.py`) is the only place release names are built: lowercase, every run of non-alphanumeric characters becomes one hyphen, leading and trailing hyphens are stripped, and truncation never leaves a trailing hyphen.
- Spark releases use `max_length=45` plus the existing random 6-character suffix, which keeps the CronJob name within its 52-character limit. Spark uninstall looks the release up by label, so the name does not need to be reproducible.
- Flink releases are recomputed on install, uninstall and cleanup, so they must be deterministic. `disambiguate=True` appends the first 6 hex characters of the SHA-1 of the lowercased id. That keeps ids that only differ in a collapsed character (`postgres.connector` and `postgres_connector`) apart, while ids that differ only in case still map to one name. An id that sanitizes to nothing becomes `c-<hash>`.
- Flink names are capped at 51 characters (`FLINK_RELEASE_MAX_LENGTH`). The `flink-connector` chart creates Services named `<release>-jobmanager` and `<release>-taskmanager`, and a Service name is limited to 63 characters.
- `flink_release_name` keeps an existing release that was installed under the pre-sanitizer name (`connector_id.replace(".", "-")`). Install, uninstall and cleanup list the namespace's releases (`helm ls --all --short`) and reuse the old name if a release with exactly that name exists. Only new installs get the sanitized name.

## Consequences

Upgrading doesn't orphan running Flink connectors or start a second copy of them: an existing release keeps its old name until it is uninstalled. Each Flink install, uninstall and cleanup now runs one extra `helm ls` per namespace.

This repo carries a copy of management-api-service's implementation; the two should change together.
