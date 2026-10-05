from typing import List

from model.data_models import PIIError, PIIResult
from service.re_pii_model import REPIIModel


class DetectPIIService:
    def __init__(self) -> None:
        self.model = REPIIModel()

    def detect_pii_fields(self, event_data: dict) -> List[PIIResult] | PIIError:
        try:
            results = []
            for field in list(event_data.keys()):
                results += self.model.detect_pii(
                    "address", field, str(event_data[field])
                )
                results += self.model.detect_pii(
                    "financial", field, str(event_data[field])
                )
                results += self.model.detect_pii("id", field, str(event_data[field]))
                results += self.model.detect_pii(
                    "internet", field, str(event_data[field])
                )
                results += self.model.detect_pii("phone", field, str(event_data[field]))
            return results
        except Exception as err:
            pii_error: PIIError = {
                "errorCode": 500,
                "errorMsg": type(err).__name__,
                "errorTrace": str(err.args),
            }
            return pii_error
