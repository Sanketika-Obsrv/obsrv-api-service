# 2. PII detection rules and scoring

## Status

Accepted

## Context

PII detection (`command-service/src/service/`) checks each field of a sample event against value patterns and field-name ("key") rules in `command-service/src/config/pii_rules.yml`. The console sends flattened events, so nested fields arrive as dotted paths (`student.name`). The key rules missed prefixed fields (`customer_email`), flagged platform metadata (`dataset_name`, `transaction_id`) as PII, and the score fell as more evidence was added.

## Decision

- Field names are normalized before key rules run: camelCase is split, everything is lowercased, and every run of characters other than letters, digits and `.` becomes `_`. `.` is kept because it marks nesting and the name rule matches on path segments.
- Key-rule boundaries exclude letters only, not digits, so `name1` or `address1` still match. `name` and `address` have no value pattern to catch a miss.
- `name` matches a person-name compound (`first`, `last`, `middle`, `full`, `given`, `sur`, `maiden`, `customer`, `user`, `person`, `employee` or `contact`, followed by `name`) or a path segment that is exactly `name` (`name`, `student.name`, `name.first`). Any other `*_name` field, such as `schema_name` or `topic_name`, is not flagged.
- `financial` matches only compounds that carry account or card identifiers: `account_number`/`account_no`, `card_number`, `credit_card`/`debit_card`, `iban`, `swift_code`. Bare `account`, `transaction`, `credit` and `debit` matched ids and amounts.
- `id` has no key rule. It is detected by value pattern only (Aadhaar, PAN, SSN).
- Each matching rule contributes its own `score`, or 0.8 if the rule doesn't set one. A rule counts once however many times it matches. Scores combine as noisy-OR, `1 - prod(1 - s)`, so adding a matching reason never lowers the result.

## Consequences

A person-name field whose name isn't on the list and isn't a bare `name` segment (for example `display_name` or `patient_name`) is no longer suggested; the list is the place to extend. A nested object called `name` under a metadata object (`dataset.name`) is still flagged.

The rules file is read from a path relative to `re_pii_model.py`, not the working directory.
