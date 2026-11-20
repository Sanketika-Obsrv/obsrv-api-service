from util.helm_naming import FLINK_RELEASE_MAX_LENGTH, flink_release_name, sanitize_helm_name


def test_dots_and_underscores_both_sanitized():
    # The bug this fixes: connector_command.py's Flink uninstall/install paths only stripped
    # dots and underscores inline, with no lowercasing and no leading/trailing-separator strip.
    assert sanitize_helm_name("postgres_connector.1.0") == "postgres-connector-1-0"


def test_leading_and_trailing_separators_stripped():
    assert sanitize_helm_name("_leading_and_trailing_") == "leading-and-trailing"


def test_consecutive_separators_collapse_to_one_hyphen():
    assert sanitize_helm_name("a.._b") == "a-b"


def test_case_insensitive():
    # connector_command.py:150's job_name had no .lower() -- an uppercase connector_id
    # produced an invalid (uppercase) Helm release name.
    assert sanitize_helm_name("Postgres_Connector.1.0") == "postgres-connector-1-0"


def test_disambiguate_keeps_colliding_ids_distinct():
    # postgres.connector and postgres_connector both sanitize to postgres-connector without
    # disambiguation -- "helm upgrade --install" with no random suffix on the Flink path
    # means the second install silently overwrites the first connector's deployment.
    a = sanitize_helm_name("postgres.connector", disambiguate=True)
    b = sanitize_helm_name("postgres_connector", disambiguate=True)
    assert a != b


def test_disambiguate_is_deterministic():
    # Install and uninstall independently recompute this name for the same connector id and
    # must agree -- a random suffix would break that.
    assert sanitize_helm_name("Postgres_Connector.1.0", disambiguate=True) == \
        sanitize_helm_name("Postgres_Connector.1.0", disambiguate=True)


# Regression coverage for review findings on #394 round 4 (ported from management-api-service#42).


def test_disambiguate_is_case_insensitive():
    assert sanitize_helm_name("Postgres_Connector", disambiguate=True) == \
        sanitize_helm_name("postgres_connector", disambiguate=True)


def test_disambiguate_empty_name_is_still_a_valid_label():
    name = sanitize_helm_name("...", disambiguate=True)
    assert name.startswith("c-") and len(name) == 8


def test_flink_release_name_fits_the_chart_service_names():
    name = flink_release_name("x" * 80, deployed_releases=set())
    assert len(name) <= FLINK_RELEASE_MAX_LENGTH
    assert len(f"{name}-taskmanager") <= 63


def test_flink_release_name_keeps_an_existing_pre_sanitizer_release():
    assert flink_release_name("kafka-connector-1.0.0", {"kafka-connector-1-0-0"}) == "kafka-connector-1-0-0"


def test_flink_release_name_uses_sanitized_name_for_new_installs():
    name = flink_release_name("kafka-connector-1.0.0", {"some-other-release"})
    assert name == sanitize_helm_name("kafka-connector-1.0.0", max_length=FLINK_RELEASE_MAX_LENGTH, disambiguate=True)


def test_flink_release_name_matches_the_legacy_name_exactly():
    # The new name contains the legacy name as a prefix; that must not count as a legacy release.
    new_name = sanitize_helm_name("kafka-connector-1.0.0", max_length=FLINK_RELEASE_MAX_LENGTH, disambiguate=True)
    assert flink_release_name("kafka-connector-1.0.0", {new_name}) == new_name
