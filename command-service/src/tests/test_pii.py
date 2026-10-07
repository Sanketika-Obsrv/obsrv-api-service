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


def test_no_suffix_fields_are_not_falsely_flagged_as_phone(service):
    event = {"no_of_items": 3, "is_no": True, "employee_no": "E123"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert "no_of_items" not in types
    assert "is_no" not in types
    assert "employee_no" not in types


def test_generic_number_fields_are_not_falsely_flagged_as_phone(service):
    event = {"order_number": "ORD123", "invoice_number": "INV456", "serial_num": "SN789"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert "order_number" not in types
    assert "invoice_number" not in types
    assert "serial_num" not in types


def test_camelcase_fields_are_detected(service):
    event = {
        "customerEmail": "x",
        "customerPhoneNumber": "x",
        "userID": "x",
        "CustomerAddress": "x",
    }
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["customerEmail"] == "internet"
    assert types["customerPhoneNumber"] == "phone"
    assert types["userID"] == "id"
    assert types["CustomerAddress"] == "address"


def test_technical_ids_are_not_falsely_flagged_as_personal_id(service):
    event = {
        "dataset_id": "ds1",
        "connector_id": "c1",
        "batch_id": "b1",
        "request_id": "r1",
        "tenant_id": "t1",
    }
    types = _types_by_field(service.detect_pii_fields(event))
    assert types == {}


def test_personal_id_fields_still_detected_alongside_technical_ones(service):
    event = {"customer_id": "x", "patient_id": "x", "dataset_id": "x"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["customer_id"] == "id"
    assert types["patient_id"] == "id"
    assert "dataset_id" not in types


def test_name_fields_are_detected(service):
    event = {"customer_name": "Jane Doe", "full_name": "John Smith", "fullName": "Alex Lee"}
    types = _types_by_field(service.detect_pii_fields(event))
    assert types["customer_name"] == "name"
    assert types["full_name"] == "name"
    assert types["fullName"] == "name"


def test_error_fallback_matches_declared_str_types(service, monkeypatch):
    def boom(*args, **kwargs):
        raise ValueError("synthetic failure")

    monkeypatch.setattr(service.model, "detect_pii", boom)
    result = service.detect_pii_fields({"any_field": "value"})

    assert isinstance(result, dict)
    assert isinstance(result["errorMsg"], str)
    assert isinstance(result["errorTrace"], str)
