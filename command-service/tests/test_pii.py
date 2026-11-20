import pytest

from service.detect_pii_service import DetectPIIService


@pytest.fixture
def service():
    return DetectPIIService()


def _types_by_field(results):
    return {r["field"]: r["type"] for r in results}


def test_prefixed_fields_are_detected(service):
    event = {
        "customer_email": "lallageorge@example.com",
        "customer_phone_number": "+910191540224",
        "customer_address": "H.No. 20, Sandhu Road, Dhule 002683",
    }
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["customer_email"] == "internet"
    assert types["customer_phone_number"] == "phone"
    assert types["customer_address"] == "address"


def test_name_fields_are_detected(service):
    event = {"customer_name": "Jane Doe", "full_name": "John Smith", "fullName": "Alex Lee"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["customer_name"] == "name"
    assert types["full_name"] == "name"
    assert types["fullName"] == "name"


def test_platform_metadata_name_fields_are_not_flagged(service):
    # Platform metadata *_name fields are not person names.
    event = {
        "dataset_name": "x", "table_name": "x", "job_name": "x",
        "file_name": "x", "event_name": "x", "column_name": "x",
    }
    types = _types_by_field(service.detect_pii_fields(event))
    assert types == {}


def test_real_name_fields_still_flagged_alongside_metadata_exclusions(service):
    event = {"first_name": "Ravi", "customer_name": "x", "full_name": "x"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["first_name"] == "name"
    assert types["customer_name"] == "name"
    assert types["full_name"] == "name"


def test_financial_rule_no_longer_flags_ordinary_business_fields(service):
    # Bare business nouns are ids and amounts, not account numbers.
    event = {"transaction_id": "x", "account_balance": "x", "credit_limit": "x"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert types == {}


def test_financial_rule_still_flags_real_account_identifiers(service):
    event = {"account_number": "123", "card_number": "456", "swift_code": "ABCD", "iban": "x"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["account_number"] == "financial"
    assert types["card_number"] == "financial"
    assert types["swift_code"] == "financial"
    assert types["iban"] == "financial"


def test_repeated_matches_within_one_rule_do_not_lower_the_score(service):
    # Matching one rule twice must not lower the score.
    double_match = service.detect_pii_fields({"first_name_last_name": "x"})
    single_match = service.detect_pii_fields({"first_name": "x"})

    double_score = next(r["score"] for r in double_match if r["field"] == "first_name_last_name")
    single_score = next(r["score"] for r in single_match if r["field"] == "first_name")

    assert double_score >= single_score


def test_error_fallback_matches_declared_str_types(service, monkeypatch):
    def boom(*args, **kwargs):
        raise ValueError("synthetic failure")

    monkeypatch.setattr(service.model, "detect_pii", boom)
    result = service.detect_pii_fields({"any_field": "value"})

    assert isinstance(result, dict)
    assert isinstance(result["errorMsg"], str)
    assert isinstance(result["errorTrace"], str)


# Regression coverage for review findings on #394 round 4 (ported from management-api-service#40).


def _types_per_field(results):
    types = {}
    for r in results:
        types.setdefault(r["field"], set()).add(r["type"])
    return types


def test_unlisted_name_compounds_are_not_flagged(service):
    event = {f: "x" for f in ["schema_name", "field_name", "topic_name", "connector_name",
                              "index_name", "source_name", "stream_name", "name_field"]}
    assert "name" not in set().union(*_types_per_field(service.detect_pii_fields(event)).values() or [set()])


def test_person_name_compounds_are_flagged(service):
    fields = ["first_name", "lastName", "middle-name", "given_name", "surname", "maiden_name",
              "user_name", "username", "person_name", "employee_name", "name", "name2"]
    types = _types_per_field(service.detect_pii_fields({f: "x" for f in fields}))
    assert all("name" in types.get(f, set()) for f in fields), types


def test_nested_name_segments_are_flagged(service):
    # The console sends flattened events, so a nested person name arrives as "student.name".
    fields = ["student.name", "guardian.name", "name.first", "customer.first_name"]
    types = _types_per_field(service.detect_pii_fields({f: "x" for f in fields}))
    assert all("name" in types.get(f, set()) for f in fields), types


def test_any_separator_is_normalized_before_matching(service):
    event = {"dataset-name": "x", "dataset name": "x", "first-name": "x", "customer name": "x"}
    types = _types_per_field(service.detect_pii_fields(event))
    assert "name" not in types.get("dataset-name", set())
    assert "name" not in types.get("dataset name", set())
    assert "name" in types["first-name"]
    assert "name" in types["customer name"]


def test_credit_and_debit_card_field_names_are_financial(service):
    event = {"credit_card": "xxxx", "debitCard": "xxxx", "credit-card": "xxxx"}
    types = _types_per_field(service.detect_pii_fields(event))
    assert all("financial" in types[f] for f in event), types


def test_common_person_name_fields_are_flagged(service):
    fields = ["student_name", "guardian_name", "father_name", "mother_name", "teacher_name",
              "patient_name", "account_holder_name", "cust_name", "emp_name", "fname", "lname", "name_1",
              "STUDENT_NAME", "STUDENT_GUARDIAN_1_NAME", "STUDENT_SOCIAL_NAME",
              "PROFESSIONAL_NAME", "PROFESSIONAL_SOCIAL_NAME"]
    types = _types_per_field(service.detect_pii_fields({f: "x" for f in fields}))
    assert [f for f in fields if "name" not in types.get(f, set())] == []


def test_name_lookalikes_are_not_flagged(service):
    fields = ["filename", "file_name", "hostname", "name_field", "dataset_name", "rename_flag"]
    types = _types_per_field(service.detect_pii_fields({f: "x" for f in fields}))
    assert [f for f in fields if "name" in types.get(f, set())] == []


def test_card_number_value_needs_its_own_digit_boundary(service):
    flagged = _types_per_field(service.detect_pii_fields({"v": "4111111111111111"}))
    long_id = _types_per_field(service.detect_pii_fields({"v": "1234567890123456789"}))
    assert "financial" in flagged.get("v", set())
    assert "financial" not in long_id.get("v", set())


def test_nested_name_under_a_non_person_object_is_not_flagged(service):
    telemetry = ["pdata.name", "object.name", "device.name", "app.name", "context.pdata.name",
                 "edata.item.name", "product.name", "org.name", "channel.name", "course.name",
                 "batch.name", "content.name", "collection.name"]
    people = ["user.name", "guardian.name", "student.name", "name.first", "name_1"]
    types = _types_per_field(service.detect_pii_fields({f: "x" for f in telemetry + people}))
    assert [f for f in telemetry if "name" in types.get(f, set())] == []
    assert [f for f in people if "name" not in types.get(f, set())] == []
