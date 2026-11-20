import hashlib
import re


def sanitize_helm_name(raw: str, max_length: int = None, disambiguate: bool = False) -> str:
    """Builds a Kubernetes/Helm-safe DNS-1123 label fragment from an arbitrary identifier
    (dataset_id, connector_id, or a combination): lowercase, any run of non-alphanumeric
    characters collapsed to a single hyphen, and leading/trailing hyphens stripped so that
    truncation never leaves an invalid boundary character.

    disambiguate=True appends a short deterministic hash of the raw (pre-sanitize) id, so two
    ids that only differ in a character this function collapses -- "postgres.connector" and
    "postgres_connector" both sanitize to "postgres-connector" -- still produce distinct names.
    Deterministic rather than random: install, uninstall and restart all independently
    recompute this name for the same connector id and must agree every time. Use it for every
    call site that builds a persistent Flink release/job name; the Spark cron-job path already
    gets per-install uniqueness from its own random suffix and is looked up by label on
    uninstall rather than recomputed, so it does not need this.

    Ported from management-api-service's api/util/helm_naming.py (PR #42) to avoid a third,
    diverging inline implementation of the same fix in this repo.
    """
    name = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")
    if disambiguate:
        suffix = hashlib.sha1(raw.encode()).hexdigest()[:6]
        budget = max_length - len(suffix) - 1 if max_length is not None else None
        if budget is not None:
            name = name[:budget].rstrip("-")
        return f"{name}-{suffix}"
    if max_length is not None:
        name = name[:max_length].rstrip("-")
    return name
