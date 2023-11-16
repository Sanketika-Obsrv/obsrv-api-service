from dataclasses import dataclass
from dataclasses_json import dataclass_json
from enum import Enum

class Command(Enum):
    RESTART_PIPELINE = "RESTART_PIPELINE"

class Action(Enum):
    RESTART_PIPELINE_JOBS = "RESTART_PIPELINE_JOBS"

@dataclass_json
@dataclass
class CommandPayload():
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

@dataclass_json
@dataclass
class Result:
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

