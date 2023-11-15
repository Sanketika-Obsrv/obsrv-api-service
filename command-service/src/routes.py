from fastapi import FastAPI, status
from command.command_executor import CommandExecutor
from model.data_models import Request, Response, Result, ActionResponse
from datetime import datetime as dt

app = FastAPI()
command_executor = CommandExecutor()

@app.post("/system/dataset/command")
async def restart_pipeline(request: Request):
    data = request.data
    result: ActionResponse = command_executor.execute_command(payload=data)
    if result.status_code == status.HTTP_404_NOT_FOUND:
        response = get_response_object(request_id=request.id, response_code="ERROR",
                                        status_code=status.HTTP_404_NOT_FOUND, message=result.error_message)
    elif result.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
        response = get_response_object(request_id=request.id, response_code="ERROR",
                                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=result.error_message)
    else:
        response = get_response_object(request_id=request.id, response_code="OK",
                                        status_code=status.HTTP_200_OK, message="RESTARTING_PIPELINE_SUCCESSFUL")
    return response

def get_response_object(request_id, response_code, status_code, message=None):
    response = Response(id=request_id, 
                        response_code=response_code, 
                        status_code=status_code,
                        ts=dt.now().strftime("%Y-%m-%d %H:%M:%S"),
                        result=Result(message=message))
    return response
