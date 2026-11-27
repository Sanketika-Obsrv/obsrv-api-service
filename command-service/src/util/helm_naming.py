import hashlib
import re

# 63-char Service name limit minus the chart's longest suffix, "-taskmanager".
FLINK_RELEASE_MAX_LENGTH = 51


def sanitize_helm_name(raw: str, max_length: int = None, disambiguate: bool = False) -> str:
    """Builds a DNS-1123-safe Helm release name fragment. See docs/adr/0001-helm-release-naming.md."""
    name = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")
    if disambiguate:
        suffix = hashlib.sha1(raw.lower().encode()).hexdigest()[:6]
        if not name:
            return f"c-{suffix}"
        budget = max_length - len(suffix) - 1 if max_length is not None else None
        if budget is not None:
            name = name[:budget].rstrip("-")
        return f"{name}-{suffix}"
    if max_length is not None:
        name = name[:max_length].rstrip("-")
    return name


def flink_release_name(connector_id: str, deployed_releases) -> str:
    """Keeps a release installed under the pre-sanitizer name; new installs get the sanitized name."""
    legacy_name = connector_id.replace(".", "-")
    if legacy_name in deployed_releases:
        return legacy_name
    return sanitize_helm_name(connector_id, max_length=FLINK_RELEASE_MAX_LENGTH, disambiguate=True)
