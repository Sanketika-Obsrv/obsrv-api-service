# 2. PII detection rules and scoring

## Status

Accepted

## Context

PII detection (`command-service/src/service/`) checks each field of a sample event against value patterns and field-name ("key") rules in `command-service/src/config/pii_rules.yml`. The console sends flattened events, so nested fields arrive as dotted paths (`student.name`). The key rules missed prefixed fields (`customer_email`), flagged platform metadata (`dataset_name`, `transaction_id`) as PII, and the score fell as more evidence was added.

## Decision

- Field names are normalized before key rules run: camelCase is split, everything is lowercased, and every run of characters other than letters, digits and `.` becomes `_`. `.` is kept because it marks nesting, so the name rule can tell a top-level `name` from a nested one.
- Key-rule boundaries exclude letters only, not digits, so `name1` or `address1` still match. `name` and `address` have no value pattern to catch a miss.
- `name` matches a person-name compound: one of `first`, `last`, `middle`, `full`, `given`, `sur`, `maiden`, `customer`, `cust`, `user`, `person`, `employee`, `emp`, `contact`, `student`, `guardian`, `parent`, `father`, `mother`, `teacher`, `patient`, `holder`, `nominee`, `social` or `professional`, optionally followed by a number, then `name`, joined by `_`, `-`, `.` or nothing (`guardian_1_name`, `student.name`, `username`). It also matches `fname`, `lname`, and a bare `name` or `name` plus a number at the top level of the event (`name`, `name_1`, `name.first`). Any other `*_name` field, such as `schema_name` or `topic_name`, is not flagged.
- `financial` matches only compounds that carry account or card identifiers: `account_number`/`account_no`, `card_number`, `credit_card`/`debit_card`, `iban`, `swift_code`. Bare `account`, `transaction`, `credit` and `debit` matched ids and amounts.
- The credit-card value rule matches 15–16 digits, or four groups of four, with no digit directly before or after, so the tail of a longer id isn't flagged. It has no Luhn check, so any standalone 15–16-digit number (for example an epoch-microsecond timestamp) is still flagged.
- `id` has no key rule. It is detected by value pattern only (Aadhaar, PAN, SSN).
- Each matching rule contributes its own `score`, or 0.8 if the rule doesn't set one. A rule counts once however many times it matches. Scores combine as noisy-OR, `1 - prod(1 - s)`, so adding a matching reason never lowers the result.

## Consequences

A person-name field whose name isn't on the list and isn't a top-level `name` (for example `display_name`) is not suggested; the list is the place to extend. Since the endpoint only suggests fields, a missed field is the costlier mistake, so the list leans towards inclusion. A `name` nested under anything other than a person keyword is not flagged, so telemetry fields such as `context.pdata.name`, `object.name` and `edata.item.name` don't produce suggestions on every telemetry dataset. A nested person name under an object the list doesn't know about (`patron.name`) is missed.

The rules file is read from a path relative to `re_pii_model.py`, not the working directory.
