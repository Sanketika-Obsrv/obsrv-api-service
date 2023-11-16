from command.flink_command import FlinkCommand
from exception.exception import FlinkHelmInstallException, FlinkConnectionException, HttpConnectionException
from service.http_service import HttpService
from config import Config

from model.data_models import Action, CommandPayload, ActionResponse
import logging

class CommandExecutor():

    def __init__(self):
        self.config_obj = Config()
        self.http_service = HttpService()
        self.flink_command = FlinkCommand(config=self.config_obj, http_service=self.http_service)
        self.action_commands = {}
        self.action_commands[Action.RESTART_PIPELINE_JOBS.name] = self.flink_command
        self.logger = logging.getLogger()
    
    def execute_command(self, payload: CommandPayload):
        command = payload.command.name
        workflow_commands = self.get_command_workflow(command)
        for sub_command in workflow_commands:
            command = self.action_commands[sub_command]
            print(f"Executing command {sub_command}")
            try:
                result = command.execute(command_payload=payload, action=sub_command)
            except (FlinkHelmInstallException, FlinkConnectionException, HttpConnectionException) as conn_error:
                self.logger.exception("Error when trying to connect to flink service...", conn_error)
                result = ActionResponse(status="ERROR", status_code=500, error_message="HTTP_CONNECTION_ERROR")
                return result
        return result   

    def get_command_workflow(self, action: Action):
        return self.config_obj.find("commands.{0}.workflow".format(action))