import time
import uuid
from datetime import datetime as dt
from typing import List

from fastapi import FastAPI
from fastapi import Request as FastAPIRequest
from fastapi import Response, status
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import CollectorRegistry, generate_latest

from command.command_executor import CommandExecutor
from command.connector_registry import ConnectorRegistry
from metrics import Helper
from model.data_models import (
    ActionResponse,
    ConnectorResponseModel,
    DatasetRequest,
    DatasetResponse,
    PIIError,
    PIIResult,
    Request,
    Response,
    Result,
)
from service.detect_pii_service import DetectPIIService

app = FastAPI()
command_executor = CommandExecutor()
pii_service = DetectPIIService()
registry = CollectorRegistry()
helper = Helper(registry)

system_dataset_endpoint = "/system/v1/dataset/command"


@app.post(system_dataset_endpoint)
async def publish_dataset(request: Request):
    start_time = int(time.time() * 1000)
    data = request.data
    helper.onRequest(
        entity="dataset",
        id=request.id,
        endpoint=system_dataset_endpoint,
        dataset_id=data.dataset_id,
    )
    result: ActionResponse = command_executor.execute_command(
        payload=data, ts=start_time
    )
    if result.status_code == status.HTTP_404_NOT_FOUND:
        helper.onFailedRequest(
            entity="dataset",
            id=request.id,
            endpoint=system_dataset_endpoint,
            dataset_id=data.dataset_id,
            status=404,
        )
        response = get_response_object(
            dataset_id=data.dataset_id,
            request_id=request.id,
            response_code="ERROR",
            status_code=status.HTTP_404_NOT_FOUND,
            message=result.error_message,
        )
    elif result.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
        helper.onFailedRequest(
            entity="dataset",
            id=request.id,
            endpoint=system_dataset_endpoint,
            dataset_id=data.dataset_id,
            status=500,
        )
        response = get_response_object(
            dataset_id=data.dataset_id,
            request_id=request.id,
            response_code="ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=result.error_message,
        )
    else:
        helper.onSuccessRequest(
            entity="dataset",
            id=request.id,
            endpoint=system_dataset_endpoint,
            dataset_id=data.dataset_id,
        )
        response = get_response_object(
            dataset_id=data.dataset_id,
            request_id=request.id,
            response_code="OK",
            status_code=status.HTTP_200_OK,
            message="PUBLISH_DATASET_SUCCESSFUL",
        )
    return response


def get_response_object(
    dataset_id, request_id, response_code, status_code, message=None
):
    response = Response(
        id=request_id,
        response_code=response_code,
        status_code=status_code,
        ts=dt.now().strftime("%Y-%m-%d %H:%M:%S"),
        result=Result(dataset_id=dataset_id, message=message),
    )
    return response


pii_endpoint = "/system/data/v1/analyze/pii"


@app.post(pii_endpoint)
def analyze_pii(request: DatasetRequest) -> DatasetResponse:
    helper.onRequest(
        entity="dataset", id=request.id, endpoint=pii_endpoint, dataset_id=None
    )
    try:
        event_data = request.data[0]
    except Exception as err:
        result: PIIError = {
            "errorCode": 500,
            "errorMsg": type(err),
            "errorTrace": err.args,
        }
    else:
        result: List[PIIResult] | PIIError = pii_service.detect_pii_fields(event_data)
    finally:
        if type(result) == list:
            helper.onSuccessRequest(
                entity="dataset", id=request.id, endpoint=pii_endpoint, dataset_id=None
            )
            response_code = "OK"
            status_code = 200
        else:
            helper.onFailedRequest(
                entity="dataset",
                id=request.id,
                endpoint=pii_endpoint,
                dataset_id=None,
                status=500,
            )
            response_code = "INTERNAL_SERVER_ERROR"
            status_code = 500
        response: DatasetResponse = {
            "id": str(uuid.uuid4()),
            "response_code": response_code,
            "status_code": status_code,
            "result": result,
            "ts": str(time.time() * 1000),
            "params": {"status": "ACTIVE"},
        }
        return response


@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    data = generate_latest(registry=registry)
    return data


connector_registry_endpoint = "/connector/v1/register"


@app.post(connector_registry_endpoint)
async def register_connector(req: FastAPIRequest):
    response = ConnectorResponseModel(id="api.connector.registry", ver="1.0")
    try:
        data = await req.json()
        response.params.msgid = data.get("params", {}).get("msgid", str(uuid.uuid4()))

        # Get the connector relative path in data
        download_url: str = data.get("download_url", None)
        file_name: str = data.get("file_name", None)

        print(
            f"Connector Registry | Received request to register connector: {rel_path}"
        )

        if not download_url:
            response.params.status = "Failure"
            return JSONResponse(
                {
                    "id": response.id,
                    "ver": response.ver,
                    "ts": response.ts,
                    "params": response.params.to_dict(),
                    "responseCode": status.HTTP_400_BAD_REQUEST,
                    "error": {"message": "connector download path is missing."},
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        executor = ConnectorRegistry()
        result = executor.register(download_url, file_name)
        response.params.status = result.status

        content = {
            "id": response.id,
            "ver": response.ver,
            "ts": response.ts,
            "params": response.params.to_dict(),
            "responseCode": result.status,
        }

        print(f"Connector Registry | Connector registration status: {content}")

        if result.status == "success":
            content["message"] = "connector registered successfully."
            content["connector_info"] = result.connector_info
        else:
            content["error"] = {"message": result.message}

        return JSONResponse(content=content, status_code=result.statusCode)

    except Exception as e:
        print(f"Connector Registry | An error occurred while Calling API: {e}")
        return JSONResponse(
            content={
                "id": response.id,
                "ver": response.ver,
                "ts": response.ts,
                "params": response.params.to_dict(),
                "responseCode": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "error": {"message": str(e)},
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


if __name__ == "__main__":
    import uvicorn

    print("Starting server")
    config = uvicorn.Config("routes:app", port=8000, log_level="info")
    server = uvicorn.Server(config)
    server.run()
