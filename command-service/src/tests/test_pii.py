import pytest

from service.detect_pii_service import DetectPIIService


@pytest.fixture
def service():
    return DetectPIIService()


def _types_by_field(results):
    return {r["field"]: r["type"] for r in results}


def test_prefixed_fields_are_detected(service):
    event = {
        "customer_id": "CUST02912",
        "customer_email": "lallageorge@example.com",
        "customer_phone_number": "+910191540224",
        "customer_address": "H.No. 20, Sandhu Road, Dhule 002683",
    }
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["customer_id"] == "id"
    assert types["customer_email"] == "internet"
    assert types["customer_phone_number"] == "phone"
    assert types["customer_address"] == "address"


def test_bare_fields_are_still_detected(service):
    event = {
        "email": "lallageorge@example.com",
        "phone_number": "+910191540224",
        "address": "H.No. 20, Sandhu Road, Dhule 002683",
    }
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["email"] == "internet"
    assert types["phone_number"] == "phone"
    assert types["address"] == "address"


def test_credit_card_value_is_detected(service):
    event = {"payment_card": "4111111111111111"}
    results = service.detect_pii_fields(event)
    assert any(r["field"] == "payment_card" and r["type"] == "financial" for r in results)


def test_error_fallback_matches_declared_str_types(service, monkeypatch):
    def boom(*args, **kwargs):
        raise ValueError("synthetic failure")

    monkeypatch.setattr(service.model, "detect_pii", boom)
    result = service.detect_pii_fields({"any_field": "value"})

    assert isinstance(result, dict)
    assert isinstance(result["errorMsg"], str)
    assert isinstance(result["errorTrace"], str)
