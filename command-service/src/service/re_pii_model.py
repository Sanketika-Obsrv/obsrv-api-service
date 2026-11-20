import math
import re
from typing import List

import yaml

from model.data_models import PIIModel, PIIReason, PIIResult


class REPIIModel(PIIModel):
    # Marks a boundary between a lowercase/digit char and the uppercase char that
    # follows it, so camelCase/PascalCase field names (customerEmail, UserID) get
    # the same word boundaries the key rules already expect from snake_case ones.
    _CAMEL_BOUNDARY_RE = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")

    def __init__(self):
        def join(loader, node):
            seq = loader.construct_sequence(node)
            return "".join([str(i) for i in seq])

        yaml.add_constructor("!join", join)
        with open("config/pii_rules.yml", "r") as f:
            self.pii_rules = yaml.load(f, Loader=yaml.FullLoader)

    @classmethod
    def _normalize_field_name(cls, field: str) -> str:
        return cls._CAMEL_BOUNDARY_RE.sub("_", field).lower()

    def detect_pii(self, entity, field, value) -> List[PIIResult]:
        results = []
        reasons = []
        reasons += self.detect_entity(entity, value)
        reasons += self.detect_entity_in_fieldname(entity, field)
        if len(reasons) != 0:
            # Corroborating reasons should raise confidence, not dilute it -- a field that
            # matches both the value pattern AND the field-name pattern is more likely to be
            # PII than one matching only one, not less. Noisy-OR combination: each reason's
            # own score is an independent probability of being PII; 1 - prod(1 - s_i) is the
            # combined probability, monotonically non-decreasing as reasons are added.
            score = 1 - math.prod(1 - reason["score"] for reason in reasons)
            result: PIIResult = {
                "field": field,
                "type": entity,
                "score": score,
                "reason": reasons,
            }
            results.append(result)
        return results

    # Default confidence for a single rule match, used when a rule has no explicit "score".
    # Not derived from match count: a rule matching the same field twice (e.g. "name" hitting
    # both halves of "first_name_last_name") is not twice as confident as matching once --
    # 1/len(rule_matches) inverted that, scoring repeated evidence lower than single evidence.
    _DEFAULT_RULE_SCORE = 0.8

    def detect_entity(self, entity, value) -> List[PIIReason]:
        matches = []
        for rule in list(self.pii_rules["values"][entity].keys()):
            rule_def = self.pii_rules["values"][entity][rule]
            rule_matches = list(re.findall(rule_def["rule"], value))
            if len(rule_matches) != 0:
                reason: PIIReason = {
                    "code": rule_def["code"],
                    "resourceKey": rule_def["resourceKey"],
                    "region": rule_def["locale"],
                    "score": rule_def.get("score", self._DEFAULT_RULE_SCORE),
                }
                matches.append(reason)
        return matches

    def detect_entity_in_fieldname(self, entity, value) -> List[PIIReason]:
        matches = []
        key_rule = self.pii_rules["keys"].get(entity)
        if not key_rule:
            # Some entities (e.g. "id") are only detected by value pattern, not by field name
            return matches
        normalized = self._normalize_field_name(value)
        rule_matches = list(re.findall(key_rule["rule"], normalized))
        if len(rule_matches) != 0:
            reason: PIIReason = {
                "code": key_rule["code"],
                "resourceKey": key_rule["resourceKey"],
                "region": key_rule["locale"],
                "score": key_rule.get("score", self._DEFAULT_RULE_SCORE),
            }
            matches.append(reason)
        return matches
