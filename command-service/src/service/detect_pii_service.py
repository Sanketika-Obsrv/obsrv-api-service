import json
import logging
from typing import List

from model.data_models import PIIError, PIIResult
from service.re_pii_model import REPIIModel


class DetectPIIService:
    _DENORM_CONFIG_SQL = (
        "SELECT denorm_config FROM ("
        "SELECT 1 AS pref, denorm_config FROM datasets_draft WHERE dataset_id = %s "
        "UNION ALL SELECT 2, denorm_config FROM datasets WHERE dataset_id = %s"
        ") c ORDER BY pref LIMIT 1"
    )

    def __init__(self, db_service=None) -> None:
        self.model = REPIIModel()
        self.db_service = db_service

    def denorm_out_fields(self, dataset_id) -> set:
        if self.db_service is None or not dataset_id:
            return set()
        try:
            row = self.db_service.execute_select_one(self._DENORM_CONFIG_SQL, (dataset_id, dataset_id))
        except Exception as err:
            logging.warning(f"Could not read denorm_config for {dataset_id}: {err}")
            return set()
        config = (row["denorm_config"] if row else None) or {}
        if isinstance(config, str):
            config = json.loads(config)
        return {f["denorm_out_field"] for f in config.get("denorm_fields") or [] if f.get("denorm_out_field")}

    @staticmethod
    def _key_for_rules(field: str, denorm_out_fields) -> str:
        # A joined field is "<denorm_out_field>.<master field>"; key rules see the master field.
        for out_field in sorted(denorm_out_fields, key=len, reverse=True):
            if field.startswith(out_field + "."):
                return field[len(out_field) + 1:]
        return field

    def detect_pii_fields(self, event_data: dict, denorm_out_fields=()) -> List[PIIResult] | PIIError:
        try:
            results = []
            for field in list(event_data.keys()):
                key = self._key_for_rules(field, denorm_out_fields)
                value = str(event_data[field])
                for entity in ("address", "financial", "id", "internet", "phone", "name"):
                    results += self.model.detect_pii(entity, field, value, key)
            return results
        except Exception as err:
            pii_error: PIIError = {
                "errorCode": 500,
                "errorMsg": type(err).__name__,
                "errorTrace": str(err.args),
            }
            return pii_error
