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
    # "name" has no value pattern to corroborate or veto it, so it was flagging every
    # *_name field in the platform's own metadata, not just person names.
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
    # account/transaction/credit/debit/swift as bare nouns matched transaction_id,
    # account_balance, credit_limit -- identifiers and amounts, not account numbers.
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
    # 1/len(rule_matches) meant a field matching the same rule twice (both halves of
    # "first_name_last_name" hit the name rule) scored lower than matching once.
    double_match = service.detect_pii_fields({"first_name_last_name": "x"})
    single_match = service.detect_pii_fields({"name_field": "x"})

    double_score = next(r["score"] for r in double_match if r["field"] == "first_name_last_name")
    single_score = next(r["score"] for r in single_match if r["field"] == "name_field")

    assert double_score >= single_score


def test_error_fallback_matches_declared_str_types(service, monkeypatch):
    def boom(*args, **kwargs):
        raise ValueError("synthetic failure")

    monkeypatch.setattr(service.model, "detect_pii", boom)
    result = service.detect_pii_fields({"any_field": "value"})

    assert isinstance(result, dict)
    assert isinstance(result["errorMsg"], str)
    assert isinstance(result["errorTrace"], str)
