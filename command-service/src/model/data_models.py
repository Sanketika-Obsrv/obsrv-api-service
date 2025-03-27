import time
from dataclasses import dataclass
from enum import Enum
from typing import List

from dataclasses_json import dataclass_json


class Command(Enum):
    PUBLISH_DATASET = "PUBLISH_DATASET"
    RESTART_PIPELINE = "RESTART_PIPELINE"
    RESTART_CONNECTORS = "RESTART_CONNECTORS"

class Action(Enum):
    SUBMIT_INGESTION_TASKS = "SUBMIT_INGESTION_TASKS"
    MAKE_DATASET_LIVE = "MAKE_DATASET_LIVE"
    CREATE_KAFKA_TOPIC = "CREATE_KAFKA_TOPIC"
    MAKE_DATASOURCE_ACTIVE = "MAKE_DATASOURCE_ACTIVE"
    START_PIPELINE_JOBS = "START_PIPELINE_JOBS"
    DEPLOY_CONNECTORS = "DEPLOY_CONNECTORS"
    CREATE_AUDIT_EVENT = "CREATE_AUDIT_EVENT"


class DatasetStatusType(Enum):
    Draft = "Draft"
    Publish = "Publish"
    ReadyToPublish = "ReadyToPublish"
    Live = "Live"
    Retired = "Retired"
    Purged = "Purged"


@dataclass_json
@dataclass
class CommandPayload:
    dataset_id: str
    command: Command


@dataclass_json
@dataclass
class Request:
    data: CommandPayload
    id: str


@dataclass_json
@dataclass
class ResponseParams:
    status: str
    resmsgid: str | None = None


@dataclass_json
@dataclass
class Result:
    dataset_id: str
    message: str


@dataclass_json
@dataclass
class Response:
    id: str
    response_code: str
    status_code: int
    result: Result
    ts: str | None = None
    params: ResponseParams | None = None


@dataclass_json
@dataclass
class HttpResponse:
    status: int
    body: str


@dataclass
class ActionResponse:
    status: str
    status_code: int
    error_message: str = None


@dataclass
class DatasetRequest:
    id: str
    dataset_id: str
    data: List[dict]


@dataclass
class PIIReason:
    code: str
    resourceKey: str
    region: str | None = None
    score: float | None = None


@dataclass
class PIIError:
    errorCode: int
    errorMsg: str
    errorTrace: str


@dataclass
class PIIResult:
    field: str
    type: str
    score: float
    reason: List[PIIReason]


@dataclass
class DatasetResponse:
    id: str
    response_code: str
    status_code: int
    result: List[PIIResult] | PIIError
    ts: str | None = None
    params: ResponseParams | None = None


class PIIModel:
    def __init__(self):
        pass

    def detect_pii(self, entity, field, value) -> PIIResult:
        return PIIResult()

    def detect_entity(self, entity, value) -> List[PIIReason]:
        return [PIIReason()]

    def detect_entity_in_fieldname(self, entity, value) -> List[PIIReason]:
        return [PIIReason()]


class ParamsModels:
    def __init__(self):
        self.status = ""
        self.msgid = ""

    def to_dict(self):
        return {"status": self.status, "msgid": self.msgid}


class ConnectorResponseModel:
    def __init__(self, id: str, ver: str):
        self.id = id
        self.ver = ver
        self.ts = str(time.time() * 1000)
        self.params = ParamsModels()
